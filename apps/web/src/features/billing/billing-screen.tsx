import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
    IconAlertTriangle,
    IconExternalLink,
    IconRefresh,
    IconUser,
} from "@tabler/icons-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { TierChip } from "@/components/ui/tier-chip";
import { Plan } from "@/generated/prisma/enums";
import { FREE_ANSWERS_PER_DAY, PAID_TIERS, PLANS } from "@/infrastructure/plans";
import { useBillingPortal } from "@/infrastructure/use-billing-portal";
import { AllowanceMeter } from "./allowance-meter";
import { BillingFrame } from "./billing-frame";
import type { BillingResult, BillingView } from "./get-billing";

const date = (value: Date): string =>
    new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(value) + " UTC";

const calendarDate = (value: Date): string =>
    new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    }).format(value);

const renewalCancelled = (subscription: NonNullable<BillingView["subscription"]>) =>
    subscription.cancelAtPeriodEnd || subscription.status === "CANCELLED";

const FREE_ACCESS_DESCRIPTION =
    "Free models remain available within your daily allowance.";

const statusLabel = ({ subscription: sub, entitlement }: BillingView): string => {
    if (!sub) return "Free";
    if (sub.status === "PAST_DUE") return "Payment overdue";
    if (sub.status === "ON_HOLD") return "On hold";
    if (sub.status === "FAILED") return "Payment failed";
    if (sub.status === "EXPIRED" || entitlement.plan === Plan.FREE) return "Ended";
    if (renewalCancelled(sub)) return "Renewal cancelled";
    return "Active";
};

type StatusTone = "current" | "warning" | "danger";

const subscriptionTone = (
    subscription: NonNullable<BillingView["subscription"]>,
): StatusTone => {
    if (subscription.status === "FAILED") return "danger";
    if (
        ["PAST_DUE", "ON_HOLD", "EXPIRED"].includes(subscription.status) ||
        renewalCancelled(subscription)
    )
        return "warning";
    return "current";
};

const BillingStatus = ({
    label,
    tone,
}: Readonly<{ label: string; tone: StatusTone }>) => (
    <span className="billing-status" data-tone={tone}>
        {tone === "danger" ? (
            <IconAlertTriangle aria-hidden className="size-3" stroke={1.75} />
        ) : (
            <span aria-hidden className="billing-status-dot" />
        )}
        {label}
    </span>
);

const statusSentence = ({ subscription: sub, entitlement }: BillingView): string => {
    if (!sub) return FREE_ACCESS_DESCRIPTION;
    if (sub.status === "PAST_DUE")
        return sub.pastDueEndsAt && entitlement.plan !== Plan.FREE
            ? `Your payment is overdue. Paid access stays available until ${date(sub.pastDueEndsAt)}. Update your payment method in the portal.`
            : "Your payment is overdue and paid access has stopped. Update your payment method in the portal.";
    if (sub.status === "ON_HOLD")
        return "Paid access is on hold. Open the portal to check your payment method.";
    if (sub.status === "FAILED")
        return "Your payment failed and paid access has stopped. Update your payment method in the portal.";
    if (sub.status === "EXPIRED" || entitlement.plan === Plan.FREE)
        return FREE_ACCESS_DESCRIPTION;
    if (renewalCancelled(sub))
        return `Renewal cancelled · Paid access ends on ${calendarDate(sub.currentPeriodEnd)}.`;
    return `Renews on ${calendarDate(sub.currentPeriodEnd)}.`;
};

export const BillingScreen = ({
    result,
    returned,
}: {
    readonly result: BillingResult;
    readonly returned: boolean;
}) => {
    const router = useRouter();
    const portal = useBillingPortal();
    // A bounded refresh after checkout; the query parameter never grants access.
    useEffect(() => {
        if (!returned) return;
        const timer = window.setTimeout(() => void router.invalidate(), 2500);
        return () => window.clearTimeout(timer);
    }, [returned, router]);

    if (result.status === "unavailable")
        return (
            <BillingFrame>
                <LoaderErrorNotice message="Your billing details couldn't load. Try again." />
            </BillingFrame>
        );
    if (result.status === "signed-out")
        return (
            <BillingFrame>
                <div className="billing-content">
                    <PageHeading
                        title="Your plan, at a glance."
                        description="Track your answer allowance and manage your subscription."
                    />
                    <EmptyState
                        icon={IconUser}
                        title="Sign in to manage billing"
                        description="Your plan, payment details, and answer allowance are linked to your account."
                    >
                        <Link
                            to="/sign-in"
                            search={{ next: "/settings/billing" }}
                            className={buttonClasses({
                                variant: "primary",
                                class: "mt-5",
                            })}
                        >
                            Sign in
                        </Link>
                    </EmptyState>
                </div>
            </BillingFrame>
        );
    const { billing } = result;
    const { entitlement: access, subscription } = billing;
    const paid = access.plan !== Plan.FREE;
    const attention =
        subscription !== null &&
        ["PAST_DUE", "ON_HOLD", "FAILED"].includes(subscription.status);
    const previousSubscription = subscription !== null && !paid && !attention;
    return (
        <BillingFrame>
            <div className="billing-content">
                <PageHeading
                    title="Your plan, at a glance."
                    description="Manage your subscription and see exactly how many answers you have left."
                />
                {returned && (
                    <div className="billing-return" role="status">
                        <p>
                            Back from checkout. Your plan updates when the payment is
                            confirmed.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void router.invalidate()}
                        >
                            <IconRefresh aria-hidden />
                            Refresh billing
                        </Button>
                    </div>
                )}
                <section className="billing-plan" aria-labelledby="current-plan-heading">
                    <div className="billing-plan-summary">
                        <div className="billing-plan-head">
                            <h2 id="current-plan-heading" className="billing-plan-name">
                                {PLANS[access.plan].name} plan
                            </h2>
                            <BillingStatus
                                label={paid ? statusLabel(billing) : "Current"}
                                tone={
                                    paid && subscription
                                        ? subscriptionTone(subscription)
                                        : "current"
                                }
                            />
                        </div>
                        {paid && (
                            <p className="billing-description">
                                Billed{" "}
                                {access.interval === "ANNUAL" ? "annually" : "monthly"}
                            </p>
                        )}
                        <p className="billing-description">
                            {!paid && attention
                                ? FREE_ACCESS_DESCRIPTION
                                : statusSentence(billing)}
                        </p>
                    </div>
                    {subscription && !paid && (
                        <section
                            className="billing-subscription"
                            aria-labelledby="subscription-record-heading"
                        >
                            <div className="billing-subscription-head">
                                <h3
                                    id="subscription-record-heading"
                                    className="billing-subscription-name"
                                >
                                    {PLANS[subscription.plan].name} ·{" "}
                                    {subscription.interval === "ANNUAL"
                                        ? "Annual"
                                        : "Monthly"}
                                </h3>
                                <BillingStatus
                                    label={
                                        previousSubscription
                                            ? "Ended"
                                            : statusLabel(billing)
                                    }
                                    tone={
                                        previousSubscription
                                            ? "warning"
                                            : subscriptionTone(subscription)
                                    }
                                />
                            </div>
                            {previousSubscription ? (
                                <>
                                    <p className="billing-description">
                                        Paid access ended on{" "}
                                        <time
                                            dateTime={subscription.currentPeriodEnd.toISOString()}
                                            title={date(subscription.currentPeriodEnd)}
                                        >
                                            {calendarDate(subscription.currentPeriodEnd)}
                                        </time>
                                        .
                                    </p>
                                    {renewalCancelled(subscription) && (
                                        <p className="billing-description">
                                            Renewal cancelled.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="billing-description" role="alert">
                                    {statusSentence(billing)}
                                </p>
                            )}
                        </section>
                    )}
                    <div className="billing-actions">
                        <Link
                            to="/plans"
                            className={buttonClasses({
                                variant: paid || attention ? "outline" : "primary",
                            })}
                        >
                            View plans
                        </Link>
                        {subscription && (
                            <Button
                                variant={paid || attention ? "primary" : "outline"}
                                loading={portal.opening}
                                onClick={() => void portal.openPortal()}
                            >
                                Billing portal
                                <IconExternalLink aria-hidden />
                            </Button>
                        )}
                    </div>
                    {portal.error && (
                        <p role="alert" className="text-destructive text-sm">
                            {portal.error}
                        </p>
                    )}
                    {paid && access.window && subscription && (
                        <dl className="billing-dates">
                            <div>
                                <dt>
                                    {renewalCancelled(subscription) &&
                                    access.window.end.getTime() >=
                                        subscription.currentPeriodEnd.getTime()
                                        ? "Allowance ends"
                                        : "Allowance refills"}
                                </dt>
                                <dd>
                                    <time dateTime={access.window.end.toISOString()}>
                                        {date(access.window.end)}
                                    </time>
                                </dd>
                            </div>
                            <div>
                                <dt>
                                    {renewalCancelled(subscription)
                                        ? "Paid access ends"
                                        : subscription.status === "PAST_DUE"
                                          ? "Last renewal due"
                                          : "Subscription renews"}
                                </dt>
                                <dd>
                                    <time
                                        dateTime={subscription.currentPeriodEnd.toISOString()}
                                    >
                                        {date(subscription.currentPeriodEnd)}
                                    </time>
                                </dd>
                            </div>
                        </dl>
                    )}
                </section>
                <section className="billing-section" aria-labelledby="usage-heading">
                    <div className="billing-section-head">
                        <h2 id="usage-heading" className="billing-heading">
                            Answer allowance
                        </h2>
                        <p className="billing-description">
                            {paid
                                ? "Paid answers refill monthly, including on annual plans."
                                : "Your free answers reset every day."}
                        </p>
                    </div>
                    {paid && (
                        <div className="billing-allowances">
                            {PAID_TIERS.map((tier) => (
                                <AllowanceMeter
                                    key={tier}
                                    label={<TierChip tier={tier} />}
                                    name={tier.charAt(0) + tier.slice(1).toLowerCase()}
                                    remaining={access.remaining[tier]}
                                    total={access.allowance[tier]}
                                    used={access.used[tier]}
                                />
                            ))}
                        </div>
                    )}
                    <div className="billing-daily" data-paid={paid}>
                        <div>
                            <h3 className="billing-heading">Free answers today</h3>
                            <p className="billing-description">Resets at midnight UTC.</p>
                            {paid && (
                                <p className="billing-description">
                                    Separate from your paid allowance.
                                </p>
                            )}
                        </div>
                        <AllowanceMeter
                            label={<span className="sr-only">Free answers today</span>}
                            name="Free"
                            remaining={access.freeAnswersRemaining}
                            total={FREE_ANSWERS_PER_DAY}
                            used={access.freeAnswersUsed}
                        />
                    </div>
                    <p className="billing-description">
                        Each model’s answer uses one answer from its tier.
                    </p>
                </section>
            </div>
        </BillingFrame>
    );
};
