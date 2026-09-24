import { Link } from "@tanstack/react-router";
import { IconEye } from "@tabler/icons-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonClasses } from "@/components/ui/button";
import { TurnBlock } from "./turn-block";
import type { SharedThreadView } from "./get-shared-thread";

export const SharedThreadScreen = ({ thread }: { readonly thread: SharedThreadView }) => (
    <div className="screen">
        <header className="border-border flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <Link
                to="/"
                aria-label="Nexora — go to arena"
                className="font-heading text-foreground shrink-0 rounded-md text-lg font-semibold tracking-tight"
            >
                Nexora
            </Link>

            <span aria-hidden className="bg-border h-5 w-px shrink-0" />

            <h1 className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                {thread.title}
            </h1>

            <p className="share-badge">
                <IconEye aria-hidden stroke={1.75} />
                Read-only
            </p>

            <ThemeToggle className="hidden shrink-0 sm:inline-flex" />
        </header>

        <div className="screen-scroll min-h-0 flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 py-6">
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
        </div>
    </div>
);
