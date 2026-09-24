import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const threadSchema = z.object({
    threadId: z.string().min(1).max(64),
});

export type ShareLinkResult =
    | Readonly<{ status: "ok"; slug: string | null }>
    | Readonly<{ status: "signed-out" }>
    | Readonly<{ status: "not-found" }>
    | Readonly<{ status: "error"; message: string }>;

export const SHARE_FAILED = "We couldn't update that link. Try again.";
export const SHARE_SIGNED_OUT = "Your session ended. Sign in again to share a thread.";
export const SHARE_GONE = "That thread isn't there anymore.";

/** Every outcome as one plain sentence, or null when it worked. */
export const shareNotice = (result: ShareLinkResult | null): string | null => {
    if (result === null) return SHARE_FAILED;

    switch (result.status) {
        case "ok":
            return null;
        case "signed-out":
            return SHARE_SIGNED_OUT;
        case "not-found":
            return SHARE_GONE;
        case "error":
            return result.message;
    }
};

export const readShareLink = createServerFn({ method: "GET" })
    .validator(threadSchema)
    .handler(async ({ data }): Promise<ShareLinkResult> => {
        const [{ getRequest }, { runReadShareLink }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./share-thread.server"),
        ]);

        return runReadShareLink(getRequest().headers, data);
    });

export const shareThread = createServerFn({ method: "POST" })
    .validator(threadSchema)
    .handler(async ({ data }): Promise<ShareLinkResult> => {
        const [{ getRequest }, { runShareThread }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./share-thread.server"),
        ]);

        return runShareThread(getRequest().headers, data);
    });

export const revokeShareLink = createServerFn({ method: "POST" })
    .validator(threadSchema)
    .handler(async ({ data }): Promise<ShareLinkResult> => {
        const [{ getRequest }, { runRevokeShareLink }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./share-thread.server"),
        ]);

        return runRevokeShareLink(getRequest().headers, data);
    });
