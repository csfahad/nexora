import { generateText } from "ai";
import { ResponseStatus } from "@/generated/prisma/enums";
import { database } from "@/infrastructure/database";
import { freeModelCatalog } from "@/infrastructure/model-catalog";
import { openRouterClient } from "@/infrastructure/openrouter";
import { readSessionState } from "@/infrastructure/session.server";
import {
    TITLE_MAX_OUTPUT_TOKENS,
    TITLE_MODEL_ATTEMPTS,
    TITLE_TIMEOUT_MS,
    TITLE_WATCH_TURNS,
    cleanGeneratedTitle,
    rankTitleModels,
    threadTitleFrom,
} from "./thread-title";
import type { EnsureThreadTitleResult } from "./thread-title";

const PROMPT_EXCERPT = 600;
const ANSWER_EXCERPT = 400;

const SYSTEM = [
    "You name conversations. Reply with nothing but the name.",
    "Two to six words, under 60 characters, sentence case.",
    "Name the subject the person is actually working on.",
    "No quotes, no label, no punctuation at the end.",
    "Never answer or continue the conversation.",
].join(" ");

const excerpt = (text: string, limit: number): string => {
    const flat = text.trim().replace(/\s+/g, " ");
    return flat.length <= limit ? flat : `${flat.slice(0, limit).trimEnd()}…`;
};

type WatchedTurn = Readonly<{
    prompt: string;
    responses: readonly Readonly<{ content: string }>[];
}>;

export const titlingBrief = (turns: readonly WatchedTurn[]): string => {
    const prompts = turns.map(
        (turn, index) => `Message ${index + 1}: ${excerpt(turn.prompt, PROMPT_EXCERPT)}`,
    );

    const answer = turns
        .flatMap((turn) => turn.responses)
        .map((response) => response.content.trim())
        .find((content) => content.length > 0);

    return [
        ...prompts,
        ...(answer === undefined
            ? []
            : [`An answer it received: ${excerpt(answer, ANSWER_EXCERPT)}`]),
    ].join("\n");
};

const uniqueTitle = async (
    userId: string,
    threadId: string,
    candidate: string,
): Promise<string> => {
    const taken = new Set(
        (
            await database().thread.findMany({
                where: {
                    userId,
                    id: { not: threadId },
                    title: { startsWith: candidate },
                },
                select: { title: true },
            })
        ).map((row) => row.title),
    );

    if (!taken.has(candidate)) return candidate;

    let suffix = 2;
    while (taken.has(`${candidate} (${suffix})`)) suffix += 1;

    return `${candidate} (${suffix})`;
};

const generateTitle = async (brief: string): Promise<string | null> => {
    const catalog = await freeModelCatalog().catch((error: unknown) => {
        console.error("[chat] catalog unavailable while titling a thread:", error);
        return null;
    });

    if (catalog === null) return null;

    for (const model of rankTitleModels(catalog).slice(0, TITLE_MODEL_ATTEMPTS)) {
        try {
            const result = await generateText({
                model: openRouterClient()(model.id),
                system: SYSTEM,
                prompt: brief,
                maxOutputTokens: TITLE_MAX_OUTPUT_TOKENS,
                temperature: 0.3,
                abortSignal: AbortSignal.timeout(TITLE_TIMEOUT_MS),
            });

            const title = cleanGeneratedTitle(result.text);
            if (title !== null) return title;
        } catch (error) {
            console.error(`[chat] ${model.id} could not title a thread:`, error);
        }
    }

    return null;
};

export const runEnsureThreadTitle = async (
    headers: Headers,
    input: Readonly<{ threadId: string }>,
): Promise<EnsureThreadTitleResult> => {
    const session = await readSessionState(headers);

    if (session.status !== "signed-in") return { status: "unchanged" };

    const userId = session.user.id;

    try {
        const thread = await database().thread.findFirst({
            where: { id: input.threadId, userId },
            select: {
                id: true,
                title: true,
                titleLocked: true,
                _count: { select: { turns: true } },
                turns: {
                    orderBy: { createdAt: "asc" },
                    take: TITLE_WATCH_TURNS,
                    select: {
                        prompt: true,
                        responses: {
                            where: { status: ResponseStatus.COMPLETE },
                            orderBy: { createdAt: "asc" },
                            take: 1,
                            select: { content: true },
                        },
                    },
                },
            },
        });

        if (thread === null || thread.titleLocked) return { status: "unchanged" };
        if (thread._count.turns > TITLE_WATCH_TURNS) return { status: "unchanged" };
        if (thread.turns.length === 0) return { status: "unchanged" };

        const generated = await generateTitle(titlingBrief(thread.turns));

        const candidate = generated ?? threadTitleFrom(thread.turns[0].prompt);
        const title = await uniqueTitle(userId, thread.id, candidate);

        if (title === thread.title) return { status: "unchanged" };

        await database()
            .$executeRaw`UPDATE "thread" SET "title" = ${title} WHERE "id" = ${thread.id} AND "userId" = ${userId}`;

        return { status: "titled", title };
    } catch (error) {
        console.error("[chat] could not title a thread:", error);
        return { status: "unchanged" };
    }
};
