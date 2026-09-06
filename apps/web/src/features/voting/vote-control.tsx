import { useEffect, useRef } from "react";
import { IconTrophy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { ColumnVote } from "@/infrastructure/turn-vote";
import { useCastVote } from "./use-cast-vote";

export const VoteControl = ({ vote }: { readonly vote: ColumnVote }) => {
    const { pick, pending, message, justVoted } = useCastVote();
    const mark = useRef<HTMLParagraphElement>(null);
    const won = vote.state === "won";

    useEffect(() => {
        if (won && justVoted) mark.current?.focus();
    }, [won, justVoted]);

    if (won) {
        return (
            <p ref={mark} tabIndex={-1} className="winner-mark">
                <IconTrophy aria-hidden stroke={2} />
                Winner
                {justVoted && <span className="sr-only">, your vote was saved</span>}
            </p>
        );
    }

    if (vote.state !== "open") return null;

    const { turnId, responseId, modelName } = vote;

    return (
        <div className="flex min-w-0 flex-col items-end gap-1.5">
            <Button
                variant="outline"
                size="sm"
                loading={pending}
                aria-label={`Pick ${modelName} as the best answer to this prompt`}
                onClick={() => {
                    void pick(turnId, responseId);
                }}
            >
                <IconTrophy aria-hidden stroke={1.75} />
                Pick this one
            </Button>

            {message !== null && (
                <p role="alert" className="text-foreground text-pretty text-xs">
                    {message}
                </p>
            )}
        </div>
    );
};
