import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createChatState } from "@/features/chat/optimistic-turns";
import { createShellState } from "@/features/shell/optimistic-history";

export function getRouter() {
    const router = createTanStackRouter({
        routeTree,
        context: { chat: createChatState(), shell: createShellState() },
        scrollRestoration: true,
        scrollToTopSelectors: [".public-page", ".screen-scroll"],
        defaultPreload: "intent",
        defaultPreloadStaleTime: 30_000,
        defaultPendingMs: 0,
        defaultPendingMinMs: 0,
    });

    return router;
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
