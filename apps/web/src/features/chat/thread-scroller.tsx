import { useMemo } from "react";
import type { ReactNode } from "react";
import { IconArrowUp, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useArenaStream } from "./arena-stream";
import { useThreadScroll } from "./use-thread-scroll";

export const ThreadScroller = ({
    turnCount,
    children,
}: {
    readonly turnCount: number;
    readonly children: ReactNode;
}) => {
    const { live } = useArenaStream();

    const streamed = useMemo(
        () => [...live.values()].reduce((total, entry) => total + entry.text.length, 0),
        [live],
    );

    const { scrollerRef, settled, scrolled, toTop } = useThreadScroll({
        jumpOn: turnCount,
        followOn: streamed,
    });

    return (
        <div className="relative min-h-0 flex-1">
            <div ref={scrollerRef} className="h-full overflow-y-auto">
                <div
                    className={cn(
                        "mx-auto w-full max-w-6xl px-4 py-6",
                        !settled && "invisible",
                    )}
                >
                    {children}
                </div>
            </div>

            {!settled && (
                <div
                    role="status"
                    className="bg-background absolute inset-0 grid place-items-center"
                >
                    <IconLoader2
                        aria-hidden
                        data-spinner
                        className="text-muted-foreground size-6 animate-spin"
                    />
                    <span className="sr-only">Loading this thread</span>
                </div>
            )}

            {scrolled && (
                <div className="pointer-events-none absolute inset-x-0 bottom-3">
                    <div className="mx-auto flex w-full max-w-6xl justify-end px-4">
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={toTop}
                            aria-label="Scroll to top"
                            className="bg-card/90 pointer-events-auto rounded-full shadow-sm backdrop-blur-sm"
                        >
                            <IconArrowUp aria-hidden stroke={2} />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
