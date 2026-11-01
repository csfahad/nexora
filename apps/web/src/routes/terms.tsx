import { createFileRoute } from "@tanstack/react-router";
import { TERMS } from "@/features/legal/legal-documents";
import { LegalScreen } from "@/features/legal/legal-screen";

export const Route = createFileRoute("/terms")({
    head: () => ({
        meta: [
            { title: "Terms of Service — Nexora" },
            {
                name: "description",
                content:
                    "Nexora’s terms for AI comparisons, accounts, subscriptions, sharing, and acceptable use.",
            },
        ],
    }),
    component: () => <LegalScreen document={TERMS} />,
});
