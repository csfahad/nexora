import { database } from "@/infrastructure/database";
import { readOwnerId } from "@/infrastructure/session.server";
import { generateShareSlug } from "./share-slug";
import { SHARE_FAILED } from "./share-thread";
import type { ShareLinkResult } from "./share-thread";

const readSlug = async (
    threadId: string,
    userId: string,
): Promise<string | null | undefined> => {
    const thread = await database().thread.findFirst({
        where: { id: threadId, userId },
        select: { shareSlug: true },
    });

    return thread === null ? undefined : thread.shareSlug;
};

export const runReadShareLink = async (
    headers: Headers,
    input: Readonly<{ threadId: string }>,
): Promise<ShareLinkResult> => {
    const userId = await readOwnerId(headers);
    if (userId === null) return { status: "signed-out" };

    try {
        const slug = await readSlug(input.threadId, userId);

        return slug === undefined ? { status: "not-found" } : { status: "ok", slug };
    } catch (error) {
        console.error("[sharing] could not read a share link:", error);
        return { status: "error", message: SHARE_FAILED };
    }
};

export const runShareThread = async (
    headers: Headers,
    input: Readonly<{ threadId: string }>,
): Promise<ShareLinkResult> => {
    const userId = await readOwnerId(headers);
    if (userId === null) return { status: "signed-out" };

    try {
        const existing = await readSlug(input.threadId, userId);

        if (existing === undefined) return { status: "not-found" };

        if (existing !== null) return { status: "ok", slug: existing };

        const slug = generateShareSlug();

        const changed = await database()
            .$executeRaw`UPDATE "thread" SET "shareSlug" = ${slug} WHERE "id" = ${input.threadId} AND "userId" = ${userId} AND "shareSlug" IS NULL`;

        return changed === 1 ? { status: "ok", slug } : { status: "not-found" };
    } catch (error) {
        console.error("[sharing] could not share a thread:", error);
        return { status: "error", message: SHARE_FAILED };
    }
};

export const runRevokeShareLink = async (
    headers: Headers,
    input: Readonly<{ threadId: string }>,
): Promise<ShareLinkResult> => {
    const userId = await readOwnerId(headers);
    if (userId === null) return { status: "signed-out" };

    try {
        const changed = await database()
            .$executeRaw`UPDATE "thread" SET "shareSlug" = NULL WHERE "id" = ${input.threadId} AND "userId" = ${userId}`;

        return changed === 1 ? { status: "ok", slug: null } : { status: "not-found" };
    } catch (error) {
        console.error("[sharing] could not revoke a share link:", error);
        return { status: "error", message: SHARE_FAILED };
    }
};
