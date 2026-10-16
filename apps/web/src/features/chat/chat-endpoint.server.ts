import { ResponseStatus } from "@/generated/prisma/enums";
import { database } from "@/infrastructure/database";
import { screenStream } from "@/infrastructure/arcjet";
import { SESSION_UNAVAILABLE } from "@/infrastructure/session";
import { readSessionState } from "@/infrastructure/session.server";
import { CATALOG_UNAVAILABLE, arenaCatalog } from "@/infrastructure/model-catalog";
import { chatRequestSchema } from "./chat-stream-protocol";
import { RESPONSE_FAILURE, failureSentence } from "@/infrastructure/response-failure";
import { chargeForReservation, settleCharge } from "@/infrastructure/allowance.server";
import type { Charge } from "@/infrastructure/allowance.server";
import { failureStream, streamModelResponse } from "./stream-model-response.server";
import { conversationFor } from "./thread-conversation";

const BAD_REQUEST = "That request wasn't something we could send.";
const SIGN_IN_REQUIRED = "Sign in to send a prompt.";
const ANSWER_NOT_FOUND = "We couldn't find that answer.";
const ANSWER_SETTLED = "That answer is already finished. Reload the thread to see it.";
const LOOKUP_FAILED = "We couldn't start that answer just now. Retry it on its own.";

const problem = (message: string, status: number): Response =>
    Response.json({ message }, { status });

const recordUnavailable = async (
    responseId: string,
    settle: Readonly<{ userId: string; charge: Charge | null }>,
): Promise<void> => {
    try {
        await database().$transaction(async (tx) => {
            await tx.modelResponse.update({
                where: { id: responseId },
                data: {
                    status: ResponseStatus.FAILED,
                    failure: RESPONSE_FAILURE.MODEL_UNAVAILABLE,
                },
            });

            if (settle.charge === null) return;

            await settleCharge(tx, {
                userId: settle.userId,
                charge: settle.charge,
                refund: true,
                costUsd: 0,
            });
        });
    } catch (error) {
        console.error(`[api/chat] could not mark ${responseId} unavailable:`, error);
    }
};

export const respondToChatRequest = async (request: Request): Promise<Response> => {
    const verdict = await screenStream(request);

    if (verdict.status === "blocked") return problem(verdict.message, verdict.httpStatus);

    const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));

    if (!parsed.success) return problem(BAD_REQUEST, 400);

    const session = await readSessionState(request.headers);

    if (session.status === "signed-out") return problem(SIGN_IN_REQUIRED, 401);
    if (session.status === "unavailable") return problem(SESSION_UNAVAILABLE, 503);

    const userId = session.user.id;

    try {
        const row = await database().modelResponse.findFirst({
            where: {
                id: parsed.data.responseId,
                turn: { thread: { userId } },
            },
            select: {
                id: true,
                modelId: true,
                status: true,
                turnId: true,
                tier: true,
                createdAt: true,
                turn: { select: { threadId: true } },
            },
        });

        if (row === null) return problem(ANSWER_NOT_FOUND, 404);

        if (row.status !== ResponseStatus.STREAMING) return problem(ANSWER_SETTLED, 409);

        const [catalog, charge] = await Promise.all([
            arenaCatalog().catch((error: unknown) => {
                console.error("[api/chat] catalog unavailable:", error);
                return null;
            }),
            chargeForReservation({
                userId,
                tier: row.tier,
                reservedAt: row.createdAt,
            }),
        ]);

        if (catalog === null) return problem(CATALOG_UNAVAILABLE, 503);

        const listed = catalog.find((model) => model.id === row.modelId);

        if (listed === undefined) {
            await recordUnavailable(row.id, { userId, charge });
            return failureStream(failureSentence(RESPONSE_FAILURE.MODEL_UNAVAILABLE));
        }

        const turns = await database().turn.findMany({
            where: { threadId: row.turn.threadId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                prompt: true,
                responses: {
                    select: { modelId: true, status: true, content: true },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        const position = turns.findIndex((turn) => turn.id === row.turnId);

        if (position < 0) return problem(ANSWER_NOT_FOUND, 404);

        const messages = conversationFor(row.modelId, turns.slice(0, position + 1));

        if (messages.length === 0) return problem(LOOKUP_FAILED, 500);

        return streamModelResponse({
            responseId: row.id,
            modelId: row.modelId,
            messages,
            signal: request.signal,
            userId,
            threadId: row.turn.threadId,
            turnId: row.turnId,
            prompt: turns[position]?.prompt ?? "",
            prices: {
                prompt: listed.promptPriceUsd,
                completion: listed.completionPriceUsd,
            },
            charge,
        });
    } catch (error) {
        console.error("[api/chat] could not read the row to stream:", error);
        return problem(LOOKUP_FAILED, 503);
    }
};
