import type { ReactNode } from "react";
import type { ThreadView } from "./get-thread";
import { ThreadScroller } from "./thread-scroller";
import { ThreadTranscript } from "./thread-transcript";

export const ThreadScreen = ({
    thread,
    composer,
}: {
    readonly thread: ThreadView;
    readonly composer: ReactNode;
}) => (
    <div className="screen">
        <ThreadScroller key={thread.id} turnCount={thread.turns.length}>
            <ThreadTranscript thread={thread} />
        </ThreadScroller>

        <div className="mx-auto w-full max-w-6xl shrink-0 px-4 pb-3 pt-2">{composer}</div>
    </div>
);
