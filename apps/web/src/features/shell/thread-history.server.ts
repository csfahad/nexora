import { database } from "@/infrastructure/database";
import { readSessionState } from "@/infrastructure/session.server";
import { THREAD_HISTORY_LIMIT, groupThreadHistory } from "./thread-history";
import type { ThreadHistoryGroup } from "./thread-history";

export const runGetThreadHistory = async (
    headers: Headers,
): Promise<readonly ThreadHistoryGroup[]> => {
    const session = await readSessionState(headers);

    if (session.status !== "signed-in") return [];

    try {
        const threads = await database().thread.findMany({
            where: { userId: session.user.id },
            orderBy: { updatedAt: "desc" },
            take: THREAD_HISTORY_LIMIT,
            select: { id: true, title: true, updatedAt: true },
        });

        return groupThreadHistory(threads);
    } catch (error) {
        console.error("[shell] could not read thread history:", error);
        return [];
    }
};
