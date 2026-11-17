import { useSyncExternalStore } from "react";
import { useRouter } from "@tanstack/react-router";
import { createStore } from "@/lib/create-store";
import type { ThreadHistoryGroup, ThreadHistoryItem } from "./thread-history";

type HistoryChange = Readonly<{
    ticket: string;
    title: string | null;
    busy: boolean;
    previous?: HistoryChange;
}>;
type ShellSnapshot = Readonly<{
    changes: ReadonlyMap<string, HistoryChange>;
    notice: string | null;
    signingOut: boolean;
    revoked: boolean;
    added: readonly ThreadHistoryItem[];
}>;
const initialSnapshot = (): ShellSnapshot => ({
    changes: new Map(),
    notice: null,
    signingOut: false,
    revoked: false,
    added: [],
});

export const applyHistoryChanges = (
    groups: readonly ThreadHistoryGroup[],
    changes: ShellSnapshot["changes"],
    added: readonly ThreadHistoryItem[] = [],
): readonly ThreadHistoryGroup[] => {
    const missing = added.filter(
        (thread) =>
            !groups.some((group) => group.threads.some((row) => row.id === thread.id)),
    );
    const combined =
        missing.length > 0
            ? [{ label: "Today" as const, threads: missing }, ...groups]
            : groups;
    return combined
        .map((group) => ({
            ...group,
            threads: group.threads.flatMap((thread) => {
                const change = changes.get(thread.id);
                return change?.title === null
                    ? []
                    : [{ ...thread, title: change?.title ?? thread.title }];
            }),
        }))
        .filter((group) => group.threads.length > 0);
};

export const createShellState = () => {
    const store = createStore(initialSnapshot());
    return {
        ...store,
        begin: (threadId: string, title: string | null) => {
            if (store.getSnapshot().changes.get(threadId)?.busy) return null;
            const ticket = crypto.randomUUID();
            store.update((current) => ({
                ...current,
                notice: null,
                changes: new Map(current.changes).set(threadId, {
                    ticket,
                    title,
                    busy: true,
                    previous: current.changes.get(threadId),
                }),
            }));
            return ticket;
        },
        finish: (threadId: string, ticket: string, refreshed: boolean) => {
            if (store.getSnapshot().changes.get(threadId)?.ticket !== ticket) return;
            store.update((current) => ({
                ...current,
                changes: new Map(
                    [...current.changes].flatMap(([id, change]) =>
                        id !== threadId
                            ? [[id, change] as const]
                            : refreshed
                              ? []
                              : [[id, { ...change, busy: false }] as const],
                    ),
                ),
            }));
        },
        rollback: (threadId: string, ticket: string) => {
            const change = store.getSnapshot().changes.get(threadId);
            if (change?.ticket !== ticket) return;
            store.update((current) => ({
                ...current,
                changes: new Map(
                    [...current.changes].flatMap(([id, entry]) =>
                        id !== threadId
                            ? [[id, entry] as const]
                            : change.previous
                              ? [[id, change.previous] as const]
                              : [],
                    ),
                ),
            }));
        },
        add: (thread: ThreadHistoryItem) =>
            store.update((current) =>
                current.revoked
                    ? current
                    : {
                          ...current,
                          added: [
                              thread,
                              ...current.added.filter((row) => row.id !== thread.id),
                          ].slice(0, 50),
                      },
            ),
        removeAdded: (threadId: string) =>
            store.update((current) => ({
                ...current,
                added: current.added.filter((thread) => thread.id !== threadId),
            })),
        notify: (notice: string | null) =>
            store.update((current) => ({ ...current, notice })),
        setSigningOut: (signingOut: boolean) =>
            store.update((current) => ({ ...current, signingOut })),
        revoke: () =>
            store.update((current) => ({
                ...current,
                revoked: true,
                changes: new Map(),
                added: [],
                notice: null,
            })),
        reset: () => store.update(initialSnapshot),
    };
};
export type ShellState = ReturnType<typeof createShellState>;

export const useShellState = () => {
    const shell = useRouter().options.context.shell;
    const snapshot = useSyncExternalStore(
        shell.subscribe,
        shell.getSnapshot,
        shell.getSnapshot,
    );
    return { shell, ...snapshot };
};
