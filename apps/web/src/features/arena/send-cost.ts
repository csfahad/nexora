import { ModelTier } from "@/generated/prisma/enums";
import { TIER_WORD, planAllows, remainingFor } from "@/infrastructure/entitlement";
import type { AllowanceView } from "@/infrastructure/entitlement";
import { isPaidTier } from "@/infrastructure/plans";
import type { PaidTier } from "@/infrastructure/plans";
import type { CatalogModel } from "@/infrastructure/model-catalog";

const DEARNESS: readonly ModelTier[] = [
    ModelTier.FREE,
    ModelTier.STANDARD,
    ModelTier.ADVANCED,
    ModelTier.FRONTIER,
];

const tierOf = (model: CatalogModel): ModelTier => model.tier ?? ModelTier.FREE;

const paidWord = (tier: PaidTier): string => TIER_WORD[tier];

const wordFor = (tier: ModelTier): string =>
    tier === ModelTier.FREE ? "free" : TIER_WORD[tier];

export const blockedReason = (
    view: AllowanceView,
    model: CatalogModel,
): string | null => {
    const tier = tierOf(model);

    if (!view.metered) return null;

    if (isPaidTier(tier)) {
        if (!planAllows(view, tier)) return `${paidWord(tier)} models need a paid plan.`;

        if (remainingFor(view, tier) <= 0)
            return `No ${paidWord(tier)} answers left this month.`;

        return null;
    }

    if (remainingFor(view, tier) <= 0) return "No free answers left today.";

    return null;
};

export const canSend = (view: AllowanceView, model: CatalogModel): boolean =>
    blockedReason(view, model) === null;

export const sendLabel = (
    view: AllowanceView,
    selected: readonly CatalogModel[],
): string => {
    const base = `${selected.length} ${selected.length === 1 ? "model" : "models"}`;

    if (!view.metered || selected.length === 0) return base;

    const paid = selected.filter((model) => isPaidTier(tierOf(model))).length;
    const withPaid = paid > 0 ? `${base} · ${paid} paid` : base;

    const emptied = DEARNESS.filter((tier) => {
        const wanted = selected.filter((model) => tierOf(model) === tier).length;
        if (wanted === 0) return false;

        const left = remainingFor(view, tier);

        return left > 0 && wanted >= left;
    });

    const scarcest = emptied.at(-1);

    if (scarcest === undefined) return withPaid;

    const left = remainingFor(view, scarcest);

    return `${withPaid} · ${left === 1 ? "last" : `last ${left}`} ${wordFor(scarcest)}`;
};
