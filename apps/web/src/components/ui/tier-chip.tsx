import type { ModelTier } from "@/infrastructure/model-catalog";

const TIER_LABEL: Readonly<Record<ModelTier, string>> = {
    FREE: "Free",
    STANDARD: "Standard",
    ADVANCED: "Advanced",
    FRONTIER: "Frontier",
};

export const TierChip = ({ tier }: { readonly tier: ModelTier | null }) => (
    <span className="tier-chip" data-tier={tier ?? "none"}>
        {tier === null ? "Not in arena" : TIER_LABEL[tier]}
    </span>
);
