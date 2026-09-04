import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import {
    IconAlertTriangle,
    IconChevronUp,
    IconLogin2,
    IconLogout,
} from "@tabler/icons-react";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
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

export const AccountRow = ({ onNavigate }: { readonly onNavigate?: () => void }) => {
    const session = useSessionState();
    const router = useRouter();
    const [signingOut, setSigningOut] = useState(false);
    const [failed, setFailed] = useState(false);

    if (session.status === "unavailable") {
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
        <Popover>
            <PopoverTrigger className={cn(cnRowInteractive, "group/account")}>
                <Avatar user={user} />
                <span className="truncate">{user.name}</span>
                <IconChevronUp
                    aria-hidden
                    stroke={1.75}
                    className="transition-state ml-auto size-4 shrink-0 group-data-[state=open]/account:rotate-180"
                />
            </PopoverTrigger>

            <PopoverContent
                align="start"
                side="top"
                className="w-[min(15rem,calc(100vw-2rem))] gap-3"
            >
                <PopoverHeader className="flex-row items-center gap-2.5">
                    <Avatar user={user} />
                    <span className="min-w-0">
                        <PopoverTitle className="truncate text-sm">
                            {user.name}
                        </PopoverTitle>
                        <PopoverDescription className="truncate text-xs">
                            {user.email}
                        </PopoverDescription>
                    </span>
                </PopoverHeader>

                <Button
                    variant="outline"
                    size="sm"
                    loading={signingOut}
                    onClick={() => void signOut()}
                    className="w-full justify-start"
                >
                    <IconLogout aria-hidden stroke={1.75} />
                    Sign out
                </Button>

                {failed && (
                    <p
                        role="alert"
                        className="text-foreground flex items-start gap-2 text-pretty text-xs"
                    >
                        <IconAlertTriangle
                            aria-hidden
                            stroke={1.75}
                            className="text-destructive mt-px size-3.5 shrink-0"
                        />
                        {SIGN_OUT_FAILED}
                    </p>
                )}
            </PopoverContent>
        </Popover>
    );
};
