import { IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { cn } from "@/lib/utils";
import type { ColumnVote } from "@/infrastructure/turn-vote";
import { AnswerMarkdown } from "./answer-markdown";
import { ResponseMetrics } from "./response-metrics";
import { useThinkingVerb } from "./use-thinking-verb";
import { useVoteSlot } from "./vote-slot";
import type { ResolvedResponse } from "./resolve-response";

const STATE_LABEL: Readonly<Record<ResolvedResponse["state"], string>> = {
    streaming: "Streaming",
    complete: "Done",
    failed: "Failed",
};

const Thinking = ({ verb }: { readonly verb: string }) => (
    <p className="thinking">
        <span aria-hidden data-spinner className="thinking-dots">
            <span />
            <span />
            <span />
        </span>
        {verb}&hellip;
    </p>
);

export const ResponseColumn = ({
    response,
    vote,
    onRetry,
}: {
    readonly response: ResolvedResponse;
    readonly vote: ColumnVote;
    readonly onRetry: (responseId: string) => void;
}) => {
    const streaming = response.state === "streaming";
    const empty = response.text.length === 0;
    const verb = useThinkingVerb(response.id, streaming && empty);
    const Vote = useVoteSlot();

    return (
        <article
            className="answer-card"
            aria-label={response.modelName}
            data-winner={vote.state === "won" ? "" : undefined}
        >
            <header className="answer-head">
                <ModelAvatar name={response.modelName} size="sm" />

                <h3
                    className="text-foreground min-w-0 flex-1 truncate text-sm font-semibold"
                    title={response.modelId}
                >
                    {response.modelName}
                </h3>

                <span className="answer-state" data-state={response.state}>
                    <span aria-hidden className="answer-dot" />
                    <span className="label-meta">{STATE_LABEL[response.state]}</span>
                </span>
            </header>

            <div className="answer-body">
                {streaming && empty && <Thinking verb={verb} />}

                {!empty && <AnswerMarkdown text={response.text} streaming={streaming} />}

                {response.message !== null && (
                    <p
                        role="alert"
                        className={cn(
                            "text-foreground text-pretty text-sm",
                            !empty && "mt-3",
                        )}
                    >
                        {response.message}
                    </p>
                )}

                {response.state === "failed" && (
                    <div className="mt-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRetry(response.id)}
                        >
                            <IconRefresh aria-hidden stroke={1.75} />
                            Retry this model
                        </Button>
                    </div>
                )}
            </div>

            {Vote !== null && vote.state !== "closed" && (
                <div className="answer-vote">
                    <Vote vote={vote} />
                </div>
            )}

            <footer className="answer-foot">
                <ResponseMetrics metrics={response.metrics} />
            </footer>
        </article>
    );
};
