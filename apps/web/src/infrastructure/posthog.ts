import "@tanstack/react-start/server-only";
import { captureAiGeneration } from "@posthog/ai";
import { PostHog } from "posthog-node";
import { serverEnv } from "@/infrastructure/env";

const buildClient = () => {
    const env = serverEnv();

    return new PostHog(env.POSTHOG_KEY, {
        host: env.POSTHOG_HOST,
        flushInterval: 0,
        requestTimeout: 5000,
        fetchRetryCount: 0,
        logs: { serviceName: "nexora-server", flushIntervalMs: 0 },
    });
};

let client: ReturnType<typeof buildClient> | undefined;

const postHogClient = (): ReturnType<typeof buildClient> => {
    if (client) return client;

    client = buildClient();

    return client;
};

const EVENT = {
    PROMPT_SENT: "prompt_sent",
    ANSWER_FINISHED: "answer_finished",
    VOTE_CAST: "vote_cast",
} as const;

const send = async (
    message: Readonly<{ distinctId: string; event: string }> & {
        properties: Record<string, unknown>;
    },
): Promise<void> => {
    try {
        await postHogClient().captureImmediate(message);
    } catch (error) {
        console.error(`[posthog] could not deliver ${message.event}:`, error);
    }
};

export const capturePromptSent = (
    input: Readonly<{
        userId: string;
        threadId: string;
        turnId: string;
        modelIds: readonly string[];
        available: number;
        followUp: boolean;
    }>,
): Promise<void> =>
    send({
        distinctId: input.userId,
        event: EVENT.PROMPT_SENT,
        properties: {
            thread_id: input.threadId,
            turn_id: input.turnId,
            model_ids: [...input.modelIds],
            models_requested: input.modelIds.length,
            models_available: input.available,
            follow_up: input.followUp,
        },
    });

export const captureAnswerFinished = (
    input: Readonly<{
        userId: string;
        threadId: string;
        turnId: string;
        responseId: string;
        modelId: string;
        outcome: "complete" | "failed" | "cancelled";
        ttftMs: number | null;
        durationMs: number;
        totalTokens: number | null;
        tokensPerSecond: number | null;
        costUsd: number;
    }>,
): Promise<void> =>
    send({
        distinctId: input.userId,
        event: EVENT.ANSWER_FINISHED,
        properties: {
            thread_id: input.threadId,
            turn_id: input.turnId,
            response_id: input.responseId,
            model_id: input.modelId,
            outcome: input.outcome,
            ttft_ms: input.ttftMs,
            duration_ms: input.durationMs,
            total_tokens: input.totalTokens,
            tokens_per_second: input.tokensPerSecond,
            cost_usd: input.costUsd,
        },
    });

export const captureVoteCast = (
    input: Readonly<{
        userId: string;
        turnId: string;
        winnerResponseId: string;
        winnerModelId: string;
        candidateModelIds: readonly string[];
    }>,
): Promise<void> =>
    send({
        distinctId: input.userId,
        event: EVENT.VOTE_CAST,
        properties: {
            turn_id: input.turnId,
            winner_response_id: input.winnerResponseId,
            winner_model_id: input.winnerModelId,
            candidate_model_ids: [...input.candidateModelIds],
            candidates: input.candidateModelIds.length,
        },
    });

export type AiGenerationInput = Readonly<{
    userId: string;
    traceId: string;
    modelId: string;
    input: unknown;
    answer: string;
    latencyMs: number;
    ttftMs: number | null;
    promptTokens: number | null;
    completionTokens: number | null;
    costUsd: number;
    properties: Record<string, unknown>;
    error?: unknown;
}>;

export const captureGeneration = async (input: AiGenerationInput): Promise<void> => {
    try {
        await captureAiGeneration(postHogClient(), {
            distinctId: input.userId,
            traceId: input.traceId,
            model: input.modelId,
            provider: "openrouter",
            input: input.input,
            output: [{ role: "assistant", content: input.answer }],
            latency: input.latencyMs / 1000,
            ...(input.ttftMs === null ? {} : { timeToFirstToken: input.ttftMs / 1000 }),
            usage: {
                ...(input.promptTokens === null
                    ? {}
                    : { inputTokens: input.promptTokens }),
                ...(input.completionTokens === null
                    ? {}
                    : { outputTokens: input.completionTokens }),
            },
            // The measured total is already in USD. costOverride expects per-token rates.
            properties: { ...input.properties, $ai_total_cost_usd: input.costUsd },
            captureImmediate: true,
            ...(input.error === undefined ? {} : { error: input.error }),
        });
    } catch (error) {
        console.error(
            `[posthog] could not record a generation for ${input.modelId}:`,
            error,
        );
    }
};

export const reportServerError = (
    message: string,
    error: unknown,
    properties: Record<string, string | number | boolean> = {},
): void => {
    console.error(message, error);
    try {
        const analytics = postHogClient();
        analytics.captureException(error, undefined, { message, ...properties });
        analytics.logger.error(message, {
            ...analytics.getContext()?.properties,
            ...properties,
            "exception.type": error instanceof Error ? error.name : typeof error,
            "exception.message": error instanceof Error ? error.message : String(error),
            ...(error instanceof Error && error.stack
                ? { "exception.stacktrace": error.stack }
                : {}),
        });
    } catch (captureError) {
        console.error("[posthog] could not record a server error:", captureError);
    }
};

export const captureServerRequest = (
    request: Request,
    status: number,
    durationMs: number,
): void => {
    try {
        const url = new URL(request.url);
        postHogClient().captureLog({
            body: `${request.method} ${url.pathname}`,
            level: status >= 500 ? "error" : status >= 400 ? "warn" : "info",
            attributes: {
                "http.request.method": request.method,
                "http.response.status_code": status,
                "url.path": url.pathname,
                "server.address": url.hostname,
                duration_ms: durationMs,
            },
        });
    } catch (error) {
        console.error("[posthog] could not record a server request:", error);
    }
};

export const reportServerWarning = (message: string): void => {
    console.warn(message);
    try {
        const analytics = postHogClient();
        analytics.logger.warn(message, analytics.getContext()?.properties);
    } catch (error) {
        console.error("[posthog] could not record a server warning:", error);
    }
};

export const flushPostHog = async (): Promise<void> => {
    if (!client) return;
    try {
        await client.flush();
    } catch (error) {
        console.error("[posthog] could not flush server telemetry:", error);
    }
};

export const withPostHogRequest = <T>(request: Request, run: () => T): T => {
    let analytics: ReturnType<typeof buildClient>;
    try {
        analytics = postHogClient();
    } catch (error) {
        console.error("[posthog] could not initialize server telemetry:", error);
        return run();
    }
    const url = new URL(request.url);
    return analytics.withContext(
        {
            properties: { $host: url.host, $current_url: `${url.origin}${url.pathname}` },
        },
        run,
        { fresh: true },
    );
};
