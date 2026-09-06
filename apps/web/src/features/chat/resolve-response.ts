import { RESPONSE_FAILURE, failureSentence } from "./response-failure";
import type { LiveResponse } from "./arena-stream";
import type { ThreadResponse } from "./get-thread";
import type { ModelResponseMetrics } from "./model-response-metrics";

export type ResolvedResponse = Readonly<{
    id: string;
    modelId: string;
    modelName: string;
    state: "streaming" | "complete" | "failed";
    text: string;
    metrics: ModelResponseMetrics | null;
    message: string | null;
}>;

const fromLive = (row: ThreadResponse, entry: LiveResponse): ResolvedResponse => ({
    id: row.id,
    modelId: row.modelId,
    modelName: row.modelName,
    state: entry.status,
    text: entry.text,
    metrics: entry.metrics,
    message: entry.status === "failed" ? entry.message : null,
});

const fromRow = (row: ThreadResponse): ResolvedResponse => ({
    id: row.id,
    modelId: row.modelId,
    modelName: row.modelName,
    state: row.status === "COMPLETE" ? "complete" : "failed",
    text: row.content,
    metrics: row.metrics,
    message:
        row.status === "COMPLETE"
            ? null
            : failureSentence(
                  row.status === "STREAMING" ? RESPONSE_FAILURE.INTERRUPTED : row.failure,
              ),
});

export const resolveResponse = (
    row: ThreadResponse,
    live: ReadonlyMap<string, LiveResponse>,
): ResolvedResponse => {
    const entry = live.get(row.id);
    return entry === undefined ? fromRow(row) : fromLive(row, entry);
};
