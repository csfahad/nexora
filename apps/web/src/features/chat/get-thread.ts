import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { ModelResponseMetrics } from "./model-response-metrics";

export const getThreadInputSchema = z.object({
    threadId: z.string().min(1).max(64),
});

export type GetThreadInput = Readonly<z.infer<typeof getThreadInputSchema>>;

export type ThreadResponse = Readonly<{
    id: string;
    modelId: string;
    modelName: string;
    status: "STREAMING" | "COMPLETE" | "FAILED";
    content: string;
    failure: string | null;
    metrics: ModelResponseMetrics | null;
}>;

export type ThreadTurn = Readonly<{
    id: string;
    prompt: string;
    responses: readonly ThreadResponse[];
    vote: Readonly<{ winnerResponseId: string }> | null;
}>;

export type ThreadView = Readonly<{
    id: string;
    title: string;
    modelIds: readonly string[];
    turns: readonly ThreadTurn[];
}>;

export type GetThreadResult =
    | Readonly<{ status: "found"; thread: ThreadView }>
    | Readonly<{ status: "signed-out" }>
    | Readonly<{ status: "not-found" }>
    | Readonly<{ status: "error"; message: string }>;

export const THREAD_READ_FAILED = "We couldn't open that thread just now. Try again.";

export const getThread = createServerFn({ method: "GET" })
    .validator(getThreadInputSchema)
    .handler(async ({ data }): Promise<GetThreadResult> => {
        const [{ getRequest }, { runGetThread }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./get-thread.server"),
        ]);

        return runGetThread(getRequest().headers, data);
    });
