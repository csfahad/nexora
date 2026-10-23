import { createAuthClient } from "better-auth/client";
import { dodopaymentsClient } from "@dodopayments/better-auth/client";

export const authClient = createAuthClient({ plugins: [dodopaymentsClient()] });
