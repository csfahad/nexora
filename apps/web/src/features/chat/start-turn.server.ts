import { ResponseStatus } from "@/generated/prisma/enums";
import { database } from "@/infrastructure/database";
import { screenPrompt } from "@/infrastructure/arcjet";
import { capturePromptSent } from "@/infrastructure/posthog";
import { CATALOG_UNAVAILABLE, freeModelCatalog } from "@/infrastructure/model-catalog";
import { readSessionState } from "@/infrastructure/session.server";
import { byModelName, latestAttempts } from "@/infrastructure/response-order";
import { RESPONSE_FAILURE } from "./response-failure";
import {
    THREAD_NOT_FOUND,
    TURN_MODELS_GONE,
    TURN_SAVE_FAILED,
    threadTitleFrom,
} from "./start-turn";
import type { StartTurnInput, StartTurnResult } from "./start-turn";

type PlannedModel = Readonly<{
    modelId: string;
    modelName: string;
    available: boolean;
}>;

const planModels = (
    wanted: readonly Readonly<{ modelId: string; modelName: string | null }>[],
    catalog: readonly Readonly<{ id: string; name: string }>[],
): readonly PlannedModel[] =>
    wanted.map(({ modelId, modelName }) => {
        const listed = catalog.find((model) => model.id === modelId);

        return {
            modelId,
            modelName: listed?.name ?? modelName ?? modelId,
            available: listed !== undefined,
        };
    });

export const runStartTurn = async (
    request: Request,
    input: StartTurnInput,
): Promise<StartTurnResult> => {
    const session = await readSessionState(request.headers);

    if (session.status === "signed-out") return { status: "signed-out" };
    if (session.status === "unavailable") {
        return { status: "error", message: TURN_SAVE_FAILED };
    }

    const userId = session.user.id;

    const verdict = await screenPrompt(request, {
        userId,
        prompt: input.prompt,
        models: input.modelIds.length,
    });

    if (verdict.status === "blocked") {
        return { status: "error", message: verdict.message };
    }

    const catalog = await freeModelCatalog().catch((error: unknown) => {
        console.error("[chat] catalog unavailable while starting a turn:", error);

        return null;
    });

    if (!catalog) return { status: "error", message: CATALOG_UNAVAILABLE };

    try {
        const result = await database().$transaction(
            async (tx): Promise<StartTurnResult> => {
                const thread = input.threadId
                    ? await tx.thread.findFirst({
                          where: { id: input.threadId, userId },
                          select: { id: true },
                      })
                    : null;

                if (input.threadId !== undefined && thread === null) {
                    return { status: "error", message: THREAD_NOT_FOUND };
                }
                const firstTurn = thread
                    ? await tx.turn.findFirst({
                          where: { threadId: thread.id },
                          orderBy: { createdAt: "asc" },
                          select: {
                              responses: {
                                  select: { modelId: true, modelName: true },
                                  orderBy: { createdAt: "asc" },
                              },
                          },
                      })
                    : null;

                const locked = latestAttempts(firstTurn?.responses ?? []);

                const planned = planModels(
                    locked.length > 0
                        ? locked
                        : [...new Set(input.modelIds)].map((modelId) => ({
                              modelId,
                              modelName: null,
                          })),
                    catalog,
                );

                if (!planned.some((model) => model.available)) {
                    return { status: "error", message: TURN_MODELS_GONE };
                }

                const saved = thread
                    ? await tx.thread.update({
                          where: { id: thread.id },
                          data: { updatedAt: new Date() },
                          select: { id: true },
                      })
                    : await tx.thread.create({
                          data: { userId, title: threadTitleFrom(input.prompt) },
                          select: { id: true },
                      });

                const turn = await tx.turn.create({
                    data: { threadId: saved.id, prompt: input.prompt },
                    select: { id: true },
                });

                const rows = await tx.modelResponse.createManyAndReturn({
                    data: planned.map((model) => ({
                        turnId: turn.id,
                        modelId: model.modelId,
                        modelName: model.modelName,
                        ...(model.available
                            ? {}
                            : {
                                  status: ResponseStatus.FAILED,
                                  failure: RESPONSE_FAILURE.MODEL_UNAVAILABLE,
                              }),
                    })),
                    select: { id: true, modelId: true, modelName: true, status: true },
                });

                return {
                    status: "started",
                    threadId: saved.id,
                    turnId: turn.id,
                    responses: [...rows].sort(byModelName).map((row) => ({
                        id: row.id,
                        modelId: row.modelId,
                        modelName: row.modelName,
                        available: row.status === ResponseStatus.STREAMING,
                    })),
                };
            },
        );

        if (result.status === "started") {
            capturePromptSent({
                userId,
                threadId: result.threadId,
                turnId: result.turnId,
                modelIds: result.responses.map((response) => response.modelId),
                available: result.responses.filter((response) => response.available)
                    .length,
                followUp: input.threadId !== undefined,
            });
        }

        return result;
    } catch (error) {
        console.error("[chat] could not write a turn:", error);
        return { status: "error", message: TURN_SAVE_FAILED };
    }
};
