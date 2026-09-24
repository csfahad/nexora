import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { ThreadTurn } from "./get-thread";

export const sharedThreadInputSchema = z.object({
    slug: z.string().min(1).max(64),
});

export type SharedThreadInput = Readonly<z.infer<typeof sharedThreadInputSchema>>;

export type SharedThreadView = Readonly<{
    title: string;
    turns: readonly ThreadTurn[];
}>;

export type GetSharedThreadResult =
    | Readonly<{ status: "found"; thread: SharedThreadView }>
    | Readonly<{ status: "not-found" }>
    | Readonly<{ status: "error"; message: string }>;

export const SHARED_THREAD_READ_FAILED =
    "We couldn't open this shared thread just now. Try again.";

export const SHARED_THREAD_GONE =
    "This link doesn't work anymore. Whoever shared it can send a new one.";

export const getSharedThread = createServerFn({ method: "GET" })
    .validator(sharedThreadInputSchema)
    .handler(async ({ data }): Promise<GetSharedThreadResult> => {
        const { runGetSharedThread } = await import("./get-shared-thread.server");

        return runGetSharedThread(data);
    });
