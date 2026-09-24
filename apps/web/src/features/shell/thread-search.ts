import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const SEARCH_MIN_LENGTH = 2;
export const SEARCH_LIMIT = 20;
export const SEARCH_SNIPPET_RADIUS = 48;

export const SEARCH_FAILED = "We couldn't search your threads just now. Try again.";

export const threadSearchSchema = z.object({
    query: z.string().trim().min(SEARCH_MIN_LENGTH).max(200),
});

export type SearchSnippet = Readonly<{
    source: "prompt" | "answer";
    before: string;
    match: string;
    after: string;
}>;

export type ThreadSearchHit = Readonly<{
    id: string;
    title: string;
    snippet: SearchSnippet | null;
}>;

export type ThreadSearchResult =
    | Readonly<{ status: "ok"; hits: readonly ThreadSearchHit[] }>
    | Readonly<{ status: "error"; message: string }>;

const ELLIPSIS = "…";

export const snippetAround = (
    text: string,
    query: string,
    source: SearchSnippet["source"],
): SearchSnippet | null => {
    const flat = text.trim().replace(/\s+/g, " ");
    const at = flat.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());

    if (at === -1) return null;

    const from = Math.max(0, at - SEARCH_SNIPPET_RADIUS);
    const to = Math.min(flat.length, at + query.length + SEARCH_SNIPPET_RADIUS);

    return {
        source,
        before: `${from > 0 ? ELLIPSIS : ""}${flat.slice(from, at)}`,
        match: flat.slice(at, at + query.length),
        after: `${flat.slice(at + query.length, to)}${to < flat.length ? ELLIPSIS : ""}`,
    };
};

export const searchThreads = createServerFn({ method: "POST" })
    .validator(threadSearchSchema)
    .handler(async ({ data }): Promise<ThreadSearchResult> => {
        const [{ getRequest }, { runSearchThreads }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./thread-search.server"),
        ]);

        return runSearchThreads(getRequest().headers, data);
    });
