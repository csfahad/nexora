import { Plan, SubscriptionStatus, UsageScope } from "@/generated/prisma/enums";
import type { BillingInterval, ModelTier } from "@/generated/prisma/enums";
import { database } from "@/infrastructure/database";
import { allowanceWindow, dailyWindow } from "@/infrastructure/billing-window";
import type { Window } from "@/infrastructure/billing-window";
import {
    FREE_ANSWERS_PER_DAY,
    PLANS,
    allowanceFor,
    isPaidTier,
} from "@/infrastructure/plans";
import type { Allowance } from "@/infrastructure/plans";

const ZERO: Allowance = { STANDARD: 0, ADVANCED: 0, FRONTIER: 0 };

export type Entitlement = Readonly<{
    plan: Plan;
    interval: BillingInterval | null;
    allowance: Allowance;
    used: Allowance;
    remaining: Allowance;
    freeAnswersUsed: number;
    freeAnswersRemaining: number;
    window: Window | null;
    renewsAt: Date | null;
    cancelAtPeriodEnd: boolean;
}>;

type SubscriptionRow = Readonly<{
    plan: Plan;
    interval: BillingInterval;
    status: SubscriptionStatus;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    pastDueEndsAt: Date | null;
}>;

export const effectivePlan = (subscription: SubscriptionRow | null, now: Date): Plan => {
    if (subscription === null) return Plan.FREE;

    switch (subscription.status) {
        case SubscriptionStatus.ACTIVE:
            return subscription.currentPeriodEnd > now ? subscription.plan : Plan.FREE;

        case SubscriptionStatus.CANCELLED:
            return subscription.currentPeriodEnd > now ? subscription.plan : Plan.FREE;

        case SubscriptionStatus.PAST_DUE:
            return subscription.pastDueEndsAt !== null && subscription.pastDueEndsAt > now
                ? subscription.plan
                : Plan.FREE;

        case SubscriptionStatus.ON_HOLD:
        case SubscriptionStatus.EXPIRED:
        case SubscriptionStatus.FAILED:
            return Plan.FREE;
    }
};

const remainingOf = (allowance: Allowance, used: Allowance): Allowance => ({
    STANDARD: Math.max(0, allowance.STANDARD - used.STANDARD),
    ADVANCED: Math.max(0, allowance.ADVANCED - used.ADVANCED),
    FRONTIER: Math.max(0, allowance.FRONTIER - used.FRONTIER),
});

const FREE_ENTITLEMENT: Omit<Entitlement, "freeAnswersUsed" | "freeAnswersRemaining"> = {
    plan: Plan.FREE,
    interval: null,
    allowance: ZERO,
    used: ZERO,
    remaining: ZERO,
    window: null,
    renewsAt: null,
    cancelAtPeriodEnd: false,
};

export const readEntitlement = async (
    userId: string,
    now: Date = new Date(),
): Promise<Entitlement> => {
    const subscription = await database().subscription.findUnique({
        where: { userId },
        select: {
            plan: true,
            interval: true,
            status: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
            pastDueEndsAt: true,
        },
    });

    const plan = effectivePlan(subscription, now);
    const day = dailyWindow(now);

    const window =
        plan === Plan.FREE || subscription === null
            ? null
            : allowanceWindow(
                  subscription.currentPeriodStart,
                  subscription.currentPeriodEnd,
                  new Date(
                      Math.min(
                          now.getTime(),
                          subscription.currentPeriodEnd.getTime() - 1,
                      ),
                  ),
              );

    const [daily, billing] = await Promise.all([
        database().usagePeriod.findUnique({
            where: {
                userId_scope_periodStart: {
                    userId,
                    scope: UsageScope.DAILY,
                    periodStart: day.start,
                },
            },
            select: { freeAnswers: true },
        }),
        window === null
            ? Promise.resolve(null)
            : database().usagePeriod.findUnique({
                  where: {
                      userId_scope_periodStart: {
                          userId,
                          scope: UsageScope.BILLING,
                          periodStart: window.start,
                      },
                  },
                  select: { standard: true, advanced: true, frontier: true },
              }),
    ]);

    const freeAnswersUsed = daily?.freeAnswers ?? 0;

    const used: Allowance = {
        STANDARD: billing?.standard ?? 0,
        ADVANCED: billing?.advanced ?? 0,
        FRONTIER: billing?.frontier ?? 0,
    };

    const allowance = allowanceFor(plan);

    return {
        ...FREE_ENTITLEMENT,
        plan,
        interval: plan === Plan.FREE ? null : (subscription?.interval ?? null),
        allowance,
        used,
        remaining: remainingOf(allowance, used),
        window,
        renewsAt: plan === Plan.FREE ? null : (subscription?.currentPeriodEnd ?? null),
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        freeAnswersUsed,
        freeAnswersRemaining: Math.max(0, FREE_ANSWERS_PER_DAY - freeAnswersUsed),
    };
};

export const remainingForTier = (entitlement: Entitlement, tier: ModelTier): number =>
    isPaidTier(tier) ? entitlement.remaining[tier] : entitlement.freeAnswersRemaining;

export const hourlyCallsFor = (plan: Plan): number => PLANS[plan].hourlyCalls;
