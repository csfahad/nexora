import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { IconAlertTriangle, IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
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

const statusLabel = ({ subscription: sub, entitlement }: BillingView): string => {
    if (!sub) return "Free";
    if (sub.status === "PAST_DUE") return "Payment overdue";
    if (sub.status === "ON_HOLD") return "On hold";
    if (sub.status === "FAILED") return "Payment failed";
    if (sub.status === "EXPIRED" || entitlement.plan === Plan.FREE) return "Ended";
    if (sub.cancelAtPeriodEnd || sub.status === "CANCELLED") return "Cancelled";
    return "Active";
};

const statusSentence = ({ subscription: sub, entitlement }: BillingView): string => {
    if (!sub) return "Free models are available. Choose a plan to compare paid models.";
    if (sub.status === "PAST_DUE")
        return sub.pastDueEndsAt && entitlement.plan !== Plan.FREE
            ? `Your payment is overdue. Paid access stays available until ${date(sub.pastDueEndsAt)}. Update your payment method in the portal.`
            : "Your payment is overdue and paid access has stopped. Update your payment method in the portal.";
    if (sub.status === "ON_HOLD")
        return "Paid access is on hold. Open the portal to check your payment method.";
    if (
        sub.status === "EXPIRED" ||
        sub.status === "FAILED" ||
        entitlement.plan === Plan.FREE
    )
        return "Your paid access has ended. Free models are still available.";
    if (sub.cancelAtPeriodEnd || sub.status === "CANCELLED")
        return `Your subscription is cancelled. Paid access lasts until ${date(sub.currentPeriodEnd)}.`;
    return "Your subscription is active. Manage payment details or change your plan in the portal.";
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
                    <h1 className="billing-title">Billing</h1>
                    <p className="billing-description">
                        Sign in to see your plan and manage billing.
                    </p>
                    <Link
                        to="/sign-in"
                        search={{ next: "/settings/billing" }}
                        className={buttonClasses({ variant: "primary" })}
                    >
                        Sign in
                    </Link>
                </div>
            </BillingFrame>
        );
    const { billing } = result;
    const { entitlement: access, subscription } = billing;
    const paid = access.plan !== Plan.FREE;
    const attention =
        subscription !== null &&
        ["PAST_DUE", "ON_HOLD", "FAILED"].includes(subscription.status);
    return (
        <BillingFrame>
            <div className="billing-content">
                <header className="billing-header">
                    <h1 className="billing-title">Billing</h1>
                    <p className="billing-description">
                        Manage your plan and keep track of your answer allowance.
                    </p>
                </header>
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
                    <div className="billing-plan-head">
                        <div>
                            <h2 id="current-plan-heading" className="billing-plan-name">
                                {PLANS[access.plan].name} plan
                            </h2>
                            <p className="billing-description">
                                {paid
                                    ? `Billed ${access.interval === "ANNUAL" ? "annually" : "monthly"}`
                                    : "No subscription required"}
                            </p>
                        </div>
                        <span className="billing-status" data-attention={attention}>
                            {attention && (
                                <IconAlertTriangle
                                    aria-hidden
                                    className="size-3.5"
                                    stroke={1.75}
                                />
                            )}
                            {statusLabel(billing)}
                        </span>
                    </div>
                    <p className="billing-description">{statusSentence(billing)}</p>
                    {subscription && !paid && (
                        <p className="text-muted-foreground text-sm">
                            Subscription: {PLANS[subscription.plan].name} ·{" "}
                            {subscription.interval === "ANNUAL" ? "Annual" : "Monthly"}
                        </p>
                    )}
                    <div className="billing-actions">
                        <Link
                            to="/plans"
                            className={buttonClasses({
                                variant: subscription ? "outline" : "primary",
                            })}
                        >
                            Compare plans
                        </Link>
                        {subscription && (
                            <Button
                                variant="primary"
                                loading={portal.opening}
                                onClick={() => void portal.openPortal()}
                            >
                                Open billing portal
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
                                    {access.cancelAtPeriodEnd &&
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
                                    {access.cancelAtPeriodEnd
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
