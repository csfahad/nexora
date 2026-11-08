import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
    const router = createTanStackRouter({
        routeTree,
        scrollRestoration: true,
        scrollToTopSelectors: [".public-page", ".screen-scroll"],
        defaultPreload: "intent",
        defaultPreloadStaleTime: 0,
    });

    return router;
}

declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof getRouter>;
    }
}
