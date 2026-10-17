import { createFileRoute } from "@tanstack/react-router";
import { PlansScreen } from "@/features/plans/plans-screen";

export const Route = createFileRoute("/plans")({
    head: () => ({ meta: [{ title: "Plans · Nexora" }] }),
    component: PlansScreen,
});
