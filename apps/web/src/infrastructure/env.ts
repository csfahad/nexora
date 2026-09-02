import { z } from "zod";

const serverEnvSchema = z.object({
    DATABASE_URL: z.string().min(1),
    BETTER_AUTH_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    OPENROUTER_API_KEY: z.string().min(1),
    ARCJET_KEY: z.string().min(1),
    POSTHOG_KEY: z.string().min(1),
    POSTHOG_HOST: z.url(),
});

export type ServerEnv = Readonly<z.infer<typeof serverEnvSchema>>;

let cached: ServerEnv | undefined;

const formatMissing = (error: z.ZodError): string => {
    const lines = error.issues.map((issue) => {
        const name = issue.path.join(".");
        return `  - ${name}: ${issue.message}`;
    });

    return [
        "Invalid or missing environment variables:",
        ...lines,
        "",
        "Copy apps/web/.env.example to apps/web/.env and fill these in.",
    ].join("\n");
};

export const serverEnv = (): ServerEnv => {
    if (cached) return cached;

    const parsed = serverEnvSchema.safeParse(process.env);

    if (!parsed.success) {
        throw new Error(formatMissing(parsed.error));
    }

    cached = Object.freeze(parsed.data);
    return cached;
};
