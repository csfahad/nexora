import { createServerFn } from "@tanstack/react-start";
import type { Entitlement } from "@/infrastructure/entitlement.server";
import type { BillingInterval, Plan, SubscriptionStatus } from "@/generated/prisma/enums";

export type BillingView = Readonly<{
    entitlement: Entitlement;
    subscription: Readonly<{
        plan: Plan;
        interval: BillingInterval;
        status: SubscriptionStatus;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        pastDueEndsAt: Date | null;
    }> | null;
}>;

export type BillingResult =
    | Readonly<{ status: "ready"; billing: BillingView }>
    | Readonly<{ status: "signed-out" }>
    | Readonly<{ status: "unavailable" }>;

export const getBilling = createServerFn({ method: "GET" }).handler(
    async (): Promise<BillingResult> => {
        const [
            { getRequest, setResponseHeader },
            { readSessionState },
            { database },
            { readEntitlement },
        ] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("@/infrastructure/session.server"),
            import("@/infrastructure/database"),
            import("@/infrastructure/entitlement.server"),
        ]);
        setResponseHeader("Cache-Control", "no-store");
        const session = await readSessionState(getRequest().headers);
        if (session.status === "signed-out") return { status: "signed-out" };
        if (session.status !== "signed-in") return { status: "unavailable" };
        try {
            const [entitlement, subscription] = await Promise.all([
                readEntitlement(session.user.id),
                database().subscription.findUnique({
                    where: { userId: session.user.id },
                    select: {
                        plan: true,
                        interval: true,
                        status: true,
                        currentPeriodEnd: true,
                        cancelAtPeriodEnd: true,
                        pastDueEndsAt: true,
                    },
                }),
            ]);
            return { status: "ready", billing: { entitlement, subscription } };
        } catch (error) {
            console.error("[billing] could not load billing:", error);
            return { status: "unavailable" };
        }
    },
);
