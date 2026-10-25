import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
    IconAlertTriangle,
    IconChevronUp,
    IconCreditCard,
    IconLoader2,
    IconLogin2,
    IconLogout,
} from "@tabler/icons-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/infrastructure/auth-client";
import { SESSION_UNAVAILABLE, useSessionState } from "@/infrastructure/session";
import type { SessionUser } from "@/infrastructure/session";
import { cn } from "@/lib/utils";

const SIGN_OUT_FAILED = "Signing out didn't go through. Try that again.";

const cnRow = cn(
    "transition-state flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5",
    "text-muted-foreground text-sm",
);

const cnRowInteractive = cn(
    cnRow,
    "hover:bg-accent hover:text-foreground active:translate-y-px",
);

const cnRailRow = cn(
    "transition-state text-muted-foreground grid size-9 shrink-0 place-items-center rounded-md",
    "hover:bg-accent hover:text-foreground active:translate-y-px",
);

const Avatar = ({ user }: { readonly user: SessionUser }) => (
    <span className="border-input bg-muted grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border">
        {user.image ? (
            <img
                src={user.image}
                alt=""
                width={28}
                height={28}
                referrerPolicy="no-referrer"
                className="size-full object-cover"
            />
        ) : (
            <span aria-hidden className="text-foreground text-xs font-semibold">
                {user.name.trim().charAt(0).toUpperCase() || "?"}
            </span>
        )}
    </span>
);

export const AccountRow = ({
    onNavigate,
    compact = false,
}: {
    readonly onNavigate?: () => void;
    readonly compact?: boolean;
}) => {
    const session = useSessionState();
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);
    const [failed, setFailed] = useState(false);
    const [open, setOpen] = useState(false);

    if (session.status === "unavailable") {
        if (compact) {
            return (
                <p role="alert" className={cn(cnRailRow, "text-foreground")}>
                    <IconAlertTriangle
                        aria-hidden
                        stroke={1.75}
                        className="text-destructive size-4.5 shrink-0"
                    />
                    <span className="sr-only">{SESSION_UNAVAILABLE}</span>
                </p>
            );
        }

        return (
            <p role="alert" className={cn(cnRow, "text-foreground")}>
                <IconAlertTriangle
                    aria-hidden
                    stroke={1.75}
                    className="text-destructive size-4.5 shrink-0"
                />
                <span className="truncate" title={SESSION_UNAVAILABLE}>
                    Account unavailable
                </span>
            </p>
        );
    }

    if (session.status === "signed-out") {
        if (compact) {
            return (
                <Link
                    to="/sign-in"
                    search={{ next: "/" }}
                    onClick={onNavigate}
                    aria-label="Sign in"
                    title="Sign in"
                    className={cnRailRow}
                >
                    <IconLogin2 aria-hidden stroke={1.75} className="size-4.5 shrink-0" />
                </Link>
            );
        }

        return (
            <Link
                to="/sign-in"
                search={{ next: "/" }}
                onClick={onNavigate}
                className={cnRowInteractive}
            >
                <IconLogin2 aria-hidden stroke={1.75} className="size-4.5 shrink-0" />
                <span className="truncate">Sign in</span>
            </Link>
        );
    }

    const { user } = session;

    const signOut = async () => {
        setSigningOut(true);
        setFailed(false);

        try {
            const { error } = await authClient.signOut();

            if (error) {
                console.error("[auth] sign-out rejected:", error);
                setFailed(true);
                setSigningOut(false);

                return;
            }
        } catch (error) {
            console.error("[auth] sign-out failed:", error);
            setFailed(true);
            setSigningOut(false);

            return;
        }

        await router.navigate({ to: "/" });
        await router.invalidate();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            {compact ? (
                <DropdownMenuTrigger
                    aria-label={`Account menu for ${user.name}`}
                    title={user.name}
                    className={cn(cnRailRow, "group/account")}
                >
                    <Avatar user={user} />
                </DropdownMenuTrigger>
            ) : (
                <DropdownMenuTrigger
                    aria-label={`Account menu for ${user.name}`}
                    className={cn(
                        cnRowInteractive,
                        "group/account data-[state=open]:bg-accent data-[state=open]:text-foreground",
                    )}
                >
                    <Avatar user={user} />
                    <span className="truncate">{user.name}</span>
                    <IconChevronUp
                        aria-hidden
                        stroke={1.75}
                        className="transition-state ml-auto size-4 shrink-0 group-data-[state=open]/account:rotate-180"
                    />
                </DropdownMenuTrigger>
            )}

            <DropdownMenuContent
                align={compact ? "center" : "start"}
                side="top"
                className="account-menu"
                aria-label="Account"
            >
                <DropdownMenuLabel className="account-menu-identity">
                    <Avatar user={user} />
                    <span className="min-w-0">
                        <span
                            className="text-foreground block truncate text-sm font-medium"
                            title={user.name}
                        >
                            {user.name}
                        </span>
                        <span
                            className="text-muted-foreground block truncate text-xs"
                            title={user.email}
                        >
                            {user.email}
                        </span>
                    </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link
                        to="/settings/billing"
                        search={{ checkout: undefined }}
                        onClick={() => {
                            setOpen(false);
                            onNavigate?.();
                        }}
                    >
                        <IconCreditCard aria-hidden stroke={1.75} className="size-4" />
                        Billing
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                    disabled={signingOut}
                    aria-busy={signingOut || undefined}
                    onSelect={(event) => {
                        event.preventDefault();
                        void signOut();
                    }}
                >
                    {signingOut ? (
                        <IconLoader2
                            aria-hidden
                            data-spinner
                            className="size-4 animate-spin"
                        />
                    ) : (
                        <IconLogout aria-hidden stroke={1.75} className="size-4" />
                    )}
                    {signingOut ? "Signing out…" : "Sign out"}
                </DropdownMenuItem>

                {failed && (
                    <p
                        role="alert"
                        className="text-foreground flex items-start gap-2 text-pretty px-2 py-2 text-xs"
                    >
                        <IconAlertTriangle
                            aria-hidden
                            stroke={1.75}
                            className="text-destructive mt-px size-3.5 shrink-0"
                        />
                        {SIGN_OUT_FAILED}
                    </p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
