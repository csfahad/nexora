import { checkout, dodopayments, portal, webhooks } from "@dodopayments/better-auth";
import type { Product } from "@dodopayments/better-auth";
import type DodoPayments from "dodopayments";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export const createAuthPlugins = (
    options: Readonly<{
        client: DodoPayments;
        products: Product[];
        successUrl: string;
        webhookKey: string;
        onPayload: NonNullable<Parameters<typeof webhooks>[0]["onPayload"]>;
    }>,
) => [
    dodopayments({
        client: options.client,
        createCustomerOnSignUp: true,
        use: [
            checkout({
                products: options.products,
                successUrl: options.successUrl,
                authenticatedUsersOnly: true,
            }),
            portal(),
            webhooks({ webhookKey: options.webhookKey, onPayload: options.onPayload }),
        ],
    }),
    tanstackStartCookies(),
];
