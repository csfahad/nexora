export type ModelResponseMetrics = Readonly<{
    ttftMs: number | null;
    durationMs: number;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    tokensPerSecond: number | null;
    costUsd: number;
}>;

export type MetricsInput = Readonly<{
    startedAt: number;
    firstTokenAt: number | null;
    finishedAt: number;
    promptTokens: number | null;
    completionTokens: number | null;
}>;

const round = (value: number, places: number): number => {
    const factor = 10 ** places;
    return Math.round(value * factor) / factor;
};

const computeTokensPerSecond = (
    completionTokens: number | null,
    durationMs: number,
): number | null => {
    if (completionTokens === null || completionTokens <= 0) return null;
    if (durationMs <= 0) return null;

    return round(completionTokens / (durationMs / 1000), 2);
};

export const computeMetrics = (input: MetricsInput): ModelResponseMetrics => {
    const { startedAt, firstTokenAt, finishedAt, promptTokens, completionTokens } = input;

    const durationMs = finishedAt - startedAt;

    const totalTokens =
        promptTokens === null && completionTokens === null
            ? null
            : (promptTokens ?? 0) + (completionTokens ?? 0);

    return {
        ttftMs: firstTokenAt === null ? null : firstTokenAt - startedAt,
        durationMs,
        promptTokens,
        completionTokens,
        totalTokens,
        tokensPerSecond: computeTokensPerSecond(completionTokens, durationMs),
        costUsd: 0,
    };
};
