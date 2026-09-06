import { ResponseStatus } from "@/generated/prisma/enums";
import { database } from "@/infrastructure/database";
import { captureVoteCast } from "@/infrastructure/posthog";
import { latestAttempts } from "@/infrastructure/response-order";
import { readSessionState } from "@/infrastructure/session.server";
import { MIN_VOTABLE_ANSWERS } from "@/infrastructure/turn-vote";
import { VOTE_FAILED, VOTE_NOT_READY } from "./cast-vote";
import type { CastVoteInput, CastVoteResult } from "./cast-vote";

type VoteOutcome = Readonly<{
    result: CastVoteResult;
    counted?: Readonly<{
        winnerModelId: string;
        candidateModelIds: readonly string[];
    }>;
}>;

const isDuplicateVote = (error: unknown): boolean =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002";

export const runCastVote = async (
    headers: Headers,
    input: CastVoteInput,
): Promise<CastVoteResult> => {
    const session = await readSessionState(headers);

    if (session.status === "signed-out") return { status: "signed-out" };
    if (session.status === "unavailable") {
        return { status: "error", message: VOTE_FAILED };
    }

    const userId = session.user.id;

    try {
        const outcome = await database().$transaction(
            async (tx): Promise<VoteOutcome> => {
                const turn = await tx.turn.findFirst({
                    where: { id: input.turnId, thread: { userId } },
                    select: {
                        id: true,
                        vote: { select: { winnerResponseId: true } },
                        responses: {
                            orderBy: { createdAt: "asc" },
                            select: { id: true, modelId: true, status: true },
                        },
                    },
                });

                if (turn === null) {
                    return { result: { status: "error", message: VOTE_FAILED } };
                }

                if (turn.vote !== null) {
                    return {
                        result: {
                            status: "already-voted",
                            winnerResponseId: turn.vote.winnerResponseId,
                        },
                    };
                }

                const finished = latestAttempts(turn.responses).filter(
                    (row) => row.status === ResponseStatus.COMPLETE,
                );

                if (finished.length < MIN_VOTABLE_ANSWERS) {
                    return { result: { status: "error", message: VOTE_NOT_READY } };
                }

                const winner = finished.find((row) => row.id === input.winnerResponseId);

                if (winner === undefined) {
                    return { result: { status: "error", message: VOTE_FAILED } };
                }

                const vote = await tx.vote.create({
                    data: {
                        turnId: turn.id,
                        winnerResponseId: input.winnerResponseId,
                        userId,
                    },
                    select: { winnerResponseId: true },
                });

                return {
                    result: {
                        status: "recorded",
                        winnerResponseId: vote.winnerResponseId,
                    },
                    counted: {
                        winnerModelId: winner.modelId,
                        candidateModelIds: finished.map((row) => row.modelId),
                    },
                };
            },
        );

        if (outcome.counted !== undefined) {
            captureVoteCast({
                userId,
                turnId: input.turnId,
                winnerResponseId: input.winnerResponseId,
                winnerModelId: outcome.counted.winnerModelId,
                candidateModelIds: outcome.counted.candidateModelIds,
            });
        }

        return outcome.result;
    } catch (error) {
        if (isDuplicateVote(error)) {
            const existing = await database()
                .vote.findUnique({
                    where: { turnId: input.turnId },
                    select: { winnerResponseId: true },
                })
                .catch(() => null);

            if (existing !== null) {
                return {
                    status: "already-voted",
                    winnerResponseId: existing.winnerResponseId,
                };
            }
        }

        console.error("[voting] could not record a vote:", error);
        return { status: "error", message: VOTE_FAILED };
    }
};
