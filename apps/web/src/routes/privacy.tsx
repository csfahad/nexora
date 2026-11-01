import { createFileRoute } from "@tanstack/react-router";
import { PRIVACY } from "@/features/legal/legal-documents";
import { LegalScreen } from "@/features/legal/legal-screen";

export const Route = createFileRoute("/privacy")({
    head: () => ({
        meta: [
            { title: "Privacy Policy — Nexora" },
            {
                name: "description",
                content:
                    "How Nexora handles account information, AI prompts and answers, analytics, billing, and your privacy choices.",
            },
        ],
    }),
    component: () => <LegalScreen document={PRIVACY} />,
});
