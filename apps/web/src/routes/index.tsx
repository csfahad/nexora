import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import { ArenaScreen } from "@/features/arena/arena-screen";
import { useStartTurn } from "@/features/chat/use-start-turn";
import {
    CATALOG_STALE_TIME_MS,
    CATALOG_UNAVAILABLE,
    getModelCatalog,
} from "@/infrastructure/model-catalog";

export const Route = createFileRoute("/")({
    loader: () => getModelCatalog(),
    staleTime: CATALOG_STALE_TIME_MS,
    component: ArenaRoute,
    errorComponent: () => <LoaderErrorNotice message={CATALOG_UNAVAILABLE} />,
});

function ArenaRoute() {
    const navigate = useNavigate();
    const { send, notice } = useStartTurn();

    const submit = async (
        prompt: string,
        modelIds: readonly string[],
    ): Promise<boolean> => {
        const threadId = await send({ prompt, modelIds: [...modelIds] });

        if (threadId === null) return false;

        void navigate({ to: "/thread/$threadId", params: { threadId } });

        return true;
    };

    return (
        <ArenaScreen models={Route.useLoaderData()} onSubmit={submit} notice={notice} />
    );
}
