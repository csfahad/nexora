import { useState } from "react";
import { authClient } from "@/infrastructure/auth-client";

export const useBillingPortal = () => {
    const [opening, setOpening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const openPortal = async () => {
        setOpening(true);
        setError(null);
        try {
            const result = await authClient.dodopayments.customer.portal();
            if (result.error || !result.data.url) {
                setError(
                    result.error?.status === 401
                        ? "Sign in again with Google or GitHub to verify your email, then retry the billing portal."
                        : "The billing portal couldn't open. Try again.",
                );
                setOpening(false);
                return;
            }
            window.location.assign(result.data.url);
        } catch (cause) {
            console.error("[billing] portal failed:", cause);
            setError("The billing portal couldn't open. Try again.");
            setOpening(false);
        }
    };
    return { opening, error, openPortal };
};
