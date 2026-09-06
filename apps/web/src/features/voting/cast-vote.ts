import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const castVoteInputSchema = z.object({
    turnId: z.string().min(1).max(64),
    winnerResponseId: z.string().min(1).max(64),
});

export type CastVoteInput = Readonly<z.infer<typeof castVoteInputSchema>>;

export type CastVoteResult =
    | Readonly<{ status: "recorded"; winnerResponseId: string }>
    | Readonly<{ status: "already-voted"; winnerResponseId: string }>
    | Readonly<{ status: "signed-out" }>
    | Readonly<{ status: "error"; message: string }>;

export const VOTE_FAILED = "We couldn't save your vote just now. Try again.";
export const VOTE_SIGNED_OUT = "Your session ended. Sign in again to pick a winner.";
export const VOTE_NOT_READY = "Two models need to finish before you can pick a winner.";

export const castVote = createServerFn({ method: "POST" })
    .validator(castVoteInputSchema)
    .handler(async ({ data }): Promise<CastVoteResult> => {
        const [{ getRequest }, { runCastVote }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./cast-vote.server"),
        ]);

        return runCastVote(getRequest().headers, data);
    });
