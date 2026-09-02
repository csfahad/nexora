import { z } from "zod";

const publicEnvSchema = z.object({
    VITE_POSTHOG_KEY: z.string().min(1),
    VITE_POSTHOG_HOST: z.url(),
});

export type PublicEnv = Readonly<z.infer<typeof publicEnvSchema>>;

let cached: PublicEnv | undefined;

const formatMissing = (error: z.ZodError): string => {
    const lines = error.issues.map(
        (issue) => `  - ${issue.path.join(".")}: ${issue.message}`,
    );

    return [
        "Invalid or missing public environment variables:",
        ...lines,
        "",
        "Copy apps/web/.env.example to apps/web/.env and fill these in.",
        "A `VITE_` variable is read at build time, so restart the dev server after editing it.",
    ].join("\n");
};

export const publicEnv = (): PublicEnv => {
    if (cached) return cached;

    const parsed = publicEnvSchema.safeParse({
        VITE_POSTHOG_KEY: import.meta.env.VITE_POSTHOG_KEY,
        VITE_POSTHOG_HOST: import.meta.env.VITE_POSTHOG_HOST,
    });

    if (!parsed.success) throw new Error(formatMissing(parsed.error));

    cached = Object.freeze(parsed.data);
    return cached;
};
