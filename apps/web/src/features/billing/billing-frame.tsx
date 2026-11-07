import type { ReactNode } from "react";
import { PublicLayout } from "@/components/ui/public-layout";

export const BillingFrame = ({ children }: { readonly children: ReactNode }) => (
    <PublicLayout mainId="billing-main">{children}</PublicLayout>
);
