import { Link } from "@tanstack/react-router";
import { IconEye } from "@tabler/icons-react";
import { StandaloneHeader } from "@/components/ui/standalone-header";
import { buttonClasses } from "@/components/ui/button";
import { TurnBlock } from "./turn-block";
import type { SharedThreadView } from "./get-shared-thread";

export const SharedThreadScreen = ({ thread }: { readonly thread: SharedThreadView }) => (
    <div className="screen">
        <a href="#shared-main" className="skip-link">
            Skip to content
        </a>
        <StandaloneHeader title={thread.title} titleAsHeading>
            <p className="share-badge">
                <IconEye aria-hidden stroke={1.75} />
                Read-only
            </p>
        </StandaloneHeader>

        <main id="shared-main" tabIndex={-1} className="screen-scroll min-h-0 flex-1">
            <div className="thread-content">
                <div className="flex flex-col gap-8">
                    {thread.turns.map((turn) => (
                        <TurnBlock key={turn.id} turn={turn} sealed />
                    ))}
                </div>

                <div className="border-border mt-10 flex flex-col items-center gap-3 border-t pt-8 text-center">
                    <p className="text-muted-foreground text-pretty text-sm">
                        This is a snapshot of someone else&rsquo;s comparison. Run your
                        own prompt against three models and see what they do with it.
                    </p>

                    <Link to="/" className={buttonClasses({ variant: "outline" })}>
                        Try your own prompt
                    </Link>
                </div>
            </div>
        </main>
    </div>
);
