import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { MAX_ARENA_MODELS } from "@/infrastructure/model-catalog";

export const PROMPT_MAX_LENGTH = 20_000;
const TITLE_MAX_LENGTH = 120;

export const startTurnInputSchema = z.object({
    prompt: z.string().trim().min(1).max(PROMPT_MAX_LENGTH),
    modelIds: z.array(z.string().min(1).max(200)).min(1).max(MAX_ARENA_MODELS),
    threadId: z.string().min(1).max(64).optional(),
});

export type StartTurnInput = Readonly<z.infer<typeof startTurnInputSchema>>;

export type StartedResponse = Readonly<{
    id: string;
    modelId: string;
    modelName: string;
    available: boolean;
}>;

export type StartTurnResult =
    | Readonly<{
          status: "started";
          threadId: string;
          turnId: string;
          responses: readonly StartedResponse[];
      }>
    | Readonly<{ status: "signed-out" }>
    | Readonly<{ status: "error"; message: string }>;

export const TURN_SAVE_FAILED = "We couldn't start that turn just now. Send it again.";
export const TURN_SIGNED_OUT = "Your session ended. Sign in again to send this prompt.";
export const TURN_MODELS_GONE =
    "None of those models are on the free list anymore. Pick another and try again.";
export const THREAD_NOT_FOUND = "We couldn't find that thread.";

export const threadTitleFrom = (prompt: string): string => {
    const flat = prompt.trim().replace(/\s+/g, " ");

    if (flat.length <= TITLE_MAX_LENGTH) return flat;

    const cut = flat.slice(0, TITLE_MAX_LENGTH);
    const lastSpace = cut.lastIndexOf(" ");

    return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};

export const startTurn = createServerFn({ method: "POST" })
    .validator(startTurnInputSchema)
    .handler(async ({ data }): Promise<StartTurnResult> => {
        const [{ getRequest }, { runStartTurn }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./start-turn.server"),
        ]);

        return runStartTurn(getRequest(), data);
    });
