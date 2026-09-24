import { database } from "@/infrastructure/database";
import { readOwnerId } from "@/infrastructure/session.server";
import { THREAD_MUTATION_FAILED } from "./thread-actions";
import type { ThreadMutationResult } from "./thread-actions";

export const runRenameThread = async (
    headers: Headers,
    input: Readonly<{ threadId: string; title: string }>,
): Promise<ThreadMutationResult> => {
    const userId = await readOwnerId(headers);
    if (userId === null) return { status: "signed-out" };

    try {
        const changed = await database()
            .$executeRaw`UPDATE "thread" SET "title" = ${input.title}, "titleLocked" = true WHERE "id" = ${input.threadId} AND "userId" = ${userId}`;

        return changed === 1 ? { status: "ok" } : { status: "not-found" };
    } catch (error) {
        console.error("[shell] could not rename thread:", error);
        return { status: "error", message: THREAD_MUTATION_FAILED };
    }
};

export const runDeleteThread = async (
    headers: Headers,
    input: Readonly<{ threadId: string }>,
): Promise<ThreadMutationResult> => {
    const userId = await readOwnerId(headers);
    if (userId === null) return { status: "signed-out" };

    try {
        const result = await database().thread.deleteMany({
            where: { id: input.threadId, userId },
        });

        return result.count === 1 ? { status: "ok" } : { status: "not-found" };
    } catch (error) {
        console.error("[shell] could not delete thread:", error);
        return { status: "error", message: THREAD_MUTATION_FAILED };
    }
};
