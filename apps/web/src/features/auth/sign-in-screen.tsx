import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconAlertTriangle, IconBrandGithub } from "@tabler/icons-react";
import { NexoraMark } from "@/components/ui/wordmark";
import { LegalLinks } from "@/components/ui/legal-links";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { Button, buttonClasses } from "@/components/ui/button";
import { authClient } from "@/infrastructure/auth-client";
import { useSessionState } from "@/infrastructure/session";
import { cn } from "@/lib/utils";

const GoogleMark = ({ className }: { readonly className?: string }) => (
    <svg aria-hidden viewBox="0 0 48 48" className={className}>
        <path
            fill="#ea4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
        />
        <path
            fill="#4285f4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.03 46.98 31.87 46.98 24.55Z"
        />
        <path
            fill="#fbbc05"
            d="M10.53 28.59A14.41 14.41 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.87 23.87 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z"
        />
        <path
            fill="#34a853"
            d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
        />
    </svg>
);

const PROVIDERS = [
    { id: "google", label: "Sign in with Google", icon: GoogleMark },
    { id: "github", label: "Sign in with GitHub", icon: IconBrandGithub },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

const START_FAILED =
    "We couldn't reach that sign-in just now. Try it again, or use the other provider.";

export const SignInScreen = ({ next }: { readonly next: string }) => {
    const session = useSessionState();
    const [pending, setPending] = useState<ProviderId | null>(null);
    const [failed, setFailed] = useState(false);

    const start = async (provider: ProviderId) => {
        setPending(provider);
        setFailed(false);

        try {
            const { error } = await authClient.signIn.social({
                provider,
                callbackURL: next,
            });

            if (!error) return;

            console.error("[auth] sign-in start rejected:", error);
        } catch (error) {
            console.error("[auth] sign-in start failed:", error);
        }

        setFailed(true);
        setPending(null);
    };

    return (
        <main id="sign-in-main" className="screen screen-scroll auth-page">
            <div className="auth-layout">
                <section className="auth-panel" aria-labelledby="sign-in-heading">
                    <Link to="/" aria-label="Nexora — Home" className="auth-brand">
                        <NexoraMark />
                    </Link>
                    {session.status === "signed-in" ? (
                        <>
                            <div className="auth-copy">
                                <h1 id="sign-in-heading">You&rsquo;re signed in</h1>
                                <p className="text-muted-foreground text-pretty text-sm">
                                    Signed in as {session.user.name} ({session.user.email}
                                    ).
                                </p>
                            </div>
                            <a
                                href={next}
                                className={cn(
                                    buttonClasses({ variant: "primary", size: "md" }),
                                    "auth-continue",
                                )}
                            >
                                Continue
                            </a>
                        </>
                    ) : (
                        <>
                            <div className="auth-copy">
                                <h1 id="sign-in-heading">Sign in to Nexora</h1>
                                <p>Sign in or create an account with Google or GitHub.</p>
                            </div>

                            <div className="auth-providers">
                                {PROVIDERS.map(({ id, label, icon: Icon }) => (
                                    <Button
                                        key={id}
                                        variant="secondary"
                                        size="md"
                                        className="auth-provider"
                                        aria-label={label}
                                        loading={pending === id}
                                        disabled={pending !== null && pending !== id}
                                        onClick={() => void start(id)}
                                    >
                                        <span aria-hidden className="auth-provider-mark">
                                            <Icon className="auth-provider-icon" />
                                        </span>
                                        {label}
                                    </Button>
                                ))}
                            </div>

                            <p role="status" aria-live="polite" className="sr-only">
                                {pending === "google"
                                    ? "Opening Google sign-in…"
                                    : pending === "github"
                                      ? "Opening GitHub sign-in…"
                                      : ""}
                            </p>

                            {failed && (
                                <p
                                    role="alert"
                                    className="text-foreground flex items-start gap-2 text-pretty text-left text-sm"
                                >
                                    <IconAlertTriangle
                                        aria-hidden
                                        stroke={1.75}
                                        className="text-destructive mt-0.5 size-4 shrink-0"
                                    />
                                    {START_FAILED}
                                </p>
                            )}
                        </>
                    )}
                    {session.status !== "signed-in" && (
                        <p className="auth-footnote">
                            By signing in, you agree to our{" "}
                            <Link to="/terms">Terms of Service</Link> and acknowledge our{" "}
                            <Link to="/privacy">Privacy Policy</Link>.
                        </p>
                    )}
                    {session.status === "signed-in" && <LegalLinks />}
                    <p className="auth-support">
                        Need help?{" "}
                        <a href="mailto:support@nexora.csfahad.in">Contact support</a>
                    </p>
                </section>
            </div>
            <div className="auth-appearance">
                <ThemeMenu />
            </div>
        </main>
    );
};
