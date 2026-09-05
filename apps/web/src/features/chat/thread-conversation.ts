import type { ModelMessage } from "ai";
import { latestAttempts } from "@/infrastructure/response-order";

export type HistoryResponse = Readonly<{
    modelId: string;
    status: "STREAMING" | "COMPLETE" | "FAILED";
    content: string;
}>;

export type HistoryTurn = Readonly<{
    prompt: string;
    responses: readonly HistoryResponse[];
}>;

export const conversationFor = (
    modelId: string,
    turnsInOrder: readonly HistoryTurn[],
): readonly ModelMessage[] =>
    turnsInOrder.flatMap((turn): readonly ModelMessage[] => {
        const asked: ModelMessage = { role: "user", content: turn.prompt };

        const answer = latestAttempts(turn.responses).find(
            (response) => response.modelId === modelId,
        );

        const answered =
            answer?.status === "COMPLETE" && answer.content.trim().length > 0
                ? [{ role: "assistant", content: answer.content } satisfies ModelMessage]
                : [];

        return [asked, ...answered];
    });
