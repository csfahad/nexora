import {
    createCsrfMiddleware,
    createMiddleware,
    createStart,
} from "@tanstack/react-start";

const observability = createMiddleware().server(async ({ request, next }) => {
    const { captureServerRequest, flushPostHog, reportServerError, withPostHogRequest } =
        await import("@/infrastructure/posthog");
    return withPostHogRequest(request, async () => {
        const startedAt = Date.now();
        let status = 500;
        try {
            const result = await next();
            status = result.response.status;
            return result;
        } catch (error) {
            reportServerError("[server] request failed:", error);
            throw error;
        } finally {
            captureServerRequest(request, status, Date.now() - startedAt);
            await flushPostHog();
        }
    });
});

// A custom Start instance replaces the framework's default request middleware.
const csrf = createCsrfMiddleware({
    filter: ({ handlerType }) => handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
    requestMiddleware: [observability, csrf],
}));
