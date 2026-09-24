import { byModelName, latestAttempts } from "@/infrastructure/response-order";
import type { ModelResponseMetrics } from "./model-response-metrics";
import type { ThreadResponse, ThreadTurn } from "./get-thread";

export const THREAD_TURNS_SELECT = {
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
} as const;

type MetricColumns = Readonly<{
    ttftMs: number | null;
    durationMs: number | null;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    tokensPerSecond: unknown;
    costUsd: unknown;
}>;

type ResponseRow = MetricColumns &
    Readonly<{
        id: string;
        modelId: string;
        modelName: string;
        status: "STREAMING" | "COMPLETE" | "FAILED";
        content: string;
        failure: string | null;
    }>;

type TurnRow = Readonly<{
    id: string;
    prompt: string;
    vote: Readonly<{ winnerResponseId: string }> | null;
    responses: readonly ResponseRow[];
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

export const toThreadTurns = (rows: readonly TurnRow[]): readonly ThreadTurn[] =>
    rows.map((turn) => ({
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
