import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { IconMessage, IconSearch } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SEARCH_FAILED, SEARCH_MIN_LENGTH, searchThreads } from "./thread-search";
import type { SearchSnippet, ThreadSearchHit } from "./thread-search";
import type { ThreadHistoryGroup } from "./thread-history";

const SEARCH_DEBOUNCE_MS = 180;
const RECENT_SHOWN = 8;
const QUERY_MAX_LENGTH = 200;

type SearchState =
    | Readonly<{ status: "idle" }>
    | Readonly<{ status: "searching"; hits: readonly ThreadSearchHit[] }>
    | Readonly<{ status: "ready"; hits: readonly ThreadSearchHit[] }>
    | Readonly<{ status: "error"; message: string }>;

const useThreadSearch = (query: string, open: boolean): SearchState => {
    const [state, setState] = useState<SearchState>({ status: "idle" });
    const latest = useRef(0);

    useEffect(() => {
        const trimmed = query.trim().slice(0, QUERY_MAX_LENGTH);
        latest.current += 1;
        const ticket = latest.current;

        if (!open || trimmed.length < SEARCH_MIN_LENGTH) {
            setState({ status: "idle" });
            return;
        }

        setState((previous) => ({
            status: "searching",
            hits: previous.status === "ready" ? previous.hits : [],
        }));

        const timer = window.setTimeout(() => {
            void searchThreads({ data: { query: trimmed } })
                .catch((error: unknown) => {
                    console.error("[shell] thread search failed", error);
                    return null;
                })
                .then((result) => {
                    if (ticket !== latest.current) return;

                    setState(
                        result === null
                            ? { status: "error", message: SEARCH_FAILED }
                            : result.status === "error"
                              ? { status: "error", message: result.message }
                              : { status: "ready", hits: result.hits },
                    );
                });
        }, SEARCH_DEBOUNCE_MS);

        return () => window.clearTimeout(timer);
    }, [query, open]);

    return state;
};

const Snippet = ({ snippet }: { readonly snippet: SearchSnippet }) => (
    <span className="palette-snippet">
        <span className="label-meta mr-1.5">
            {snippet.source === "prompt" ? "You" : "Answer"}
        </span>
        {snippet.before}
        <mark>{snippet.match}</mark>
        {snippet.after}
    </span>
);

const optionId = (index: number): string => `thread-search-hit-${index}`;

const emptyMessage = (state: SearchState, query: string): string => {
    switch (state.status) {
        case "error":
            return state.message;
        case "searching":
            return "Searching…";
        case "ready":
            return `Nothing matches “${query.trim()}”.`;
        case "idle":
            return "Your threads will appear here once you send a prompt.";
    }
};

export const ThreadSearchDialog = ({
    open,
    onOpenChange,
    threadGroups,
    onNavigate,
}: Readonly<{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    threadGroups: readonly ThreadHistoryGroup[];
    onNavigate?: () => void;
}>) => {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [cursor, setCursor] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    const state = useThreadSearch(query, open);

    const recent = useMemo(
        (): readonly ThreadSearchHit[] =>
            threadGroups
                .flatMap((group) => group.threads)
                .slice(0, RECENT_SHOWN)
                .map((thread) => ({ ...thread, snippet: null })),
        [threadGroups],
    );

    const rows =
        state.status === "idle" ? recent : state.status === "error" ? [] : state.hits;

    useEffect(() => setCursor(0), [query, state.status]);

    useEffect(() => {
        listRef.current
            ?.querySelector(`#${optionId(cursor)}`)
            ?.scrollIntoView({ block: "nearest" });
    }, [cursor, rows.length]);

    const close = () => {
        onOpenChange(false);
        onNavigate?.();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                onOpenChange(next);
                if (!next) setQuery("");
            }}
        >
            <DialogContent
                align="top"
                aria-describedby={undefined}
                className="max-w-xl overflow-hidden p-0"
            >
                <DialogTitle className="sr-only">Search threads</DialogTitle>

                <div className="border-border h-13 flex items-center gap-3 border-b px-4">
                    <IconSearch
                        aria-hidden
                        className="text-muted-foreground size-4.5 shrink-0"
                        stroke={1.75}
                    />

                    <input
                        autoFocus
                        role="combobox"
                        aria-expanded
                        aria-autocomplete="list"
                        aria-controls="thread-search-results"
                        aria-activedescendant={
                            rows.length > 0 ? optionId(cursor) : undefined
                        }
                        aria-label="Search your threads"
                        placeholder="Search titles, prompts and answers"
                        maxLength={QUERY_MAX_LENGTH}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={(event) => {
                            if (rows.length === 0) return;

                            if (event.key === "ArrowDown") {
                                event.preventDefault();
                                setCursor((at) => (at + 1) % rows.length);
                            } else if (event.key === "ArrowUp") {
                                event.preventDefault();
                                setCursor((at) => (at - 1 + rows.length) % rows.length);
                            } else if (event.key === "Enter") {
                                event.preventDefault();
                                const row = rows.at(cursor);

                                if (row !== undefined) {
                                    close();
                                    void router.navigate({
                                        to: "/thread/$threadId",
                                        params: { threadId: row.id },
                                    });
                                }
                            }
                        }}
                        className="text-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
                    />
                </div>

                <div
                    ref={listRef}
                    id="thread-search-results"
                    role="listbox"
                    aria-label={state.status === "idle" ? "Recent threads" : "Results"}
                    className="max-h-[min(58vh,26rem)] overflow-y-auto p-2"
                >
                    {state.status === "idle" && rows.length > 0 && (
                        <p className="label-meta px-2.5 pb-1">Recent</p>
                    )}

                    {rows.map((row, index) => (
                        <Link
                            key={row.id}
                            to="/thread/$threadId"
                            params={{ threadId: row.id }}
                            id={optionId(index)}
                            role="option"
                            aria-selected={index === cursor}
                            data-active={index === cursor}
                            onMouseMove={() => setCursor(index)}
                            onClick={close}
                            className="palette-hit"
                        >
                            <IconMessage aria-hidden className="size-4" stroke={1.75} />

                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate text-sm">{row.title}</span>
                                {row.snippet !== null && (
                                    <Snippet snippet={row.snippet} />
                                )}
                            </span>
                        </Link>
                    ))}

                    {rows.length === 0 && (
                        <p
                            role={state.status === "error" ? "alert" : undefined}
                            className="text-muted-foreground text-pretty px-2.5 py-8 text-center text-sm"
                        >
                            {emptyMessage(state, query)}
                        </p>
                    )}
                </div>

                <div className="border-border text-muted-foreground flex items-center gap-4 border-t px-4 py-2.5 text-[0.6875rem]">
                    <span className="flex items-center gap-1.5">
                        <kbd className="kbd">↑</kbd>
                        <kbd className="kbd">↓</kbd>
                        to move
                    </span>
                    <span className="flex items-center gap-1.5">
                        <kbd className="kbd">↵</kbd>
                        to open
                    </span>
                    <span className="ml-auto flex items-center gap-1.5">
                        <kbd className="kbd">esc</kbd>
                        to close
                    </span>
                </div>
            </DialogContent>
        </Dialog>
    );
};
