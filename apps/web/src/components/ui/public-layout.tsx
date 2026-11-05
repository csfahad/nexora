import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useSessionState } from "@/infrastructure/session";
import { buttonClasses } from "./button";
import { PublicFooter } from "./public-footer";
import { Wordmark } from "./wordmark";

export const PublicLayout = ({ children }: { readonly children: ReactNode }) => {
    const session = useSessionState();

    return (
        <div className="public-page" data-scroll-restoration-id="public-page">
            <a href="#public-main" className="skip-link">
                Skip to content
            </a>
            <header className="public-header">
                <div className="public-header-inner">
                    <Link to="/" aria-label="Nexora home">
                        <Wordmark />
                    </Link>
                    <nav aria-label="Main navigation" className="public-nav">
                        <Link to="/" hash="how-it-works">
                            How it works
                        </Link>
                        <Link to="/models">Models</Link>
                        <Link to="/plans">Pricing</Link>
                    </nav>
                    <div className="public-header-actions">
                        {session.status === "signed-in" ? (
                            <Link
                                to="/app"
                                className={buttonClasses({
                                    variant: "primary",
                                    size: "sm",
                                })}
                            >
                                Open app <IconArrowUpRight aria-hidden size={16} />
                            </Link>
                        ) : (
                            <Link
                                to="/sign-in"
                                search={{ next: "/app" }}
                                className={buttonClasses({
                                    variant: "outline",
                                    size: "sm",
                                })}
                            >
                                Sign in <IconArrowUpRight aria-hidden size={16} />
                            </Link>
                        )}
                    </div>
                </div>
            </header>
            <main id="public-main" tabIndex={-1}>
                {children}
            </main>
            <PublicFooter />
        </div>
    );
};
