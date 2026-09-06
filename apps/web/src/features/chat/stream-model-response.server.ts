import { streamText } from "ai";
import type { ModelMessage } from "ai";
import { ResponseStatus } from "@/generated/prisma/enums";
import { database } from "@/infrastructure/database";
import { openRouterClient } from "@/infrastructure/openrouter";
import { captureAnswerFinished, captureGeneration } from "@/infrastructure/posthog";
import { encodeStreamEvent } from "./chat-stream-protocol";
import type { ChatStreamEvent } from "./chat-stream-protocol";
import { computeMetrics } from "./model-response-metrics";
import type { ModelResponseMetrics } from "./model-response-metrics";
import { RESPONSE_FAILURE, failureSentence } from "./response-failure";
import type { ResponseFailure } from "./response-failure";

const NDJSON_HEADERS: Readonly<Record<string, string>> = {
    "Content-Type": "application/x-ndjson; charset=utf-8",
    "Cache-Control": "no-store, no-transform",
    "X-Accel-Buffering": "no",
};

const encoder = new TextEncoder();

export const failureStream = (message: string): Response =>
    new Response(encodeStreamEvent({ type: "error", message }), {
        status: 200,
        headers: NDJSON_HEADERS,
    });

const describeForLog = (error: unknown): string => {
    if (error instanceof Error) return `${error.name}: ${error.message}`;

    if (typeof error === "object" && error !== null) {
        try {
            return JSON.stringify(error);
        } catch {
            return String(error);
        }
    }

    return String(error);
};

type Outcome = Readonly<{
    status: ResponseStatus;
    content: string;
    failure?: ResponseFailure;
    metrics: ModelResponseMetrics;
}>;

const recordOutcome = async (responseId: string, outcome: Outcome): Promise<void> => {
    try {
        await database().modelResponse.update({
            where: { id: responseId },
            data: {
                status: outcome.status,
                content: outcome.content,
                ...(outcome.failure === undefined ? {} : { failure: outcome.failure }),
                ttftMs: outcome.metrics.ttftMs,
                durationMs: outcome.metrics.durationMs,
                promptTokens: outcome.metrics.promptTokens,
                completionTokens: outcome.metrics.completionTokens,
                totalTokens: outcome.metrics.totalTokens,
                tokensPerSecond: outcome.metrics.tokensPerSecond,
                costUsd: outcome.metrics.costUsd,
            },
        });
    } catch (error) {
        console.error(`[chat] could not record response ${responseId}:`, error);
    }
};

export type StreamModelResponseInput = Readonly<{
    responseId: string;
    modelId: string;
    messages: readonly ModelMessage[];
    signal: AbortSignal;
    userId: string;
    threadId: string;
    turnId: string;
    prompt: string;
}>;

const reportFinished = (
    stream: StreamModelResponseInput,
    finished: Readonly<{
        outcome: "complete" | "failed" | "cancelled";
        text: string;
        metrics: ModelResponseMetrics;
        error?: unknown;
    }>,
): void => {
    captureAnswerFinished({
        userId: stream.userId,
        threadId: stream.threadId,
        turnId: stream.turnId,
        responseId: stream.responseId,
        modelId: stream.modelId,
        outcome: finished.outcome,
        ttftMs: finished.metrics.ttftMs,
        durationMs: finished.metrics.durationMs,
        totalTokens: finished.metrics.totalTokens,
        tokensPerSecond: finished.metrics.tokensPerSecond,
        costUsd: finished.metrics.costUsd,
    });

    captureGeneration({
        userId: stream.userId,
        turnId: stream.turnId,
        responseId: stream.responseId,
        modelId: stream.modelId,
        prompt: stream.prompt,
        answer: finished.text,
        latencyMs: finished.metrics.durationMs,
        ttftMs: finished.metrics.ttftMs,
        promptTokens: finished.metrics.promptTokens,
        completionTokens: finished.metrics.completionTokens,
        costUsd: finished.metrics.costUsd,
        ...(finished.error === undefined ? {} : { error: finished.error }),
    });
};

export const streamModelResponse = (input: StreamModelResponseInput): Response => {
    const startedAt = Date.now();

    const body = new ReadableStream<Uint8Array>({
        async start(controller) {
            let open = true;

            const send = (event: ChatStreamEvent): void => {
                if (!open) return;

                try {
                    controller.enqueue(encoder.encode(encodeStreamEvent(event)));
                } catch {
                    open = false;
                }
            };

            let firstTokenAt: number | null = null;
            let text = "";

            const measured = (
                promptTokens: number | null,
                completionTokens: number | null,
            ): ModelResponseMetrics =>
                computeMetrics({
                    startedAt,
                    firstTokenAt,
                    finishedAt: Date.now(),
                    promptTokens,
                    completionTokens,
                });

            try {
                const result = streamText({
                    model: openRouterClient()(input.modelId),
                    messages: [...input.messages],
                    abortSignal: input.signal,
                });

                for await (const part of result.stream) {
                    if (part.type === "text-delta") {
                        if (part.text.length === 0) continue;
                        firstTokenAt ??= Date.now();
                        text += part.text;
                        send({ type: "delta", text: part.text });
                        continue;
                    }

                    if (part.type === "error") throw part.error;
                }

                const usage = await result.usage;
                const metrics = measured(
                    usage.inputTokens ?? null,
                    usage.outputTokens ?? null,
                );

                await recordOutcome(input.responseId, {
                    status: ResponseStatus.COMPLETE,
                    content: text,
                    metrics,
                });

                send({ type: "done", metrics });

                reportFinished(input, {
                    outcome: "complete",
                    text,
                    metrics,
                });
            } catch (error) {
                const cancelled = input.signal.aborted;
                const failure = cancelled
                    ? RESPONSE_FAILURE.CANCELLED
                    : RESPONSE_FAILURE.PROVIDER;

                if (!cancelled) {
                    console.error(
                        `[chat] model ${input.modelId} failed after ${Date.now() - startedAt}ms:`,
                        describeForLog(error),
                    );
                }

                await recordOutcome(input.responseId, {
                    status: ResponseStatus.FAILED,
                    content: text,
                    failure,
                    metrics: measured(null, null),
                });

                if (!cancelled)
                    send({ type: "error", message: failureSentence(failure) });

                reportFinished(input, {
                    outcome: cancelled ? "cancelled" : "failed",
                    text,
                    metrics: measured(null, null),
                    ...(cancelled ? {} : { error }),
                });
            } finally {
                open = false;

                try {
                    controller.close();
                } catch {}
            }
        },
    });

    return new Response(body, { status: 200, headers: NDJSON_HEADERS });
};
