import { getRouteApi } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Plan } from "@/generated/prisma/enums";
import type { ModelTier } from "@/generated/prisma/enums";
import { FREE_ANSWERS_PER_DAY, PLANS, isPaidTier } from "@/infrastructure/plans";
import type { Allowance, PaidTier } from "@/infrastructure/plans";

export type AllowanceView = Readonly<{
    plan: Plan;
    planName: string;
    allowance: Allowance;
    remaining: Allowance;
    freeAnswersPerDay: number;
    freeAnswersRemaining: number;
    metered: boolean;
}>;

const NO_ALLOWANCE: Allowance = { STANDARD: 0, ADVANCED: 0, FRONTIER: 0 };

export const UNMETERED: AllowanceView = {
    plan: Plan.FREE,
    planName: PLANS[Plan.FREE].name,
    allowance: NO_ALLOWANCE,
    remaining: NO_ALLOWANCE,
    freeAnswersPerDay: FREE_ANSWERS_PER_DAY,
    freeAnswersRemaining: FREE_ANSWERS_PER_DAY,
    metered: false,
};

const rootRoute = getRouteApi("__root__");

export const useAllowance = (): AllowanceView => rootRoute.useLoaderData().allowance;

export const remainingFor = (view: AllowanceView, tier: ModelTier): number =>
    isPaidTier(tier) ? view.remaining[tier] : view.freeAnswersRemaining;

export const planAllows = (view: AllowanceView, tier: ModelTier): boolean =>
    !isPaidTier(tier) || view.allowance[tier] > 0;

export const TIER_WORD: Readonly<Record<PaidTier, string>> = {
    STANDARD: "Standard",
    ADVANCED: "Advanced",
    FRONTIER: "Frontier",
};

export const getAllowance = createServerFn({ method: "GET" }).handler(
    async (): Promise<AllowanceView> => {
        const [{ getRequest }, { readSessionState }, { readEntitlement }] =
            await Promise.all([
                import("@tanstack/react-start/server"),
                import("@/infrastructure/session.server"),
                import("@/infrastructure/entitlement.server"),
            ]);

        const session = await readSessionState(getRequest().headers);

        if (session.status !== "signed-in") return UNMETERED;

        const entitlement = await readEntitlement(session.user.id).catch(
            (error: unknown) => {
                console.error("[allowance] could not read an entitlement:", error);

                return null;
            },
        );

        if (entitlement === null) return UNMETERED;

        return {
            plan: entitlement.plan,
            planName: PLANS[entitlement.plan].name,
            allowance: entitlement.allowance,
            remaining: entitlement.remaining,
            freeAnswersPerDay: FREE_ANSWERS_PER_DAY,
            freeAnswersRemaining: entitlement.freeAnswersRemaining,
            metered: true,
        };
    },
);
