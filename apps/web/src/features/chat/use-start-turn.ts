import { useCallback, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useArenaStream } from "./arena-stream";
import { TURN_SAVE_FAILED, TURN_SIGNED_OUT, startTurn } from "./start-turn";
import type { StartTurnInput } from "./start-turn";
import type { ThreadView } from "./get-thread";
import { useChatState } from "./optimistic-turns";
import { restoreSubmittedDraft } from "@/infrastructure/composer-draft";

export const useStartTurn = (): Readonly<{
    send: (
        input: StartTurnInput,
        thread: ThreadView,
        models?: readonly Readonly<{ modelId: string; modelName: string }>[],
    ) => Promise<string | null>;
    notice: string | null;
}> => {
    const { start } = useArenaStream();
    const router = useRouter();
    const { chat } = useChatState();
    const [notice, setNotice] = useState<string | null>(null);

    const send = useCallback(
        async (
            input: StartTurnInput,
            thread: ThreadView,
            selectedModels?: readonly Readonly<{ modelId: string; modelName: string }>[],
        ): Promise<string | null> => {
            const models =
                selectedModels ??
                input.modelIds.map((modelId) => ({
                    modelId,
                    modelName:
                        thread.turns[0]?.responses.find((row) => row.modelId === modelId)
                            ?.modelName ?? modelId,
                }));
            const ticket = chat.begin(thread, input.prompt, models);
            if (ticket === null) return null;
            setNotice(null);

            const result = await startTurn({ data: input }).catch((error: unknown) => {
                console.error("[chat] turn could not be started", error);
                return null;
            });

            if (!chat.isCurrent(ticket)) return null;
            if (result === null || result.status !== "started") {
                restoreSubmittedDraft(input.threadId ?? "arena", input.prompt);
                chat.fail(ticket);
                setNotice(
                    result === null
                        ? TURN_SAVE_FAILED
                        : result.status === "signed-out"
                          ? TURN_SIGNED_OUT
                          : result.message,
                );
                return null;
            }

            if (!chat.accept(ticket, result)) return null;
            start(result.responses);

            if (input.threadId !== undefined)
                void router
                    .invalidate()
                    .catch((error: unknown) =>
                        console.error("[chat] refresh failed", error),
                    );
            return result.threadId;
        },
        [start, router, chat],
    );

    return { send, notice };
};
