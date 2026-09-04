import { z } from "zod";
import type { ModelResponseMetrics } from "./model-response-metrics";

export const chatRequestSchema = z.object({
    responseId: z.string().min(1).max(64),
});

export type ChatRequest = Readonly<z.infer<typeof chatRequestSchema>>;

export type ChatStreamEvent =
    | Readonly<{ type: "delta"; text: string }>
    | Readonly<{ type: "done"; metrics: ModelResponseMetrics }>
    | Readonly<{ type: "error"; message: string }>;

export const encodeStreamEvent = (event: ChatStreamEvent): string =>
    `${JSON.stringify(event)}\n`;

const streamEventSchema = z.discriminatedUnion("type", [
    z.object({ type: z.literal("delta"), text: z.string() }),
    z.object({
        type: z.literal("done"),
        metrics: z.object({
            ttftMs: z.number().nullable(),
            durationMs: z.number(),
            promptTokens: z.number().nullable(),
            completionTokens: z.number().nullable(),
            totalTokens: z.number().nullable(),
            tokensPerSecond: z.number().nullable(),
            costUsd: z.number(),
        }),
    }),
    z.object({ type: z.literal("error"), message: z.string() }),
]);

export const decodeStreamEvent = (line: string): ChatStreamEvent | null => {
    if (line.trim().length === 0) return null;

    try {
        const parsed = streamEventSchema.safeParse(JSON.parse(line));
        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
};
