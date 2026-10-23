import { createFileRoute } from "@tanstack/react-router";
import { BillingScreen } from "@/features/billing/billing-screen";
import { getBilling } from "@/features/billing/get-billing";

export const Route = createFileRoute("/settings/billing")({
    head: () => ({
        meta: [{ title: "Billing · Nexora" }, { name: "robots", content: "noindex" }],
    }),
    validateSearch: (search: Record<string, unknown>) => ({
        checkout: search.checkout === "returned" ? "returned" : undefined,
    }),
    loader: () => getBilling(),
    staleTime: 0,
    component: BillingRoute,
});

function BillingRoute() {
    const result = Route.useLoaderData();
    const { checkout } = Route.useSearch();
    return <BillingScreen result={result} returned={checkout === "returned"} />;
}
