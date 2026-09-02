import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { serverEnv } from "@/infrastructure/env";

let cached: ReturnType<typeof createOpenRouter> | undefined;

export const openRouterClient = () => {
    if (cached) return cached;

    cached = createOpenRouter({
        apiKey: serverEnv().OPENROUTER_API_KEY,
        headers: {
            "HTTP-Referer": "https://nexora.csfahad.in",
            "X-Title": "Nexora",
        },
    });

    return cached;
};
