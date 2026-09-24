import { database } from "@/infrastructure/database";
import { readSessionState } from "@/infrastructure/session.server";
import { SEARCH_FAILED, SEARCH_LIMIT, snippetAround } from "./thread-search";
import type { ThreadSearchResult } from "./thread-search";

export const runSearchThreads = async (
    headers: Headers,
    input: Readonly<{ query: string }>,
): Promise<ThreadSearchResult> => {
    const session = await readSessionState(headers);

    if (session.status !== "signed-in") return { status: "ok", hits: [] };

    const query = input.query;
    const contains = { contains: query, mode: "insensitive" } as const;

    try {
        const threads = await database().thread.findMany({
            where: {
                userId: session.user.id,
                OR: [
                    { title: contains },
                    { turns: { some: { prompt: contains } } },
                    { turns: { some: { responses: { some: { content: contains } } } } },
                ],
            },
            orderBy: { updatedAt: "desc" },
            take: SEARCH_LIMIT,
            select: {
                id: true,
                title: true,
                turns: {
                    where: {
                        OR: [
                            { prompt: contains },
                            { responses: { some: { content: contains } } },
                        ],
                    },
                    orderBy: { createdAt: "asc" },
                    take: 1,
                    select: {
                        prompt: true,
                        responses: {
                            where: { content: contains },
                            orderBy: { createdAt: "asc" },
                            take: 1,
                            select: { content: true },
                        },
                    },
                },
            },
        });

        return {
            status: "ok",
            hits: threads.map((thread) => {
                const turn = thread.turns.at(0);
                const answer = turn?.responses.at(0)?.content;

                const snippet =
                    turn === undefined
                        ? null
                        : (snippetAround(turn.prompt, query, "prompt") ??
                          (answer === undefined
                              ? null
                              : snippetAround(answer, query, "answer")));

                return { id: thread.id, title: thread.title, snippet };
            }),
        };
    } catch (error) {
        console.error("[shell] could not search threads:", error);
        return { status: "error", message: SEARCH_FAILED };
    }
};
