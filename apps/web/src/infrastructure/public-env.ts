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
        "Set POSTHOG_KEY and POSTHOG_HOST (or their VITE_ equivalents) in the build environment.",
        "Rebuild and redeploy after changing them; restart the dev server for local changes.",
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
