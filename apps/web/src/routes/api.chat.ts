import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
    server: {
        handlers: {
            POST: async ({ request }) => {
                const { respondToChatRequest } =
                    await import("@/features/chat/chat-endpoint.server");

                return respondToChatRequest(request);
            },
        },
    },
});
