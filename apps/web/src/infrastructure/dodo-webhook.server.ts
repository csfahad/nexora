import { AsyncLocalStorage } from "node:async_hooks";
import "@tanstack/react-start/server-only";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { SubscriptionStatus } from "@/generated/prisma/enums";
import { database } from "@/infrastructure/database";
import { serverEnv } from "@/infrastructure/env";
import { dodoProducts } from "@/infrastructure/dodo-products.server";

export const dodoDelivery = new AsyncLocalStorage<
    Readonly<{ id: string; body: string }>
>();

const STATUS = {
    active: SubscriptionStatus.ACTIVE,
    past_due: SubscriptionStatus.PAST_DUE,
    on_hold: SubscriptionStatus.ON_HOLD,
    paused: SubscriptionStatus.ON_HOLD,
    cancelled: SubscriptionStatus.CANCELLED,
    expired: SubscriptionStatus.EXPIRED,
    failed: SubscriptionStatus.FAILED,
} as const;

const EVENTS = new Set([
    "subscription.active",
    "subscription.renewed",
    "subscription.plan_changed",
    "subscription.past_due",
    "subscription.on_hold",
    "subscription.cancelled",
    "subscription.expired",
    "subscription.failed",
    "subscription.updated",
    "subscription.paused",
    "subscription.unpaused",
]);

const payloadSchema = z.object({
    type: z.string(),
    timestamp: z.coerce.date(),
    data: z.object({
        subscription_id: z.string().min(1),
        product_id: z.string().min(1),
        status: z.enum([
            "active",
            "past_due",
            "on_hold",
            "paused",
            "cancelled",
            "expired",
            "failed",
        ]),
        customer: z.object({ customer_id: z.string().min(1), email: z.email() }),
        previous_billing_date: z.coerce.date(),
        next_billing_date: z.coerce.date(),
        cancel_at_next_billing_date: z.boolean(),
        past_due_ends_at: z.coerce.date().nullish(),
    }),
});

/** Called only after signature verification, with the original signed body. */
export const applyDodoWebhook = async (
    delivery: Readonly<{ id: string; body: string }>,
): Promise<void> => {
    const raw: unknown = JSON.parse(delivery.body);
    const envelope = z.object({ type: z.string() }).parse(raw);
    if (!EVENTS.has(envelope.type)) return;
    if (!delivery.id) throw new Error("Missing webhook-id");
    const event = payloadSchema.parse(raw);
    const data = event.data;
    const product = dodoProducts(serverEnv()).find(
        (item) => item.productId === data.product_id,
    );
    if (!product) throw new Error("Subscription product is not configured");
    if (data.next_billing_date <= data.previous_billing_date)
        throw new Error("Invalid subscription period");

    const commit = () =>
        database().$transaction(
            async (tx) => {
                if (await tx.webhookEvent.findUnique({ where: { id: delivery.id } }))
                    return;
                const linked = await tx.user.findUnique({
                    where: { dodoCustomerId: data.customer.customer_id },
                    select: { id: true },
                });
                const user =
                    linked ??
                    (await tx.user.findFirst({
                        where: {
                            email: data.customer.email,
                            emailVerified: true,
                            dodoCustomerId: null,
                        },
                        select: { id: true },
                    }));
                if (!user)
                    throw new Error("No verified account matches the Dodo customer");

                const previous = await tx.subscription.findUnique({
                    where: { userId: user.id },
                });
                const newer =
                    previous === null ||
                    (previous.lastEventAt ?? previous.updatedAt) < event.timestamp;
                const sameSubscription =
                    previous?.dodoSubscriptionId === data.subscription_id;
                const terminal =
                    sameSubscription && previous.status === SubscriptionStatus.EXPIRED;
                // A different subscription cannot silently replace a still-paid term.
                const replaceable =
                    previous === null ||
                    sameSubscription ||
                    previous.currentPeriodEnd <= event.timestamp ||
                    previous.status === SubscriptionStatus.EXPIRED ||
                    previous.status === SubscriptionStatus.FAILED;

                if (newer && !terminal && replaceable) {
                    const intervalChanged =
                        previous !== null && previous.interval !== product.interval;
                    const keepBounds =
                        sameSubscription &&
                        !intervalChanged &&
                        event.type !== "subscription.renewed" &&
                        event.type !== "subscription.active";
                    const state = {
                        plan: product.plan,
                        interval: product.interval,
                        status: STATUS[data.status],
                        dodoSubscriptionId: data.subscription_id,
                        currentPeriodStart: keepBounds
                            ? previous.currentPeriodStart
                            : data.previous_billing_date,
                        currentPeriodEnd: keepBounds
                            ? previous.currentPeriodEnd
                            : data.next_billing_date,
                        cancelAtPeriodEnd:
                            data.cancel_at_next_billing_date ||
                            data.status === "cancelled",
                        pastDueEndsAt: data.past_due_ends_at ?? null,
                        lastEventAt: event.timestamp,
                    };
                    await tx.user.update({
                        where: { id: user.id },
                        data: { dodoCustomerId: data.customer.customer_id },
                    });
                    await tx.subscription.upsert({
                        where: { userId: user.id },
                        create: { userId: user.id, ...state },
                        update: state,
                    });
                }
                // Same transaction: a failed write leaves no receipt, and can be retried.
                await tx.webhookEvent.create({
                    data: {
                        id: delivery.id,
                        type: event.type,
                        eventAt: event.timestamp,
                        dodoSubscriptionId: data.subscription_id,
                    },
                });
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            await commit();
            return;
        } catch (error) {
            const retryable =
                error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === "P2034" || error.code === "P2002");
            if (!retryable || attempt === 2) throw error;
        }
    }
};

export const onDodoPayload = async (): Promise<void> => {
    const delivery = dodoDelivery.getStore();
    if (!delivery) throw new Error("Webhook request context is missing");
    await applyDodoWebhook(delivery);
};
