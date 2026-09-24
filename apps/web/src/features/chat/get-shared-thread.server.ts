import { database } from "@/infrastructure/database";
import { THREAD_TURNS_SELECT, toThreadTurns } from "./thread-turns.server";
import { SHARED_THREAD_READ_FAILED } from "./get-shared-thread";
import type { GetSharedThreadResult, SharedThreadInput } from "./get-shared-thread";

export const runGetSharedThread = async (
    input: SharedThreadInput,
): Promise<GetSharedThreadResult> => {
    try {
        const thread = await database().thread.findUnique({
            where: { shareSlug: input.slug },
            select: {
                title: true,
                turns: THREAD_TURNS_SELECT,
            },
        });

        if (thread === null) return { status: "not-found" };

        return {
            status: "found",
            thread: { title: thread.title, turns: toThreadTurns(thread.turns) },
        };
    } catch (error) {
        console.error("[sharing] could not read a shared thread:", error);
        return { status: "error", message: SHARED_THREAD_READ_FAILED };
    }
};
