import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const TITLE_WATCH_TURNS = 3;
export const TITLE_MAX_LENGTH = 120;

export const TITLE_TIMEOUT_MS = 12_000;
export const TITLE_MAX_OUTPUT_TOKENS = 32;
export const TITLE_MODEL_ATTEMPTS = 3;

export const ensureThreadTitleSchema = z.object({
    threadId: z.string().min(1).max(64),
});

export type EnsureThreadTitleResult =
    | Readonly<{ status: "titled"; title: string }>
    | Readonly<{ status: "unchanged" }>;

export const threadTitleFrom = (prompt: string): string => {
    const flat = prompt.trim().replace(/\s+/g, " ");

    if (flat.length <= TITLE_MAX_LENGTH) return flat;

    const cut = flat.slice(0, TITLE_MAX_LENGTH);
    const lastSpace = cut.lastIndexOf(" ");

    return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

const REASONING_MARKERS = [
    "thinking",
    "reasoning",
    "reasoner",
    "deepseek-r1",
    "qwq",
    "-r1",
] as const;

const SMALL_MARKERS = [
    "mini",
    "small",
    "flash",
    "lite",
    "nano",
    "tiny",
    "micro",
] as const;

const INSTRUCT_MARKERS = ["instruct", "-it", "chat"] as const;

/** Parameter counts as written in model ids: `-8b`, `-3.8b`, `-27b`. */
const parameterBillions = (id: string): number | null => {
    const matches = [...id.matchAll(/(\d+(?:\.\d+)?)\s*b(?![a-z0-9])/gi)];
    const sizes = matches
        .map((match) => Number(match[1]))
        .filter((size) => Number.isFinite(size) && size > 0);

    return sizes.length > 0 ? Math.min(...sizes) : null;
};

const includesAny = (haystack: string, needles: readonly string[]): boolean =>
    needles.some((needle) => haystack.includes(needle));

const titleModelCost = (model: Readonly<{ id: string; name: string }>): number => {
    const text = `${model.id} ${model.name}`.toLowerCase();
    const billions = parameterBillions(text);

    const reasoning = includesAny(text, REASONING_MARKERS) ? 100 : 0;
    const small = includesAny(text, SMALL_MARKERS) ? -10 : 0;
    const instruct = includesAny(text, INSTRUCT_MARKERS) ? -4 : 0;
    const size = billions === null ? 0 : Math.min(billions, 60) / 4;

    return reasoning + small + instruct + size;
};

export const rankTitleModels = <T extends Readonly<{ id: string; name: string }>>(
    catalog: readonly T[],
): readonly T[] =>
    [...catalog].sort(
        (a, b) => titleModelCost(a) - titleModelCost(b) || a.id.localeCompare(b.id),
    );

const LEADING_LABEL = /^(?:title|thread title|chat title|subject)\s*[:\-–—]\s*/i;
const WRAPPING_QUOTES = /^["'“”‘’`*\s]+|["'“”‘’`*\s]+$/g;

export const cleanGeneratedTitle = (raw: string): string | null => {
    const firstLine = raw
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.replace(WRAPPING_QUOTES, "").length > 0);

    if (firstLine === undefined) return null;

    const stripped = firstLine
        .replace(WRAPPING_QUOTES, "")
        .replace(LEADING_LABEL, "")
        .replace(WRAPPING_QUOTES, "")
        .replace(/\s+/g, " ")
        .replace(/[.,;:]+$/, "")
        .trim();

    if (stripped.length < 2) return null;

    if (stripped.length > 72) return null;

    return stripped;
};

export const ensureThreadTitle = createServerFn({ method: "POST" })
    .validator(ensureThreadTitleSchema)
    .handler(async ({ data }): Promise<EnsureThreadTitleResult> => {
        const [{ getRequest }, { runEnsureThreadTitle }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./thread-title.server"),
        ]);

        return runEnsureThreadTitle(getRequest().headers, data);
    });
