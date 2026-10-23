import "@tanstack/react-start/server-only";
import { DODO_PRODUCT_VARIABLES, checkoutSlug } from "@/infrastructure/plans";
import type { PaidPlan } from "@/infrastructure/plans";
import type { BillingInterval } from "@/generated/prisma/enums";
import type { ServerEnv } from "@/infrastructure/env";

export const dodoProducts = (env: ServerEnv) =>
    Object.entries(DODO_PRODUCT_VARIABLES).flatMap(([plan, intervals]) =>
        Object.entries(intervals).map(([interval, variable]) => ({
            plan: plan as PaidPlan,
            interval: interval as BillingInterval,
            productId: env[variable],
            slug: checkoutSlug(plan as PaidPlan, interval as BillingInterval),
        })),
    );
