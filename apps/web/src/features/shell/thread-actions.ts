import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const threadMutationSchema = z.object({
    threadId: z.string().min(1).max(64),
});

const renameThreadSchema = threadMutationSchema.extend({
    title: z.string().trim().min(1).max(120),
});

export type ThreadMutationResult =
    | Readonly<{ status: "ok" }>
    | Readonly<{ status: "signed-out" }>
    | Readonly<{ status: "not-found" }>
    | Readonly<{ status: "error"; message: string }>;

export const THREAD_MUTATION_FAILED = "We couldn't update that thread. Try again.";
export const THREAD_SIGNED_OUT = "Your session ended. Sign in again to manage threads.";
export const THREAD_GONE = "That thread isn't there anymore.";

export const threadMutationNotice = (
    result: ThreadMutationResult | null,
): string | null => {
    if (result === null) return THREAD_MUTATION_FAILED;

    switch (result.status) {
        case "ok":
            return null;
        case "signed-out":
            return THREAD_SIGNED_OUT;
        case "not-found":
            return THREAD_GONE;
        case "error":
            return result.message;
    }
};

export const renameThread = createServerFn({ method: "POST" })
    .validator(renameThreadSchema)
    .handler(async ({ data }): Promise<ThreadMutationResult> => {
        const [{ getRequest }, { runRenameThread }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./thread-actions.server"),
        ]);

        return runRenameThread(getRequest().headers, data);
    });

export const deleteThread = createServerFn({ method: "POST" })
    .validator(threadMutationSchema)
    .handler(async ({ data }): Promise<ThreadMutationResult> => {
        const [{ getRequest }, { runDeleteThread }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./thread-actions.server"),
        ]);

        return runDeleteThread(getRequest().headers, data);
    });
