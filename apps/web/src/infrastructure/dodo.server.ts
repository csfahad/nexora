import "@tanstack/react-start/server-only";
import DodoPayments from "dodopayments";
import { serverEnv } from "@/infrastructure/env";

let cached: DodoPayments | undefined;
export const dodoClient = (): DodoPayments => {
    if (cached) return cached;
    const env = serverEnv();
    cached = new DodoPayments({
        bearerToken: env.DODO_PAYMENTS_API_KEY,
        environment: env.DODO_ENVIRONMENT,
        webhookKey: env.DODO_PAYMENTS_WEBHOOK_KEY,
    });
    return cached;
};
