import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const retryResponseInputSchema = z.object({
    responseId: z.string().min(1).max(64),
});

export type RetryResponseInput = Readonly<z.infer<typeof retryResponseInputSchema>>;

export type RetryResponseResult =
    | Readonly<{
          status: "started";
          responseId: string;
          modelId: string;
          modelName: string;
      }>
    | Readonly<{ status: "signed-out" }>
    | Readonly<{ status: "error"; message: string }>;

export const RETRY_FAILED = "We couldn't retry that just now. Try again.";
export const RETRY_SIGNED_OUT = "Your session ended. Sign in again to retry this answer.";
export const RETRY_MODEL_GONE =
    "This model isn't on the free list anymore, so it can't be retried.";

export const RETRY_ALREADY_DONE = "That answer finished, so there's nothing to retry.";

export const retryResponse = createServerFn({ method: "POST" })
    .validator(retryResponseInputSchema)
    .handler(async ({ data }): Promise<RetryResponseResult> => {
        const [{ getRequest }, { runRetryResponse }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./retry-response.server"),
        ]);

        return runRetryResponse(getRequest(), data);
    });
