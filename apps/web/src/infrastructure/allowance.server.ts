import { ModelTier, UsageScope } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { database } from "@/infrastructure/database";
import { allowanceWindow, dailyWindow } from "@/infrastructure/billing-window";
import type { Window } from "@/infrastructure/billing-window";
import { FREE_ANSWERS_PER_DAY, isPaidTier } from "@/infrastructure/plans";
import type { Allowance } from "@/infrastructure/plans";
import { RESPONSE_FAILURE } from "@/infrastructure/response-failure";

const COLUMN = {
    [ModelTier.FREE]: "freeAnswers",
    [ModelTier.STANDARD]: "standard",
    [ModelTier.ADVANCED]: "advanced",
    [ModelTier.FRONTIER]: "frontier",
} as const;

type Column = (typeof COLUMN)[keyof typeof COLUMN];

export type Charge = Readonly<{
    scope: UsageScope;
    periodStart: Date;
    column: Column;
}>;

export const chargeFor = (
    tier: ModelTier,
    billing: Window | null,
    now: Date,
): Charge | null => {
    if (!isPaidTier(tier)) {
        return {
            scope: UsageScope.DAILY,
            periodStart: dailyWindow(now).start,
            column: COLUMN[ModelTier.FREE],
        };
    }

    if (billing === null) return null;

    return {
        scope: UsageScope.BILLING,
        periodStart: billing.start,
        column: COLUMN[tier],
    };
};

export const chargeAt = (
    tier: ModelTier,
    subscription: Readonly<{ currentPeriodStart: Date; currentPeriodEnd: Date }> | null,
    reservedAt: Date,
): Charge | null =>
    chargeFor(
        tier,
        subscription === null
            ? null
            : allowanceWindow(
                  subscription.currentPeriodStart,
                  subscription.currentPeriodEnd,
                  reservedAt,
              ),
        reservedAt,
    );

export const limitFor = (tier: ModelTier, allowance: Allowance): number =>
    isPaidTier(tier) ? allowance[tier] : FREE_ANSWERS_PER_DAY;

type Tx = Prisma.TransactionClient;

const ensureRow = async (
    tx: Tx,
    userId: string,
    charge: Charge,
    window: Window,
): Promise<void> => {
    await tx.usagePeriod.createMany({
        data: [
            {
                userId,
                scope: charge.scope,
                periodStart: window.start,
                periodEnd: window.end,
            },
        ],
        skipDuplicates: true,
    });
};

export const reserveOne = async (
    tx: Tx,
    input: Readonly<{
        userId: string;
        charge: Charge;
        window: Window;
        limit: number;
    }>,
): Promise<boolean> => {
    if (input.limit <= 0) return false;

    await ensureRow(tx, input.userId, input.charge, input.window);

    const { count } = await tx.usagePeriod.updateMany({
        where: {
            userId: input.userId,
            scope: input.charge.scope,
            periodStart: input.charge.periodStart,
            [input.charge.column]: { lte: input.limit - 1 },
        },
        data: { [input.charge.column]: { increment: 1 } },
    });

    return count === 1;
};

export const settleCharge = async (
    tx: Tx,
    input: Readonly<{
        userId: string;
        charge: Charge;
        refund: boolean;
        costUsd: number;
    }>,
): Promise<void> => {
    const where = {
        userId: input.userId,
        scope: input.charge.scope,
        periodStart: input.charge.periodStart,
    };

    if (input.costUsd > 0) {
        await tx.usagePeriod.updateMany({
            where,
            data: { spentUsd: { increment: input.costUsd } },
        });
    }

    if (!input.refund) return;

    await tx.usagePeriod.updateMany({
        where: { ...where, [input.charge.column]: { gt: 0 } },
        data: { [input.charge.column]: { decrement: 1 } },
    });
};

export const earnsRefund = (failure: string | null): boolean =>
    failure === RESPONSE_FAILURE.PROVIDER ||
    failure === RESPONSE_FAILURE.MODEL_UNAVAILABLE ||
    failure === RESPONSE_FAILURE.FREE_TIER_EXHAUSTED;

export const chargeForReservation = async (
    input: Readonly<{ userId: string; tier: ModelTier; reservedAt: Date }>,
): Promise<Charge | null> => {
    if (!isPaidTier(input.tier)) return chargeAt(input.tier, null, input.reservedAt);

    const subscription = await database().subscription.findUnique({
        where: { userId: input.userId },
        select: { currentPeriodStart: true, currentPeriodEnd: true },
    });

    return chargeAt(input.tier, subscription, input.reservedAt);
};
