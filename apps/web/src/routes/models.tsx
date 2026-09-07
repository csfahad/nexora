import { createFileRoute } from "@tanstack/react-router";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import { ModelsScreen } from "@/features/models/models-screen";
import {
    CATALOG_STALE_TIME_MS,
    CATALOG_UNAVAILABLE,
    getModelCatalog,
} from "@/infrastructure/model-catalog";

export const Route = createFileRoute("/models")({
    head: () => ({ meta: [{ title: "Models · Nexora" }] }),
    loader: () => getModelCatalog(),
    staleTime: CATALOG_STALE_TIME_MS,
    component: ModelsRoute,
    errorComponent: () => <LoaderErrorNotice message={CATALOG_UNAVAILABLE} />,
});

function ModelsRoute() {
    return <ModelsScreen models={Route.useLoaderData()} />;
}
