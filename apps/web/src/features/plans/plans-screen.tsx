import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { IconArrowRight, IconCheck, IconX } from "@tabler/icons-react";
import { Plan } from "@/generated/prisma/enums";
import type { BillingInterval } from "@/generated/prisma/enums";
import { StandaloneHeader } from "@/components/ui/standalone-header";
import { TierChip } from "@/components/ui/tier-chip";
import { ViewToggle } from "@/components/ui/view-toggle";
import { TIER_WORD, useAllowance } from "@/infrastructure/entitlement";
import {
    CEILING_LADDER,
    FREE_ANSWERS_PER_DAY,
    PAID_PLANS,
    PAID_TIERS,
    PLANS,
    annualSavingUsd,
    priceFor,
    checkoutSlug,
} from "@/infrastructure/plans";
import type { PlanSpec } from "@/infrastructure/plans";
import { authClient } from "@/infrastructure/auth-client";
import { useSessionState } from "@/infrastructure/session";
import { useBillingPortal } from "@/infrastructure/use-billing-portal";

const INTERVALS: readonly Readonly<{ value: BillingInterval; label: string }>[] = [
    { value: "MONTHLY", label: "Monthly" },
    { value: "ANNUAL", label: "Annual" },
];

const FEATURED = Plan.PRO;

const TAGLINE: Readonly<Record<Plan, string>> = {
    [Plan.FREE]: "Try the arena on free models",
    [Plan.PRO]: "Every model, measured",
    [Plan.PRO_PLUS]: "For comparison work that runs daily",
    [Plan.MAX]: "For reading models all month",
};

const count = (value: number): string => value.toLocaleString("en-US");

const money = (value: number): string =>
    `$${value.toLocaleString("en-US", {
        minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
        maximumFractionDigits: 2,
    })}`;

const perAnswer = (value: number): string =>
    `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    })}`;

const roundedTotal = (value: number): string =>
    (Math.round(value / 100) * 100).toLocaleString("en-US");

const Feature = ({
    children,
    absent = false,
}: {
    readonly children: React.ReactNode;
    readonly absent?: boolean;
}) => (
    <li className="plan-feature" data-absent={absent || undefined}>
        {absent ? (
            <IconX aria-hidden stroke={2} />
        ) : (
            <IconCheck aria-hidden stroke={2.25} />
        )}
        <span>{children}</span>
    </li>
);

const PlanColumn = ({
    name,
    price,
    qualifier,
    tagline,
    cta,
    featured = false,
    current = false,
    busy = false,
    disabled = false,
    onChoose,
    children,
}: {
    readonly name: string;
    readonly price: string;
    readonly qualifier: string;
    readonly tagline: string;
    readonly cta: string;
    readonly featured?: boolean;
    readonly current?: boolean;
    readonly busy?: boolean;
    readonly disabled?: boolean;
    readonly onChoose: () => void;
    readonly children: React.ReactNode;
}) => (
    <article className="plan-col" data-featured={featured || undefined}>
        <div className="plan-band plan-band--head">
            <h2 className="plan-title">{name}</h2>
            <p className="plan-figure">
                {price} <span className="plan-qualifier">{qualifier}</span>
            </p>
            <p className="plan-tagline">{tagline}</p>
        </div>

        <div className="plan-band--cta">
            <button
                type="button"
                className="plan-cta"
                data-featured={featured || undefined}
                disabled={disabled || busy}
                aria-busy={busy || undefined}
                onClick={onChoose}
            >
                {busy
                    ? "Opening…"
                    : current
                      ? price === "$0"
                          ? "Start comparing"
                          : "Manage your plan"
                      : cta}
                <IconArrowRight aria-hidden stroke={2} />
            </button>
        </div>

        <div className="plan-band plan-band--included">
            <p className="label-meta plan-included-label">What&rsquo;s included</p>
            <ul className="plan-features">{children}</ul>
        </div>
    </article>
);

const PaidColumn = ({
    spec,
    interval,
    current,
    busy,
    disabled,
    onChoose,
}: {
    readonly spec: PlanSpec;
    readonly interval: BillingInterval;
    readonly current: boolean;
    readonly busy: boolean;
    readonly disabled: boolean;
    readonly onChoose: () => void;
}) => {
    const annual = interval === "ANNUAL";
    const saving = annualSavingUsd(spec);
    const total = PAID_TIERS.reduce((sum, tier) => sum + spec.allowance[tier], 0);

    return (
        <PlanColumn
            name={spec.name}
            price={money(priceFor(spec, interval))}
            qualifier={annual ? "/year" : "/month"}
            tagline={
                annual && saving > 0
                    ? `${TAGLINE[spec.plan]} · ${money(saving)} saved`
                    : TAGLINE[spec.plan]
            }
            cta={`Choose ${spec.name}`}
            featured={spec.plan === FEATURED}
            current={current}
            busy={busy}
            disabled={disabled}
            onChoose={onChoose}
        >
            <Feature>
                About <span className="numeric">{roundedTotal(total)}</span> answers a
                month
            </Feature>
            {PAID_TIERS.map((tier) => (
                <Feature key={tier}>
                    <span className="numeric">{count(spec.allowance[tier])}</span>{" "}
                    {TIER_WORD[tier]} answers
                </Feature>
            ))}
            <Feature>Every free model in the catalog</Feature>
            <Feature>
                <span className="numeric">{count(spec.hourlyCalls)}</span> answers an hour
            </Feature>
            <Feature>Real measured cost on every answer</Feature>
            <Feature>Allowance refills monthly</Feature>
        </PlanColumn>
    );
};

const FreeColumn = ({
    current,
    onChoose,
}: {
    readonly current: boolean;
    readonly onChoose: () => void;
}) => (
    <PlanColumn
        name={PLANS[Plan.FREE].name}
        price="$0"
        qualifier="/month"
        tagline={TAGLINE[Plan.FREE]}
        cta="Start free"
        current={current}
        onChoose={onChoose}
    >
        <Feature>
            <span className="numeric">{count(FREE_ANSWERS_PER_DAY)}</span> answers a day
        </Feature>
        <Feature>Every free model in the catalog</Feature>
        <Feature>
            <span className="numeric">{count(PLANS[Plan.FREE].hourlyCalls)}</span> answers
            an hour
        </Feature>
        <Feature>Real measured cost on every answer</Feature>
        {PAID_TIERS.map((tier) => (
            <Feature key={tier} absent>
                No {TIER_WORD[tier]} answers
            </Feature>
        ))}
    </PlanColumn>
);

export const PlansScreen = () => {
    const [interval, setInterval] = useState<BillingInterval>("MONTHLY");
    const view = useAllowance();
    const session = useSessionState();
    const router = useRouter();
    const portal = useBillingPortal();
    const [choosing, setChoosing] = useState<Plan | null>(null);
    const [error, setError] = useState<string | null>(null);
    const choose = async (plan: Plan) => {
        setError(null);
        if (session.status === "unavailable") {
            setError(
                "Your account couldn't be confirmed. Reload the page and try again.",
            );
            return;
        }
        if (session.status === "signed-out") {
            await router.navigate({
                to: "/sign-in",
                search: { next: plan === Plan.FREE ? "/" : "/plans" },
            });
            return;
        }
        if (view.plan !== Plan.FREE) {
            await portal.openPortal();
            return;
        }
        if (plan === Plan.FREE) {
            await router.navigate({ to: "/" });
            return;
        }
        setChoosing(plan);
        try {
            const result = await authClient.dodopayments.checkoutSession({
                slug: checkoutSlug(plan, interval),
            });
            if (result.error || !result.data.url) {
                setError(
                    "Checkout couldn't open. Try again, or manage an existing subscription in Billing.",
                );
                setChoosing(null);
                return;
            }
            window.location.assign(result.data.url);
        } catch (cause) {
            console.error("[billing] checkout failed:", cause);
            setError("Checkout couldn't open. Try again.");
            setChoosing(null);
        }
    };

    return (
        <div className="screen">
            <a href="#plans-main" className="skip-link">
                Skip to content
            </a>
            <StandaloneHeader title="Plans" />

            <main id="plans-main" tabIndex={-1} className="screen-scroll min-h-0 flex-1">
                <div className="plans-content">
                    <div className="plans-intro">
                        <h1>
                            More models.
                            <br />
                            More perspective.
                        </h1>
                        <p className="text-muted-foreground w-full max-w-[58ch] text-pretty">
                            Start with free models. Choose a paid plan for a monthly
                            allowance across every price tier, with real cost measured on
                            each answer.
                        </p>

                        <div className="mt-2 flex flex-col items-center gap-2">
                            <ViewToggle
                                mode="radio"
                                label="Billing interval"
                                options={INTERVALS}
                                value={interval}
                                onChange={setInterval}
                            />
                            <p className="text-muted-foreground text-sm">
                                Annual is two months free on every paid plan.
                            </p>
                        </div>
                    </div>

                    <div className="plan-panel">
                        <FreeColumn
                            current={view.metered && view.plan === Plan.FREE}
                            onChoose={() => void choose(Plan.FREE)}
                        />

                        {PAID_PLANS.map((spec) => (
                            <PaidColumn
                                key={spec.plan}
                                spec={spec}
                                interval={interval}
                                current={view.metered && view.plan === spec.plan}
                                busy={choosing === spec.plan || portal.opening}
                                disabled={choosing !== null}
                                onChoose={() => void choose(spec.plan)}
                            />
                        ))}
                    </div>

                    <p
                        className="text-muted-foreground mt-6 text-center text-sm"
                        role="note"
                    >
                        {error || portal.error ? (
                            <span role="alert">{error || portal.error}</span>
                        ) : (
                            "Annual plans bill once a year. Every paid plan refills its answer allowance monthly."
                        )}
                    </p>

                    {session.status === "signed-in" && (
                        <p className="mt-3 text-center text-sm">
                            <Link
                                to="/settings/billing"
                                search={{ checkout: undefined }}
                                className="text-primary underline underline-offset-2"
                            >
                                View billing and manage your subscription
                            </Link>
                        </p>
                    )}

                    <section
                        aria-labelledby="ceiling-heading"
                        className="mt-16 flex flex-col gap-4"
                    >
                        <h2 id="ceiling-heading" className="text-lg font-semibold">
                            What one answer costs at each tier&rsquo;s ceiling
                        </h2>

                        <ul className="tier-ceilings list-none">
                            {CEILING_LADDER.map(({ tier, usd }) => (
                                <li key={tier}>
                                    <TierChip tier={tier} />
                                    <span className="text-foreground numeric text-sm">
                                        {perAnswer(usd)}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="mt-1 grid gap-x-10 gap-y-3 lg:grid-cols-2">
                            <p className="text-muted-foreground text-pretty text-sm">
                                An allowance is priced against the dearest model its tier
                                can hold, so these are ceilings rather than averages. Most
                                models sit well under them.
                            </p>
                            <p className="text-muted-foreground text-pretty text-sm">
                                Every answer in the arena shows what it actually cost, to
                                four decimal places. A free answer reads $0.0000, because
                                that is the real measured number.
                            </p>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};
