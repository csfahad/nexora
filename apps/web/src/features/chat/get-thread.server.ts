import { database } from "@/infrastructure/database";
import { readSessionState } from "@/infrastructure/session.server";
import { byModelName, latestAttempts } from "@/infrastructure/response-order";
import { THREAD_READ_FAILED } from "./get-thread";
import type { GetThreadInput, GetThreadResult, ThreadResponse } from "./get-thread";
import type { ModelResponseMetrics } from "./model-response-metrics";

type MetricColumns = Readonly<{
    ttftMs: number | null;
    durationMs: number | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    tokensPerSecond: unknown;
    costUsd: unknown;
}>;

const metricsOf = (row: MetricColumns): ModelResponseMetrics | null =>
    row.durationMs === null
        ? null
        : {
              ttftMs: row.ttftMs,
              durationMs: row.durationMs,
              promptTokens: row.promptTokens,
              completionTokens: row.completionTokens,
              totalTokens: row.totalTokens,
              tokensPerSecond:
                  row.tokensPerSecond === null ? null : Number(row.tokensPerSecond),
              costUsd: Number(row.costUsd),
          };

export const runGetThread = async (
    headers: Headers,
    input: GetThreadInput,
): Promise<GetThreadResult> => {
    const session = await readSessionState(headers);

    if (session.status === "signed-out") return { status: "signed-out" };
    if (session.status === "unavailable") {
        return { status: "error", message: THREAD_READ_FAILED };
    }

    try {
        const thread = await database().thread.findFirst({
            where: { id: input.threadId, userId: session.user.id },
            select: {
                id: true,
                title: true,
                turns: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        prompt: true,
                        vote: { select: { winnerResponseId: true } },
                        responses: {
                            orderBy: { createdAt: "asc" },
                            select: {
                                id: true,
                                modelId: true,
                                modelName: true,
                                status: true,
                                content: true,
                                failure: true,
                                ttftMs: true,
                                durationMs: true,
                                promptTokens: true,
                                completionTokens: true,
                                totalTokens: true,
                                tokensPerSecond: true,
                                costUsd: true,
                            },
                        },
                    },
                },
            },
        });

        if (thread === null) return { status: "not-found" };

        const turns = thread.turns.map((turn) => ({
            id: turn.id,
            prompt: turn.prompt,
            vote: turn.vote,
            responses: [...latestAttempts(turn.responses)].sort(byModelName).map(
                (row): ThreadResponse => ({
                    id: row.id,
                    modelId: row.modelId,
                    modelName: row.modelName,
                    status: row.status,
                    content: row.content,
                    failure: row.failure,
                    metrics: metricsOf(row),
                }),
            ),
        }));

        return {
            status: "found",
            thread: {
                id: thread.id,
                title: thread.title,
                modelIds: (turns[0]?.responses ?? []).map((row) => row.modelId),
                turns,
            },
        };
    } catch (error) {
        console.error("[chat] could not read a thread:", error);
        return { status: "error", message: THREAD_READ_FAILED };
    }
};
