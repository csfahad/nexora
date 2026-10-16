import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CATALOG_URL = "https://openrouter.ai/api/v1/models";
const REFRESH_AFTER_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8_000;

export const CATALOG_UNAVAILABLE = "We couldn't load the model list just now.";

export const CATALOG_STALE_TIME_MS = 5 * 60 * 1000;

export const MAX_ARENA_MODELS = 3;

export const REFERENCE_PROMPT_TOKENS = 400;
export const REFERENCE_COMPLETION_TOKENS = 1_000;

const STANDARD_MAX_USD = 0.0025;
const ADVANCED_MAX_USD = 0.015;

export const ARENA_PRICE_CEILING_USD = 0.05;

export type ModelTier = "FREE" | "STANDARD" | "ADVANCED" | "FRONTIER";

export type CatalogModel = Readonly<{
    id: string;
    name: string;
    provider: string;
    contextLength: number;
    contextLabel: string;
    inputsLabel: string;
    tier: ModelTier | null;
    promptPriceUsd: number;
    completionPriceUsd: number;
    promptPricePerMTokens: string;
    completionPricePerMTokens: string;
    referenceAnswerCostUsd: number;
    referenceAnswerCostLabel: string;
}>;

const catalogRowSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    context_length: z.number().positive().nullish(),
    architecture: z
        .object({
            input_modalities: z.array(z.string()).nullish(),
            output_modalities: z.array(z.string()).nullish(),
            tokenizer: z.string().nullish(),
        })
        .nullish(),
    pricing: z.object({ prompt: z.string(), completion: z.string() }),
});

type CatalogRow = z.infer<typeof catalogRowSchema>;

const payloadSchema = z.object({ data: z.array(z.unknown()) });

const parsePrice = (raw: string): number | null => {
    if (raw.trim().length === 0) return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
};

const isBatchVariant = (id: string): boolean => id.endsWith(":batch");

const isComparable = (architecture: CatalogRow["architecture"]): boolean => {
    if (!architecture) return true;

    const outputs = architecture.output_modalities ?? [];
    const emitsOnlyText =
        outputs.length === 0 ||
        outputs.every((modality) => modality.trim().toLowerCase() === "text");

    return emitsOnlyText && architecture.tokenizer?.trim().toLowerCase() !== "router";
};

const tierFor = (referenceCostUsd: number): ModelTier | null => {
    if (referenceCostUsd === 0) return "FREE";
    if (referenceCostUsd <= STANDARD_MAX_USD) return "STANDARD";
    if (referenceCostUsd <= ADVANCED_MAX_USD) return "ADVANCED";
    if (referenceCostUsd <= ARENA_PRICE_CEILING_USD) return "FRONTIER";

    return null;
};

const usd = (value: number): string => `$${value.toFixed(4)}`;

export const formatContextLabel = (tokens: number): string => {
    if (tokens <= 0) return "—";

    if (tokens >= 1_000_000) {
        const millions = Math.floor(tokens / 100_000) / 10;
        return Number.isInteger(millions)
            ? `${millions.toFixed(0)}M`
            : `${millions.toFixed(1)}M`;
    }

    if (tokens >= 1_000) return `${Math.floor(tokens / 1_000)}K`;

    return `${tokens}`;
};

const titleCase = (segment: string): string =>
    segment
        .split(/[-_]/)
        .filter((word) => word.length > 0)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

const parseIdentity = (
    rawName: string,
    id: string,
): { name: string; provider: string } => {
    const withoutSuffix = rawName.replace(/\s*\(free\)\s*$/i, "").trim();
    const separator = withoutSuffix.indexOf(":");

    if (separator > 0) {
        const provider = withoutSuffix.slice(0, separator).trim();
        const name = withoutSuffix.slice(separator + 1).trim();
        if (provider.length > 0 && name.length > 0) return { name, provider };
    }

    // `split` always yields an element, so this guards an empty segment.
    const [prefix] = id.split("/");

    return {
        name: withoutSuffix.length > 0 ? withoutSuffix : id,
        provider: titleCase(prefix.length > 0 ? prefix : id),
    };
};

const formatInputs = (modalities: readonly string[] | null | undefined): string => {
    const named = (modalities ?? [])
        .map((modality) => modality.trim())
        .filter((modality) => modality.length > 0)
        .map(titleCase);

    return named.length > 0 ? named.join(", ") : "Text";
};

const toCatalogModel = (row: CatalogRow): CatalogModel | null => {
    if (isBatchVariant(row.id)) return null;
    if (!isComparable(row.architecture)) return null;

    const promptPrice = parsePrice(row.pricing.prompt);
    const completionPrice = parsePrice(row.pricing.completion);

    if (promptPrice === null || completionPrice === null) return null;
    if (promptPrice < 0 || completionPrice < 0) return null;

    const referenceAnswerCostUsd =
        promptPrice * REFERENCE_PROMPT_TOKENS +
        completionPrice * REFERENCE_COMPLETION_TOKENS;

    const contextLength = row.context_length ?? 0;
    const { name, provider } = parseIdentity(row.name, row.id);

    return {
        id: row.id,
        name,
        provider,
        contextLength,
        contextLabel: formatContextLabel(contextLength),
        inputsLabel: formatInputs(row.architecture?.input_modalities),
        tier: tierFor(referenceAnswerCostUsd),
        promptPriceUsd: promptPrice,
        completionPriceUsd: completionPrice,
        promptPricePerMTokens: usd(promptPrice * 1_000_000),
        completionPricePerMTokens: usd(completionPrice * 1_000_000),
        referenceAnswerCostUsd,
        referenceAnswerCostLabel: usd(referenceAnswerCostUsd),
    };
};

/** Deterministic, so SSR and the client agree on the default trio. */
const byContextThenId = (a: CatalogModel, b: CatalogModel): number =>
    b.contextLength - a.contextLength || a.id.localeCompare(b.id);

const fetchCatalog = async (): Promise<readonly CatalogModel[]> => {
    const response = await fetch(CATALOG_URL, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error(`OpenRouter responded ${response.status}`);

    const payload = payloadSchema.safeParse(await response.json());

    if (!payload.success) {
        throw new Error("OpenRouter's model list was not in the expected shape.");
    }

    const models = payload.data.data
        .flatMap((row) => {
            const parsed = catalogRowSchema.safeParse(row);
            return parsed.success ? [parsed.data] : [];
        })
        .flatMap((row) => {
            const model = toCatalogModel(row);
            return model ? [model] : [];
        })
        .sort(byContextThenId);

    if (models.length === 0) {
        throw new Error("OpenRouter returned no eligible models.");
    }

    return models;
};

type Snapshot = Readonly<{ at: number; models: readonly CatalogModel[] }>;

let snapshot: Snapshot | undefined;

export const modelCatalog = async (): Promise<readonly CatalogModel[]> => {
    const now = Date.now();

    if (snapshot && now - snapshot.at < REFRESH_AFTER_MS) return snapshot.models;

    try {
        const models = await fetchCatalog();
        snapshot = { at: now, models };
        return models;
    } catch (error) {
        console.error("[model-catalog] refresh failed:", error);

        if (snapshot) return snapshot.models;

        throw new Error(CATALOG_UNAVAILABLE);
    }
};

export const isFreeModel = (model: CatalogModel): boolean => model.tier === "FREE";

export const arenaModels = (catalog: readonly CatalogModel[]): readonly CatalogModel[] =>
    catalog.filter((model) => model.tier !== null);

export const arenaCatalog = async (): Promise<readonly CatalogModel[]> =>
    arenaModels(await modelCatalog());

export const freeCatalog = async (): Promise<readonly CatalogModel[]> =>
    (await modelCatalog()).filter(isFreeModel);

export const getModelCatalog = createServerFn({ method: "GET" }).handler(() =>
    modelCatalog(),
);
