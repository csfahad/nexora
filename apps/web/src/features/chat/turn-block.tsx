import type { CSSProperties } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { latestAttempts } from "@/infrastructure/response-order";
import { columnVotes, voteFor } from "@/infrastructure/turn-vote";
import { resolveResponse } from "./resolve-response";
import type { LiveResponse } from "./arena-stream";
import type { ThreadTurn } from "./get-thread";
import { ResponseColumn } from "./response-column";

export const TurnBlock = ({
    turn,
    live,
    onRetry,
}: {
    readonly turn: ThreadTurn;
    readonly live: ReadonlyMap<string, LiveResponse>;
    readonly onRetry: (responseId: string) => void;
}) => {
    const responses = latestAttempts(turn.responses).map((row) =>
        resolveResponse(row, live),
    );

    const votes = columnVotes(
        { id: turn.id, winnerResponseId: turn.vote?.winnerResponseId ?? null },
        responses,
    );

    return (
        <section className="flex flex-col gap-3" aria-label="Turn">
            <div className="prompt-turn">
                <p className="prompt-bubble">{turn.prompt}</p>
                <CopyButton text={turn.prompt} label="Copy prompt" />
            </div>

            <div
                className="turn-columns"
                style={{ "--columns": responses.length } as CSSProperties}
            >
                {responses.map((response) => (
                    <ResponseColumn
                        key={response.modelId}
                        response={response}
                        vote={voteFor(votes, response.id)}
                        onRetry={onRetry}
                    />
                ))}
            </div>
        </section>
    );
};
