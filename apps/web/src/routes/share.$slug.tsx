import { Link, createFileRoute } from "@tanstack/react-router";
import { buttonClasses } from "@/components/ui/button";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import {
    SHARED_THREAD_GONE,
    SHARED_THREAD_READ_FAILED,
    getSharedThread,
} from "@/features/chat/get-shared-thread";
import { SharedThreadScreen } from "@/features/chat/shared-thread-screen";
import { VoteSlotProvider } from "@/features/chat/vote-slot";
import { WinnerMark } from "@/features/voting/winner-mark";

export const Route = createFileRoute("/share/$slug")({
    loader: async ({ params }) => getSharedThread({ data: { slug: params.slug } }),
    head: ({ loaderData }) => ({
        meta: [
            {
                title:
                    loaderData?.status === "found"
                        ? `${loaderData.thread.title} · Nexora`
                        : "Shared thread · Nexora",
            },
            // A secret link is only secret while it stays out of an index.
            { name: "robots", content: "noindex, nofollow" },
        ],
    }),
    component: SharedThreadRoute,
    errorComponent: () => <LoaderErrorNotice message={SHARED_THREAD_READ_FAILED} />,
});

function SharedThreadRoute() {
    const result = Route.useLoaderData();

    if (result.status === "error") {
        return <LoaderErrorNotice message={result.message} />;
    }

    if (result.status === "not-found") {
        return (
            <div className="screen place-items-center overflow-y-auto">
                <div
                    role="alert"
                    className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center"
                >
                    <p className="font-heading text-foreground text-lg font-semibold">
                        Nexora
                    </p>

                    <p className="text-muted-foreground text-pretty">
                        {SHARED_THREAD_GONE}
                    </p>

                    <Link to="/" className={buttonClasses({ variant: "outline" })}>
                        Try your own prompt
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <VoteSlotProvider control={WinnerMark}>
            <SharedThreadScreen thread={result.thread} />
        </VoteSlotProvider>
    );
}
