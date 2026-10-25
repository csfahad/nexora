import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const BillingFrame = ({ children }: { readonly children: ReactNode }) => (
    <div className="screen">
        <header className="border-border flex h-14 shrink-0 items-center gap-3 border-b px-4">
            <Link
                to="/"
                aria-label="Nexora — go to arena"
                className="font-heading text-foreground shrink-0 rounded-md text-lg font-semibold tracking-tight"
            >
                Nexora
            </Link>
            <span aria-hidden className="bg-border h-5 w-px shrink-0" />
            <span className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
                Billing
            </span>
            <ThemeToggle />
        </header>
        <main className="screen-scroll min-h-0 flex-1">{children}</main>
    </div>
);
