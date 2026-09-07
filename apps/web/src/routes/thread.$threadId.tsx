import { useMemo, useState } from "react";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import { buttonClasses } from "@/components/ui/button";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import { PromptComposer } from "@/features/arena/prompt-composer";
import { useArenaStream } from "@/features/chat/arena-stream";
import { THREAD_READ_FAILED, getThread } from "@/features/chat/get-thread";
import { LockedModels } from "@/features/chat/locked-models";
import { THREAD_NOT_FOUND } from "@/features/chat/start-turn";
import { ThreadScreen } from "@/features/chat/thread-screen";
import { ThreadWinRates } from "@/features/chat/thread-win-rates";
import { useStartTurn } from "@/features/chat/use-start-turn";
import { VoteSlotProvider } from "@/features/chat/vote-slot";
import { useTopBarCrumbs, useTopBarTrailing } from "@/features/shell/shell-chrome";
import { VoteControl } from "@/features/voting/vote-control";
import type { ThreadView } from "@/features/chat/get-thread";

export const Route = createFileRoute("/thread/$threadId")({
    loader: async ({ params }) => {
        const result = await getThread({ data: { threadId: params.threadId } });

        if (result.status === "signed-out") {
            throw redirect({
                to: "/sign-in",
                search: { next: `/thread/${params.threadId}` },
            });
        }

        return result;
    },
    component: ThreadRoute,
    errorComponent: () => <LoaderErrorNotice message={THREAD_READ_FAILED} />,
});

function ThreadRoute() {
    const result = Route.useLoaderData();

    if (result.status === "not-found") {
        return (
            <div
                role="alert"
                className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center"
            >
                <p className="text-foreground text-pretty">{THREAD_NOT_FOUND}</p>

                <Link
                    to="/"
                    className={buttonClasses({ variant: "outline", size: "sm" })}
                >
                    Start a new thread
                </Link>
            </div>
        );
    }

    if (result.status === "error") {
        return <LoaderErrorNotice message={result.message} />;
    }

    return <LoadedThread thread={result.thread} />;
}

function LoadedThread({ thread }: { readonly thread: ThreadView }) {
    const { threadId } = Route.useParams();
    const { streaming, answering, stop } = useArenaStream();
    const { send, notice } = useStartTurn();
    const [sending, setSending] = useState(false);

    const winRates = useMemo(() => <ThreadWinRates thread={thread} />, [thread]);

    useTopBarCrumbs(["Arena", thread.title]);
    useTopBarTrailing(winRates);

    const locked = thread.turns[0]?.responses ?? [];

    const submit = async (prompt: string): Promise<boolean> => {
        setSending(true);

        try {
            return (
                (await send({ prompt, modelIds: [...thread.modelIds], threadId })) !==
                null
            );
        } finally {
            setSending(false);
        }
    };

    return (
        <VoteSlotProvider control={VoteControl}>
            <ThreadScreen
                thread={thread}
                composer={
                    <div className="flex flex-col gap-2">
                        {notice !== null && (
                            <p
                                role="alert"
                                className="text-foreground text-pretty text-center text-sm"
                            >
                                {notice}
                            </p>
                        )}

                        <PromptComposer
                            onSubmit={submit}
                            busy={sending || streaming}
                            draftKey={threadId}
                            onStop={streaming ? stop : undefined}
                            controls={
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <LockedModels models={locked} />

                                    {answering > 0 && (
                                        <span
                                            role="status"
                                            className="label-meta min-w-0 truncate"
                                        >
                                            {answering} of {locked.length} answering
                                        </span>
                                    )}
                                </div>
                            }
                        />
                    </div>
                }
            />
        </VoteSlotProvider>
    );
}
