import { ResponseStatus } from "@/generated/prisma/enums";
import { database } from "@/infrastructure/database";
import { screenRetry } from "@/infrastructure/arcjet";
import { readSessionState } from "@/infrastructure/session.server";
import { CATALOG_UNAVAILABLE, freeModelCatalog } from "@/infrastructure/model-catalog";
import { RESPONSE_FAILURE } from "./response-failure";
import { RETRY_ALREADY_DONE, RETRY_FAILED, RETRY_MODEL_GONE } from "./retry-response";
import type { RetryResponseInput, RetryResponseResult } from "./retry-response";

export const runRetryResponse = async (
    request: Request,
    input: RetryResponseInput,
): Promise<RetryResponseResult> => {
    const session = await readSessionState(request.headers);

    if (session.status === "signed-out") return { status: "signed-out" };
    if (session.status === "unavailable") {
        return { status: "error", message: RETRY_FAILED };
    }

    const verdict = await screenRetry(request, { userId: session.user.id });

    if (verdict.status === "blocked") {
        return { status: "error", message: verdict.message };
    }

    const catalog = await freeModelCatalog().catch((error: unknown) => {
        console.error("[chat] catalog unavailable while retrying:", error);

        return null;
    });

    if (catalog === null) return { status: "error", message: CATALOG_UNAVAILABLE };

    try {
        return await database().$transaction(async (tx): Promise<RetryResponseResult> => {
            const previous = await tx.modelResponse.findFirst({
                where: {
                    id: input.responseId,
                    turn: { thread: { userId: session.user.id } },
                },
                select: { id: true, turnId: true, modelId: true, status: true },
            });

            if (previous === null) return { status: "error", message: RETRY_FAILED };

            if (previous.status === ResponseStatus.COMPLETE) {
                return { status: "error", message: RETRY_ALREADY_DONE };
            }

            const listed = catalog.find((model) => model.id === previous.modelId);

            if (listed === undefined) {
                return { status: "error", message: RETRY_MODEL_GONE };
            }

            if (previous.status === ResponseStatus.STREAMING) {
                await tx.modelResponse.update({
                    where: { id: previous.id },
                    data: {
                        status: ResponseStatus.FAILED,
                        failure: RESPONSE_FAILURE.INTERRUPTED,
                    },
                });
            }

            const created = await tx.modelResponse.create({
                data: {
                    turnId: previous.turnId,
                    modelId: previous.modelId,
                    modelName: listed.name,
                },
                select: { id: true, modelId: true, modelName: true },
            });

            return {
                status: "started",
                responseId: created.id,
                modelId: created.modelId,
                modelName: created.modelName,
            };
        });
    } catch (error) {
        console.error("[chat] could not retry a response:", error);
        return { status: "error", message: RETRY_FAILED };
    }
};
