import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { database } from "@/infrastructure/database";
import { serverEnv } from "@/infrastructure/env";

const createAuth = () => {
    const env = serverEnv();

    return betterAuth({
        baseURL: env.BETTER_AUTH_URL,
        secret: env.BETTER_AUTH_SECRET,
        database: prismaAdapter(database(), {
            provider: "postgresql",
            transaction: true,
        }),
        emailAndPassword: { enabled: false },
        socialProviders: {
            google: {
                clientId: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
            github: {
                clientId: env.GITHUB_CLIENT_ID,
                clientSecret: env.GITHUB_CLIENT_SECRET,
            },
        },
        plugins: [tanstackStartCookies()],
    });
};

let cached: ReturnType<typeof createAuth> | undefined;

export const auth = (): ReturnType<typeof createAuth> => {
    if (cached) return cached;

    cached = createAuth();

    return cached;
};
