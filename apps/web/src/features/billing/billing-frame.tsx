import type { ReactNode } from "react";
import { StandaloneHeader } from "@/components/ui/standalone-header";

export const BillingFrame = ({ children }: { readonly children: ReactNode }) => (
    <div className="screen">
        <a href="#billing-main" className="skip-link">
            Skip to content
        </a>
        <StandaloneHeader title="Billing" />
        <main id="billing-main" tabIndex={-1} className="screen-scroll min-h-0 flex-1">
            {children}
        </main>
    </div>
);
