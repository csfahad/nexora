import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const TITLE_WATCH_TURNS = 3;
export const TITLE_MAX_LENGTH = 120;

export const TITLE_TIMEOUT_MS = 12_000;
export const TITLE_MAX_OUTPUT_TOKENS = 512;
export const TITLE_MODEL_ATTEMPTS = 4;

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

const NOT_A_NAMER_MARKERS = [
    "content-safety",
    "safety",
    "moderation",
    "guard",
    "omni",
    "vl",
    "clip",
    "embed",
    "rerank",
] as const;

const INSTRUCT_MARKERS = ["instruct", "-it", "chat", "code"] as const;

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
    const notANamer = includesAny(text, NOT_A_NAMER_MARKERS) ? 60 : 0;
    const instruct = includesAny(text, INSTRUCT_MARKERS) ? -4 : 0;

    const size =
        billions === null
            ? 0
            : billions < 1
              ? 30
              : billions > 70
                ? 20
                : Math.min(billions, 40) / 8;

    return reasoning + notANamer + instruct + size;
};

export const rankTitleModels = <T extends Readonly<{ id: string; name: string }>>(
    catalog: readonly T[],
): readonly T[] =>
    [...catalog].sort(
        (a, b) => titleModelCost(a) - titleModelCost(b) || a.id.localeCompare(b.id),
    );

const LEADING_LABEL = /^(?:title|thread title|chat title|subject)\s*[:\-–—]\s*/i;
const WRAPPING_QUOTES = /^["'“”‘’`*\s]+|["'“”‘’`*\s]+$/g;

const VERDICT =
    /^(?:user\s+)?(?:safety|moderation|content|category|label|verdict)\s*[:\-–—]\s*\S+$/i;

const ECHOED_SHAPE = /^(?:messages?|prompt|question)\s*\d*\s*[:\-–—]\s*/i;

const collapseDoubled = (text: string): string => {
    if (text.length % 2 !== 0) return text;

    const half = text.length / 2;
    const first = text.slice(0, half);

    if (first !== text.slice(half) || half < 8 || !first.includes(" ")) return text;

    return first.trim();
};

export const cleanGeneratedTitle = (raw: string): string | null => {
    const firstLine = raw
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.replace(WRAPPING_QUOTES, "").length > 0);

    if (firstLine === undefined) return null;

    const stripped = collapseDoubled(
        firstLine
            .replace(WRAPPING_QUOTES, "")
            .replace(LEADING_LABEL, "")
            .replace(ECHOED_SHAPE, "")
            .replace(WRAPPING_QUOTES, "")
            .replace(/\s+/g, " ")
            .replace(/[.,;:]+$/, "")
            .trim(),
    );

    if (stripped.length < 2) return null;

    if (stripped.length > 72) return null;

    if (VERDICT.test(stripped)) return null;

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
