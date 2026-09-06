import { useArenaStream } from "./arena-stream";
import type { ThreadView } from "./get-thread";
import { TurnBlock } from "./turn-block";

export const ThreadTranscript = ({ thread }: { readonly thread: ThreadView }) => {
    const { live, retry, retryError } = useArenaStream();

    return (
        <div className="flex flex-col gap-8">
            {thread.turns.map((turn) => (
                <TurnBlock key={turn.id} turn={turn} live={live} onRetry={retry} />
            ))}

            {retryError !== null && (
                <p
                    role="alert"
                    className="text-foreground text-pretty text-center text-sm"
                >
                    {retryError}
                </p>
            )}
        </div>
    );
};
