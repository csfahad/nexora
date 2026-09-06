import { useCallback, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { VOTE_FAILED, VOTE_SIGNED_OUT, castVote } from "./cast-vote";

export const useCastVote = () => {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [justVoted, setJustVoted] = useState(false);

    const pick = useCallback(
        async (turnId: string, winnerResponseId: string): Promise<void> => {
            setPending(true);
            setMessage(null);

            try {
                const result = await castVote({ data: { turnId, winnerResponseId } });

                if (result.status === "signed-out") {
                    setMessage(VOTE_SIGNED_OUT);
                    return;
                }

                if (result.status === "error") {
                    setMessage(result.message);
                    return;
                }

                setJustVoted(true);
                await router.invalidate();
            } catch (error) {
                console.error("[voting] the vote request failed:", error);
                setMessage(VOTE_FAILED);
            } finally {
                setPending(false);
            }
        },
        [router],
    );

    return { pick, pending, message, justVoted };
};
