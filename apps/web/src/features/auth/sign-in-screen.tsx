import { useState } from "react";
import { IconAlertTriangle, IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { authClient } from "@/infrastructure/auth-client";
import { useSessionState } from "@/infrastructure/session";
import { cn } from "@/lib/utils";

const PROVIDERS = [
    { id: "google", label: "Continue with Google", icon: IconBrandGoogle },
    { id: "github", label: "Continue with GitHub", icon: IconBrandGithub },
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
        <div className="screen screen-scroll">
            <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center gap-8 px-4 py-10">
                {session.status === "signed-in" ? (
                    <>
                        <div className="flex flex-col gap-3">
                            <h1 className="text-2xl font-semibold">
                                You&rsquo;re signed in
                            </h1>
                            <p className="text-muted-foreground text-pretty text-sm">
                                Signed in as {session.user.name} ({session.user.email}).
                            </p>
                        </div>
                        <a
                            href={next}
                            className={cn(
                                buttonClasses({ variant: "outline", size: "lg" }),
                                "w-full",
                            )}
                        >
                            Continue
                        </a>
                    </>
                ) : (
                    <>
                        <div className="flex flex-col gap-3">
                            <h1 className="text-2xl font-semibold">Sign in to Nexora</h1>
                            <p className="text-muted-foreground text-pretty text-sm">
                                Your threads, your votes, and the numbers measured on your
                                own prompts are all saved to your account.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {PROVIDERS.map(({ id, label, icon: Icon }) => (
                                <Button
                                    key={id}
                                    variant="outline"
                                    size="lg"
                                    className="w-full"
                                    loading={pending === id}
                                    disabled={pending !== null && pending !== id}
                                    onClick={() => void start(id)}
                                >
                                    <Icon aria-hidden stroke={1.75} />
                                    {label}
                                </Button>
                            ))}
                        </div>

                        {failed && (
                            <p
                                role="alert"
                                className="text-foreground flex items-start gap-2 text-pretty text-sm"
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
            </div>
        </div>
    );
};
