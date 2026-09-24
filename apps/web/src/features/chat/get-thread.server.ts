import { database } from "@/infrastructure/database";
import { readSessionState } from "@/infrastructure/session.server";
import { THREAD_TURNS_SELECT, toThreadTurns } from "./thread-turns.server";
import { THREAD_READ_FAILED } from "./get-thread";
import type { GetThreadInput, GetThreadResult } from "./get-thread";

export const runGetThread = async (
    headers: Headers,
    input: GetThreadInput,
): Promise<GetThreadResult> => {
    const session = await readSessionState(headers);

    if (session.status === "signed-out") return { status: "signed-out" };
    if (session.status === "unavailable") {
        return { status: "error", message: THREAD_READ_FAILED };
    }

    try {
        const thread = await database().thread.findFirst({
            where: { id: input.threadId, userId: session.user.id },
            select: {
                id: true,
                title: true,
                turns: THREAD_TURNS_SELECT,
            },
        });

        if (thread === null) return { status: "not-found" };

        const turns = toThreadTurns(thread.turns);

        return {
            status: "found",
            thread: {
                id: thread.id,
                title: thread.title,
                modelIds: (turns[0]?.responses ?? []).map((row) => row.modelId),
                turns,
            },
        };
    } catch (error) {
        console.error("[chat] could not read a thread:", error);
        return { status: "error", message: THREAD_READ_FAILED };
    }
};
