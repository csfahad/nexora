import { Link, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import { ArenaScreen } from "@/features/arena/arena-screen";
import { useStartTurn } from "@/features/chat/use-start-turn";
import { useChatState } from "@/features/chat/optimistic-turns";
import { ThreadScreen } from "@/features/chat/thread-screen";
import { threadTitleFrom } from "@/features/chat/thread-title";
import {
    CATALOG_STALE_TIME_MS,
    CATALOG_UNAVAILABLE,
    arenaModels,
    getModelCatalog,
} from "@/infrastructure/model-catalog";

export const Route = createFileRoute("/app")({
    loader: async () => arenaModels(await getModelCatalog()),
    staleTime: CATALOG_STALE_TIME_MS,
    component: ArenaRoute,
    errorComponent: () => <LoaderErrorNotice message={CATALOG_UNAVAILABLE} />,
});

function ArenaRoute() {
    const navigate = useNavigate();
    const router = useRouter();
    const { send, notice } = useStartTurn();
    const { chat, pending, created, failedModelIds } = useChatState();
    const models = Route.useLoaderData();

    const submit = async (
        prompt: string,
        modelIds: readonly string[],
    ): Promise<boolean> => {
        const origin = router.state.location.state.__TSR_key;
        const selected = models.filter((model) => modelIds.includes(model.id));
        const threadId = await send(
            { prompt, modelIds: [...modelIds] },
            {
                id: "pending:new",
                title: threadTitleFrom(prompt),
                modelIds,
                turns: [],
            },
            selected.map((model) => ({ modelId: model.id, modelName: model.name })),
        );

        if (threadId === null) return false;

        router.options.context.shell.add({
            id: threadId,
            title: threadTitleFrom(prompt),
        });
        if (
            router.state.location.pathname === "/app" &&
            router.state.location.state.__TSR_key === origin
        ) {
            try {
                await navigate({ to: "/thread/$threadId", params: { threadId } });
            } catch (error) {
                console.error("[chat] saved-thread navigation failed", error);
                router.options.context.shell.notify(
                    "Your prompt was saved. Open your thread to continue.",
                );
                return true;
            }
        }
        chat.opened(threadId);
        void router
            .invalidate()
            .catch((error: unknown) => console.error("[chat] refresh failed", error));

        return true;
    };

    const preview = pending?.id === "pending:new" ? pending : created;
    if (preview !== null)
        return (
            <ThreadScreen
                thread={preview}
                composer={
                    <p
                        role="status"
                        className="text-muted-foreground text-center text-sm"
                    >
                        {created === null ? (
                            "Sending your prompt…"
                        ) : (
                            <Link
                                to="/thread/$threadId"
                                params={{ threadId: created.id }}
                            >
                                Open your thread
                            </Link>
                        )}
                    </p>
                }
            />
        );
    return (
        <ArenaScreen
            models={models}
            onSubmit={submit}
            notice={notice}
            initialSelectedIds={failedModelIds}
        />
    );
}
