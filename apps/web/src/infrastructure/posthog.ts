import { captureAiGeneration } from "@posthog/ai";
import { PostHog } from "posthog-node";
import { serverEnv } from "@/infrastructure/env";

const buildClient = () => {
    const env = serverEnv();

    return new PostHog(env.POSTHOG_KEY, { host: env.POSTHOG_HOST });
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

const send = (
    message: Readonly<{ distinctId: string; event: string }> & {
        properties: Record<string, unknown>;
    },
): void => {
    try {
        postHogClient().capture(message);
    } catch (error) {
        console.error(`[posthog] could not queue ${message.event}:`, error);
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
): void =>
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
): void =>
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
): void =>
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
    turnId: string;
    responseId: string;
    modelId: string;
    prompt: string;
    answer: string;
    latencyMs: number;
    ttftMs: number | null;
    promptTokens: number | null;
    completionTokens: number | null;
    costUsd: number;
    error?: unknown;
}>;

export const captureGeneration = (input: AiGenerationInput): void => {
    void captureAiGeneration(postHogClient(), {
        distinctId: input.userId,
        traceId: input.turnId,
        model: input.modelId,
        provider: "openrouter",
        input: [{ role: "user", content: input.prompt }],
        output: [{ role: "assistant", content: input.answer }],
        latency: input.latencyMs / 1000,
        ...(input.ttftMs === null ? {} : { timeToFirstToken: input.ttftMs / 1000 }),
        usage: {
            ...(input.promptTokens === null ? {} : { inputTokens: input.promptTokens }),
            ...(input.completionTokens === null
                ? {}
                : { outputTokens: input.completionTokens }),
        },
        costOverride: { inputCost: input.costUsd, outputCost: input.costUsd },
        properties: { response_id: input.responseId },
        ...(input.error === undefined ? {} : { error: input.error }),
    }).catch((error: unknown) => {
        console.error(
            `[posthog] could not record a generation for ${input.modelId}:`,
            error,
        );
    });
};
