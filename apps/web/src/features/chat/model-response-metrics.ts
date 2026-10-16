export type ModelResponseMetrics = Readonly<{
    ttftMs: number | null;
    durationMs: number;
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    tokensPerSecond: number | null;
    costUsd: number;
    costEstimated: boolean;
}>;

export type ModelPrices = Readonly<{ prompt: number; completion: number }>;

export type MetricsInput = Readonly<{
    startedAt: number;
    firstTokenAt: number | null;
    finishedAt: number;
    promptTokens: number | null;
    completionTokens: number | null;
    reportedCostUsd: number | null;
    prices: ModelPrices | null;
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

const COST_PLACES = 6;

type Cost = Readonly<{ costUsd: number; costEstimated: boolean }>;

const computeCost = (
    reportedCostUsd: number | null,
    prices: ModelPrices | null,
    promptTokens: number | null,
    completionTokens: number | null,
): Cost => {
    if (reportedCostUsd !== null && Number.isFinite(reportedCostUsd)) {
        return { costUsd: round(reportedCostUsd, COST_PLACES), costEstimated: false };
    }

    if (prices === null || (promptTokens === null && completionTokens === null)) {
        return { costUsd: 0, costEstimated: prices !== null };
    }

    const derived =
        prices.prompt * (promptTokens ?? 0) + prices.completion * (completionTokens ?? 0);

    return { costUsd: round(derived, COST_PLACES), costEstimated: true };
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
        ...computeCost(
            input.reportedCostUsd,
            input.prices,
            promptTokens,
            completionTokens,
        ),
    };
};
