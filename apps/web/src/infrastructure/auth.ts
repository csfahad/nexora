import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { createAuthPlugins } from "@/infrastructure/dodo-plugin";
import { dodoClient } from "@/infrastructure/dodo.server";
import { dodoProducts } from "@/infrastructure/dodo-products.server";
import { onDodoPayload } from "@/infrastructure/dodo-webhook.server";
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
        hooks: {
            before: createAuthMiddleware(async (ctx) => {
                if (
                    ctx.path !== "/dodopayments/checkout-session" &&
                    ctx.path !== "/dodopayments/checkout"
                )
                    return;
                const session = await getSessionFromCtx(ctx);
                if (!session)
                    throw new APIError("UNAUTHORIZED", {
                        message: "Sign in to choose a plan.",
                    });
                const product = dodoProducts(env).find(
                    (item) => item.slug === ctx.body?.slug,
                );
                if (!product)
                    throw new APIError("BAD_REQUEST", {
                        message:
                            "Choose a plan and billing interval from the plans page.",
                    });
                if (Object.keys(ctx.body ?? {}).some((key) => key !== "slug")) {
                    throw new APIError("BAD_REQUEST", {
                        message:
                            "Choose a plan from the plans page without overriding checkout details.",
                    });
                }
                const subscription = await database().subscription.findUnique({
                    where: { userId: session.user.id },
                });
                if (
                    subscription &&
                    subscription.currentPeriodEnd > new Date() &&
                    subscription.status !== "EXPIRED" &&
                    subscription.status !== "FAILED"
                ) {
                    throw new APIError("BAD_REQUEST", {
                        message:
                            "Manage your existing subscription in the billing portal.",
                    });
                }
            }),
        },
        plugins: createAuthPlugins({
            client: dodoClient(),
            products: dodoProducts(env),
            successUrl: new URL(
                "/settings/billing?checkout=returned",
                env.BETTER_AUTH_URL,
            ).toString(),
            webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
            onPayload: onDodoPayload,
        }),
    });
};

let cached: ReturnType<typeof createAuth> | undefined;

export const auth = (): ReturnType<typeof createAuth> => {
    if (cached) return cached;

    cached = createAuth();

    return cached;
};
