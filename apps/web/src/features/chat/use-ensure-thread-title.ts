import { useEffect, useRef } from "react";
import { useRouter } from "@tanstack/react-router";
import { useArenaStream } from "./arena-stream";
import { TITLE_WATCH_TURNS, ensureThreadTitle } from "./thread-title";

export const useEnsureThreadTitle = (threadId: string, turnCount: number): void => {
    const router = useRouter();
    const { streaming } = useArenaStream();
    const wasStreaming = useRef(false);

    useEffect(() => {
        const settled = wasStreaming.current && !streaming;
        wasStreaming.current = streaming;

        if (!settled || turnCount > TITLE_WATCH_TURNS) return;

        void ensureThreadTitle({ data: { threadId } })
            .then(async (result) => {
                if (result.status === "titled") await router.invalidate();
            })
            .catch((error: unknown) => {
                console.error("[chat] thread title could not be generated", error);
            });
    }, [streaming, threadId, turnCount, router]);
};
