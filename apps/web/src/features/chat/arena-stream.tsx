import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import type { ModelResponseMetrics } from "./model-response-metrics";
import { readModelStream } from "./read-model-stream";
import { RESPONSE_FAILURE, failureSentence } from "./response-failure";
import { RETRY_FAILED, RETRY_SIGNED_OUT, retryResponse } from "./retry-response";
import type { StartedResponse } from "./start-turn";

const FLUSH_MS = 60;

export type LiveResponse = Readonly<{
    modelId: string;
    modelName: string;
    status: "streaming" | "complete" | "failed";
    text: string;
    metrics: ModelResponseMetrics | null;
    message: string | null;
}>;

type ArenaStreamValue = Readonly<{
    live: ReadonlyMap<string, LiveResponse>;
    streaming: boolean;
    answering: number;
    start: (responses: readonly StartedResponse[]) => void;
    stop: () => void;
    retry: (responseId: string) => void;
    retryError: string | null;
}>;

const ArenaStreamContext = createContext<ArenaStreamValue | null>(null);

const seed = (response: StartedResponse): LiveResponse => ({
    modelId: response.modelId,
    modelName: response.modelName,
    status: response.available ? "streaming" : "failed",
    text: "",
    metrics: null,
    message: response.available
        ? null
        : failureSentence(RESPONSE_FAILURE.MODEL_UNAVAILABLE),
});

export const ArenaStreamProvider = ({ children }: { readonly children: ReactNode }) => {
    const router = useRouter();

    const [live, setLive] = useState<ReadonlyMap<string, LiveResponse>>(() => new Map());
    const [retryError, setRetryError] = useState<string | null>(null);

    const pending = useRef(new Map<string, string>());
    const flushTimer = useRef<number | null>(null);
    const controllers = useRef(new Map<string, AbortController>());

    useEffect(
        () => () => {
            if (flushTimer.current !== null) window.clearTimeout(flushTimer.current);
            controllers.current.forEach((controller) => controller.abort());
        },
        [],
    );

    const flush = useCallback(() => {
        flushTimer.current = null;

        const batch = [...pending.current];

        if (batch.length === 0) return;

        pending.current = new Map();

        setLive((current) =>
            batch.reduce((next, [responseId, text]) => {
                const entry = next.get(responseId);

                return entry === undefined
                    ? next
                    : new Map(next).set(responseId, {
                          ...entry,
                          text: entry.text + text,
                      });
            }, current),
        );
    }, []);

    const buffer = useCallback(
        (responseId: string, text: string) => {
            pending.current.set(
                responseId,
                (pending.current.get(responseId) ?? "") + text,
            );

            if (flushTimer.current === null) {
                flushTimer.current = window.setTimeout(flush, FLUSH_MS);
            }
        },
        [flush],
    );

    const settle = useCallback((responseId: string, change: Partial<LiveResponse>) => {
        const tail = pending.current.get(responseId) ?? "";

        pending.current.delete(responseId);

        setLive((current) => {
            const entry = current.get(responseId);

            if (entry === undefined || entry.status !== "streaming") return current;

            return new Map(current).set(responseId, {
                ...entry,
                text: entry.text + tail,
                ...change,
            });
        });
    }, []);

    const runStream = useCallback(
        async (responseId: string) => {
            const controller = new AbortController();

            controllers.current.set(responseId, controller);

            try {
                await readModelStream(
                    { responseId },
                    (event) => {
                        if (event.type === "delta") {
                            buffer(responseId, event.text);

                            return;
                        }

                        if (event.type === "done") {
                            settle(responseId, {
                                status: "complete",
                                metrics: event.metrics,
                                message: null,
                            });

                            return;
                        }

                        settle(responseId, {
                            status: "failed",
                            message: event.message,
                        });
                    },
                    controller.signal,
                );

                settle(responseId, {
                    status: "failed",
                    message: failureSentence(RESPONSE_FAILURE.INTERRUPTED),
                });
            } finally {
                controllers.current.delete(responseId);
                if (controllers.current.size === 0) void router.invalidate();
            }
        },
        [buffer, settle, router],
    );

    const start = useCallback(
        (responses: readonly StartedResponse[]) => {
            setRetryError(null);

            setLive((current) =>
                responses.reduce(
                    (next, response) => new Map(next).set(response.id, seed(response)),
                    current,
                ),
            );

            responses
                .filter((response) => response.available)
                .forEach((response) => void runStream(response.id));
        },
        [runStream],
    );

    const stop = useCallback(() => {
        [...controllers.current.entries()].forEach(([responseId, controller]) => {
            settle(responseId, {
                status: "failed",
                message: failureSentence(RESPONSE_FAILURE.CANCELLED),
            });

            controller.abort();
        });
    }, [settle]);

    const retry = useCallback(
        async (responseId: string) => {
            setRetryError(null);

            const result = await retryResponse({ data: { responseId } }).catch(
                (error: unknown) => {
                    console.error("[chat] retry could not be started", error);
                    return null;
                },
            );

            if (result === null) {
                setRetryError(RETRY_FAILED);
                return;
            }

            if (result.status === "signed-out") {
                setRetryError(RETRY_SIGNED_OUT);
                return;
            }

            if (result.status === "error") {
                setRetryError(result.message);
                return;
            }

            start([
                {
                    id: result.responseId,
                    modelId: result.modelId,
                    modelName: result.modelName,
                    available: true,
                },
            ]);

            void router.invalidate();
        },
        [start, router],
    );

    const answering = useMemo(
        () => [...live.values()].filter((entry) => entry.status === "streaming").length,
        [live],
    );

    const value = useMemo(
        (): ArenaStreamValue => ({
            live,
            streaming: answering > 0,
            answering,
            start,
            stop,
            retry: (responseId: string) => void retry(responseId),
            retryError,
        }),
        [live, answering, start, stop, retry, retryError],
    );

    return (
        <ArenaStreamContext.Provider value={value}>
            {children}
        </ArenaStreamContext.Provider>
    );
};

export const useArenaStream = (): ArenaStreamValue => {
    const value = useContext(ArenaStreamContext);

    if (value === null) {
        throw new Error("useArenaStream needs an ArenaStreamProvider above it.");
    }

    return value;
};
