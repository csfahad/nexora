import { auth } from "@/infrastructure/auth";
import { dodoClient } from "@/infrastructure/dodo.server";
import { applyDodoWebhook, dodoDelivery } from "@/infrastructure/dodo-webhook.server";

export const handleAuthRequest = async (request: Request): Promise<Response> => {
    if (
        request.method !== "POST" ||
        new URL(request.url).pathname !== "/api/auth/dodopayments/webhooks"
    ) {
        return auth().handler(request);
    }
    const delivery = {
        id: request.headers.get("webhook-id") ?? "",
        body: await request.clone().text(),
    };

    const payload: unknown = await Promise.resolve()
        .then(() => JSON.parse(delivery.body || "null"))
        .catch(() => null);
    const pastDue =
        typeof payload === "object" &&
        payload !== null &&
        "data" in payload &&
        typeof payload.data === "object" &&
        payload.data !== null &&
        "status" in payload.data &&
        payload.data.status === "past_due";
    if (pastDue) {
        try {
            await dodoClient().webhooks.unwrap(delivery.body, {
                headers: Object.fromEntries(request.headers),
            });
            await applyDodoWebhook(delivery);
            return Response.json({ received: true });
        } catch (error) {
            console.error("[billing] past-due webhook rejected:", error);
            return Response.json(
                {
                    message:
                        "The billing update could not be processed. Retry this delivery.",
                },
                { status: 400 },
            );
        }
    }
    return dodoDelivery.run(delivery, () => auth().handler(request));
};
