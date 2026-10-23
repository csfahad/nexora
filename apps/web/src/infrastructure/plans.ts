import { ModelTier, Plan } from "@/generated/prisma/enums";
import type { BillingInterval } from "@/generated/prisma/enums";

export const TIER_CEILING_USD: Readonly<Record<PaidTier, number>> = {
    STANDARD: 0.0025,
    ADVANCED: 0.015,
    FRONTIER: 0.05,
};

export type PaidTier = "STANDARD" | "ADVANCED" | "FRONTIER";

export const PAID_TIERS: readonly PaidTier[] = ["STANDARD", "ADVANCED", "FRONTIER"];

export const isPaidTier = (tier: ModelTier): tier is PaidTier => tier !== ModelTier.FREE;

export type Allowance = Readonly<Record<PaidTier, number>>;

const NO_ALLOWANCE: Allowance = { STANDARD: 0, ADVANCED: 0, FRONTIER: 0 };

export type PlanSpec = Readonly<{
    plan: Plan;
    name: string;
    monthlyUsd: number;
    annualUsd: number;
    allowance: Allowance;
    hourlyCalls: number;
}>;

export const PLANS: Readonly<Record<Plan, PlanSpec>> = {
    [Plan.FREE]: {
        plan: Plan.FREE,
        name: "Free",
        monthlyUsd: 0,
        annualUsd: 0,
        allowance: NO_ALLOWANCE,
        hourlyCalls: 30,
    },
    [Plan.PRO]: {
        plan: Plan.PRO,
        name: "Pro",
        monthlyUsd: 20,
        annualUsd: 200,
        allowance: { STANDARD: 1_200, ADVANCED: 200, FRONTIER: 40 },
        hourlyCalls: 120,
    },
    [Plan.PRO_PLUS]: {
        plan: Plan.PRO_PLUS,
        name: "Pro+",
        monthlyUsd: 50,
        annualUsd: 500,
        allowance: { STANDARD: 3_000, ADVANCED: 600, FRONTIER: 90 },
        hourlyCalls: 300,
    },
    [Plan.MAX]: {
        plan: Plan.MAX,
        name: "Max",
        monthlyUsd: 100,
        annualUsd: 1_000,
        allowance: { STANDARD: 6_000, ADVANCED: 1_200, FRONTIER: 200 },
        hourlyCalls: 600,
    },
};

export const PAID_PLANS: readonly PlanSpec[] = [
    PLANS[Plan.PRO],
    PLANS[Plan.PRO_PLUS],
    PLANS[Plan.MAX],
];

export const FREE_ANSWERS_PER_DAY = 60;

export type PaidPlan = Exclude<Plan, "FREE">;

export const DODO_PRODUCT_VARIABLES = {
    PRO: { MONTHLY: "DODO_PRODUCT_PRO", ANNUAL: "DODO_PRODUCT_PRO_ANNUAL" },
    PRO_PLUS: {
        MONTHLY: "DODO_PRODUCT_PRO_PLUS",
        ANNUAL: "DODO_PRODUCT_PRO_PLUS_ANNUAL",
    },
    MAX: { MONTHLY: "DODO_PRODUCT_MAX", ANNUAL: "DODO_PRODUCT_MAX_ANNUAL" },
} as const satisfies Readonly<
    Record<PaidPlan, Readonly<Record<BillingInterval, string>>>
>;

export const checkoutSlug = (plan: PaidPlan, interval: BillingInterval): string =>
    `${plan.toLowerCase()}-${interval.toLowerCase()}`;

export const allowanceFor = (plan: Plan): Allowance => PLANS[plan].allowance;

export const annualSavingUsd = (spec: PlanSpec): number =>
    spec.monthlyUsd * 12 - spec.annualUsd;

export const priceFor = (spec: PlanSpec, interval: BillingInterval): number =>
    interval === "ANNUAL" ? spec.annualUsd : spec.monthlyUsd;

export const DODO_PERCENT_FEE = 0.06;
export const DODO_FLAT_FEE_USD = 0.4;
export const OPENROUTER_CREDIT_FEE = 1.055;

const MONTHS_PER_TERM: Readonly<Record<BillingInterval, number>> = {
    MONTHLY: 1,
    ANNUAL: 12,
};

export type WorstCase = Readonly<{
    priceUsd: number;
    months: number;
    monthlyListUsd: number;
    inferenceUsd: number;
    dodoFeeUsd: number;
    netRevenueUsd: number;
    contributionUsd: number;
    grossMarginPercent: number;
}>;

export const worstCaseFor = (spec: PlanSpec, interval: BillingInterval): WorstCase => {
    const months = MONTHS_PER_TERM[interval];
    const priceUsd = priceFor(spec, interval);

    const monthlyListUsd = PAID_TIERS.reduce(
        (total, tier) => total + spec.allowance[tier] * TIER_CEILING_USD[tier],
        0,
    );

    const inferenceUsd = monthlyListUsd * months * OPENROUTER_CREDIT_FEE;
    const dodoFeeUsd =
        priceUsd === 0 ? 0 : priceUsd * DODO_PERCENT_FEE + DODO_FLAT_FEE_USD;
    const netRevenueUsd = priceUsd - dodoFeeUsd;
    const contributionUsd = netRevenueUsd - inferenceUsd;

    return {
        priceUsd,
        months,
        monthlyListUsd,
        inferenceUsd,
        dodoFeeUsd,
        netRevenueUsd,
        contributionUsd,
        grossMarginPercent:
            netRevenueUsd <= 0 ? 0 : (contributionUsd / netRevenueUsd) * 100,
    };
};

export const CEILING_LADDER: readonly Readonly<{ tier: PaidTier; usd: number }>[] =
    PAID_TIERS.map((tier) => ({ tier, usd: TIER_CEILING_USD[tier] }));
