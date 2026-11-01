import { createFileRoute } from "@tanstack/react-router";
import { LandingScreen } from "@/features/landing/landing-screen";

export const Route = createFileRoute("/")({
    head: () => ({
        meta: [
            { title: "Nexora — One prompt. Three perspectives." },
            {
                name: "description",
                content:
                    "Compare up to three AI models on your own prompt. Read answers side by side, see per-call cost and speed, and vote for the one you’d use.",
            },
            { property: "og:title", content: "Nexora — One prompt. Three perspectives." },
            {
                property: "og:description",
                content:
                    "Your prompt. Independent answers. Real measurements. Find the AI that works for you.",
            },
            { property: "og:type", content: "website" },
        ],
    }),
    component: LandingScreen,
});
