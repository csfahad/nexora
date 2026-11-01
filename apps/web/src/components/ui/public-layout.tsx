import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IconArrowUpRight } from "@tabler/icons-react";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { useSessionState } from "@/infrastructure/session";
import { buttonClasses } from "./button";
import { LegalLinks } from "./legal-links";
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
                        <ThemeMenu side="bottom" />
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
            <footer className="public-footer">
                <div className="public-footer-top">
                    <div>
                        <Link to="/" aria-label="Nexora home">
                            <Wordmark />
                        </Link>
                        <p>One prompt. More perspective.</p>
                    </div>
                    <nav aria-label="Product" className="public-footer-nav">
                        <Link to="/app">Comparison arena</Link>
                        <Link to="/models">Model catalog</Link>
                        <Link to="/leaderboard">Leaderboard</Link>
                        <Link to="/plans">Plans &amp; pricing</Link>
                    </nav>
                </div>
                <div className="public-footer-bottom">
                    <span>© {new Date().getFullYear()} Nexora</span>
                    <LegalLinks />
                    <a href="mailto:support@nexora.csfahad.in">Contact</a>
                </div>
            </footer>
        </div>
    );
};
