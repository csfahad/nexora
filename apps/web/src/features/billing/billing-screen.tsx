import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { IconExternalLink, IconRefresh } from "@tabler/icons-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import { TierChip } from "@/components/ui/tier-chip";
import { Plan } from "@/generated/prisma/enums";
import { FREE_ANSWERS_PER_DAY, PAID_TIERS, PLANS } from "@/infrastructure/plans";
import { useBillingPortal } from "@/infrastructure/use-billing-portal";
import type { BillingResult, BillingView } from "./get-billing";

const date = (value: Date): string =>
    new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
    }).format(value) + " UTC";
const count = (value: number): string => value.toLocaleString("en-US");

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
            <LoaderErrorNotice message="Your billing details couldn't load. Try again." />
        );
    if (result.status === "signed-out")
        return (
            <div className="billing-content">
                <h1 className="billing-title">Billing</h1>
                <p>Sign in to see your plan and manage billing.</p>
                <Link
                    to="/sign-in"
                    search={{ next: "/settings/billing" }}
                    className={buttonClasses({ variant: "primary" })}
                >
                    Sign in
                </Link>
            </div>
        );
    const { billing } = result;
    const { entitlement: access, subscription } = billing;
    const paid = access.plan !== Plan.FREE;
    return (
        <div className="screen screen-scroll">
            <div className="billing-content">
                <h1 className="billing-title">Billing</h1>
                {returned && (
                    <div className="billing-section" role="status">
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
                <section
                    className="billing-section"
                    aria-labelledby="current-plan-heading"
                >
                    <h2 id="current-plan-heading" className="billing-heading">
                        {PLANS[access.plan].name}
                        {paid &&
                            ` · ${access.interval === "ANNUAL" ? "Annual" : "Monthly"}`}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        {statusSentence(billing)}
                    </p>
                    {subscription && !paid && (
                        <p className="text-muted-foreground text-sm">
                            Subscription: {PLANS[subscription.plan].name} ·{" "}
                            {subscription.interval === "ANNUAL" ? "Annual" : "Monthly"}
                        </p>
                    )}
                    <div className="billing-actions">
                        <Link
                            to="/plans"
                            className={buttonClasses({ variant: "outline", size: "sm" })}
                        >
                            Compare plans
                        </Link>
                        {subscription && (
                            <Button
                                variant="primary"
                                size="sm"
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
                </section>
                <section className="billing-section" aria-labelledby="usage-heading">
                    <h2 id="usage-heading" className="billing-heading">
                        Answers this month
                    </h2>
                    <dl className="billing-readout">
                        {PAID_TIERS.map((tier) => (
                            <div className="billing-row" key={tier}>
                                <dt>
                                    <TierChip tier={tier} />
                                </dt>
                                <dd className="numeric">
                                    {count(access.used[tier])} /{" "}
                                    {count(access.allowance[tier])} used
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <p className="text-muted-foreground text-sm">
                        {count(access.freeAnswersUsed)} / {count(FREE_ANSWERS_PER_DAY)}{" "}
                        free answers used today. Resets at midnight UTC.
                    </p>
                </section>
                {paid && access.window && subscription && (
                    <section className="billing-section" aria-labelledby="dates-heading">
                        <h2 id="dates-heading" className="billing-heading">
                            Upcoming dates
                        </h2>
                        <dl className="billing-readout">
                            <div className="billing-row">
                                <dt>
                                    {access.cancelAtPeriodEnd &&
                                    access.window.end.getTime() >=
                                        subscription.currentPeriodEnd.getTime()
                                        ? "Allowance ends"
                                        : "Allowance refills"}
                                </dt>
                                <dd>{date(access.window.end)}</dd>
                            </div>
                            <div className="billing-row">
                                <dt>
                                    {access.cancelAtPeriodEnd
                                        ? "Paid access ends"
                                        : subscription.status === "PAST_DUE"
                                          ? "Last renewal due"
                                          : "Subscription renews"}
                                </dt>
                                <dd>{date(subscription.currentPeriodEnd)}</dd>
                            </div>
                        </dl>
                    </section>
                )}
            </div>
        </div>
    );
};
