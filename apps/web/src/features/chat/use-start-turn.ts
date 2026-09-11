import { useCallback, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useArenaStream } from "./arena-stream";
import { TURN_SAVE_FAILED, TURN_SIGNED_OUT, startTurn } from "./start-turn";
import type { StartTurnInput } from "./start-turn";

export const useStartTurn = (): Readonly<{
    send: (input: StartTurnInput) => Promise<string | null>;
    notice: string | null;
}> => {
    const { start } = useArenaStream();
    const router = useRouter();
    const [notice, setNotice] = useState<string | null>(null);

    const send = useCallback(
        async (input: StartTurnInput): Promise<string | null> => {
            setNotice(null);

            const result = await startTurn({ data: input }).catch((error: unknown) => {
                console.error("[chat] turn could not be started", error);
                return null;
            });

            if (result === null) {
                setNotice(TURN_SAVE_FAILED);
                return null;
            }

            if (result.status === "signed-out") {
                setNotice(TURN_SIGNED_OUT);
                return null;
            }

            if (result.status === "error") {
                setNotice(result.message);
                return null;
            }

            start(result.responses);

            if (input.threadId !== undefined) await router.invalidate();
            return result.threadId;
        },
        [start, router],
    );

    return { send, notice };
};
