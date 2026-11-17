import { useSyncExternalStore } from "react";
import { useRouter } from "@tanstack/react-router";
import { createStore } from "@/lib/create-store";
import type { ThreadTurn, ThreadView } from "./get-thread";
import type { StartTurnResult } from "./start-turn";

type ChatSnapshot = Readonly<{
    pending: ThreadView | null;
    created: ThreadView | null;
    saved: ReadonlyMap<string, readonly ThreadTurn[]>;
    failedModelIds: readonly string[] | undefined;
}>;

const initialSnapshot = (): ChatSnapshot => ({
    pending: null,
    created: null,
    saved: new Map(),
    failedModelIds: undefined,
});

export const mergeTurns = (
    thread: ThreadView,
    extra: readonly ThreadTurn[],
): ThreadView => ({
    ...thread,
    turns: [
        ...thread.turns,
        ...extra.filter((turn) => !thread.turns.some((row) => row.id === turn.id)),
    ],
});

export const createChatState = () => {
    const store = createStore(initialSnapshot());
    const seeds = new Map<string, ThreadView>();
    const isCurrent = (ticket: string) =>
        store.getSnapshot().pending?.turns.at(-1)?.id === ticket;
    const preview = (thread: ThreadView): ThreadView => {
        const { pending, saved } = store.getSnapshot();
        const extra =
            pending?.id === thread.id ? pending.turns : (saved.get(thread.id) ?? []);
        return mergeTurns(thread, extra);
    };

    return {
        ...store,
        preview,
        isCurrent,
        begin: (
            thread: ThreadView,
            prompt: string,
            models: readonly Readonly<{ modelId: string; modelName: string }>[],
        ) => {
            if (store.getSnapshot().pending !== null) return null;
            const ticket = `pending:${crypto.randomUUID()}`;
            const turn: ThreadTurn = {
                id: ticket,
                prompt,
                vote: null,
                responses: models.map((model) => ({
                    ...model,
                    id: `${ticket}:${model.modelId}`,
                    status: "STREAMING",
                    content: "",
                    failure: null,
                    metrics: null,
                    pending: true,
                })),
            };
            store.update((current) => ({
                ...current,
                pending: mergeTurns(preview(thread), [turn]),
                failedModelIds: undefined,
            }));
            return ticket;
        },
        fail: (ticket: string) => {
            if (isCurrent(ticket))
                store.update((current) => ({
                    ...current,
                    failedModelIds:
                        current.pending?.id === "pending:new"
                            ? current.pending.modelIds
                            : undefined,
                    pending: null,
                }));
        },
        accept: (
            ticket: string,
            result: Extract<StartTurnResult, { status: "started" }>,
        ) => {
            const pending = store.getSnapshot().pending;
            const queued = pending?.turns.at(-1);
            if (!pending || queued?.id !== ticket) return false;
            const turn: ThreadTurn = {
                ...queued,
                id: result.turnId,
                responses: result.responses.map((response) => ({
                    id: response.id,
                    modelId: response.modelId,
                    modelName: response.modelName,
                    status: response.available ? "STREAMING" : "FAILED",
                    content: "",
                    failure: response.available ? null : "MODEL_UNAVAILABLE",
                    metrics: null,
                    pending: response.available,
                })),
            };
            const thread = {
                ...pending,
                id: result.threadId,
                turns: [...pending.turns.slice(0, -1), turn],
            };
            const created = pending.id.startsWith("pending:");
            if (created) seeds.set(result.threadId, thread);
            store.update((current) => ({
                ...current,
                pending: null,
                created: created ? thread : current.created,
                saved: new Map(current.saved).set(result.threadId, thread.turns),
            }));
            return true;
        },
        takeSeed: (threadId: string) => {
            const seed = seeds.get(threadId);
            seeds.delete(threadId);
            return seed;
        },
        opened: (threadId: string) => {
            store.update((current) => ({
                ...current,
                created: current.created?.id === threadId ? null : current.created,
            }));
        },
        reconcile: (thread: ThreadView) => {
            const saved = store.getSnapshot().saved.get(thread.id);
            if (saved?.every((turn) => thread.turns.some((row) => row.id === turn.id))) {
                store.update((current) => ({
                    ...current,
                    saved: new Map([...current.saved].filter(([id]) => id !== thread.id)),
                }));
            }
        },
        forget: (threadId: string) => {
            seeds.delete(threadId);
            store.update((current) => ({
                ...current,
                saved: new Map([...current.saved].filter(([id]) => id !== threadId)),
                created: current.created?.id === threadId ? null : current.created,
                pending: current.pending?.id === threadId ? null : current.pending,
            }));
        },
        reset: () => {
            seeds.clear();
            store.update(initialSnapshot);
        },
    };
};

export type ChatState = ReturnType<typeof createChatState>;

export const useChatState = () => {
    const chat = useRouter().options.context.chat;
    const snapshot = useSyncExternalStore(
        chat.subscribe,
        chat.getSnapshot,
        chat.getSnapshot,
    );
    return { chat, ...snapshot };
};
