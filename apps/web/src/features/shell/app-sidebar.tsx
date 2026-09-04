import { Link } from "@tanstack/react-router";
import { IconMessagePlus } from "@tabler/icons-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AccountRow } from "./account-row";
import { NAV_ITEMS } from "./nav-items";

export const AppSidebar = ({ onNavigate }: { readonly onNavigate?: () => void }) => (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
        <div className="flex h-14 items-center px-4">
            <Link
                to="/"
                activeOptions={{ exact: true }}
                onClick={onNavigate}
                aria-label="Nexora — go to arena"
                className="font-heading text-foreground rounded-md text-lg font-semibold tracking-tight"
            >
                Nexora
            </Link>
        </div>

        <nav aria-label="Primary" className="flex flex-col gap-0.5 px-3">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact: true }}
                    onClick={onNavigate}
                    className="side-row"
                >
                    <Icon aria-hidden className="size-4.5" stroke={1.75} />
                    {label}
                </Link>
            ))}
        </nav>

        <div className="border-border mx-4 mt-4 border-t" />

        <div className="flex items-center justify-between px-4 pb-1 pt-4">
            <span className="label-meta">Your Threads</span>
        </div>

        <div className="px-3">
            <Link
                to="/"
                activeOptions={{ exact: true }}
                onClick={onNavigate}
                className="side-row"
            >
                <IconMessagePlus aria-hidden className="size-4.5" stroke={1.75} />
                New thread
            </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
            <p className="text-muted-foreground text-sm">
                Your threads will appear here once you send a prompt.
            </p>
        </div>

        <div className="border-border flex items-center justify-between gap-2 border-t px-3 py-3">
            <AccountRow onNavigate={onNavigate} />
            <ThemeToggle />
        </div>
    </div>
);
