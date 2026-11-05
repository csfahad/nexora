import type { MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { IconArrowUp, IconArrowUpRight } from "@tabler/icons-react";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { Button } from "./button";
import { Wordmark } from "./wordmark";

const backToTop = (event: MouseEvent<HTMLButtonElement>) => {
    const page = event.currentTarget.closest(".public-page");
    if (!page) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    page.querySelector<HTMLAnchorElement>(".public-header a")?.focus({
        preventScroll: true,
    });
    page.scrollTo({ top: 0, behavior: reduceMotion ? "instant" : "smooth" });
};

export const PublicFooter = () => (
    <footer className="public-footer">
        <div className="public-footer-inner">
            <div className="public-footer-top">
                <div className="public-footer-brand">
                    <Link to="/" aria-label="Nexora home" className="public-footer-home">
                        <Wordmark />
                    </Link>
                    <h2>
                        AI answers,
                        <br />
                        in perspective.
                    </h2>
                    <p>Compare models on your own prompt, with speed and cost in view.</p>
                </div>
                <nav aria-label="Footer" className="public-footer-nav">
                    <div className="public-footer-link-group">
                        <h3>Explore</h3>
                        <ul>
                            <li>
                                <Link to="/app">
                                    Open Nexora <IconArrowUpRight aria-hidden size={15} />
                                </Link>
                            </li>
                            <li>
                                <Link to="/leaderboard">Leaderboard</Link>
                            </li>
                        </ul>
                    </div>
                    <div className="public-footer-link-group">
                        <h3>Support</h3>
                        <ul>
                            <li>
                                <a href="mailto:support@nexora.csfahad.in">Contact</a>
                            </li>
                            <li>
                                <Link to="/terms">Terms of Service</Link>
                            </li>
                            <li>
                                <Link to="/privacy">Privacy Policy</Link>
                            </li>
                        </ul>
                    </div>
                </nav>
            </div>
            <div className="public-footer-bottom">
                <span>© {new Date().getFullYear()} Nexora</span>
                <div className="public-footer-controls">
                    <ThemeMenu />
                    <Button
                        variant="outline"
                        size="icon"
                        className="public-footer-to-top"
                        aria-label="Back to top"
                        onClick={backToTop}
                    >
                        <IconArrowUp aria-hidden size={18} />
                    </Button>
                </div>
            </div>
            <div className="public-footer-wordmark" aria-hidden="true" translate="no">
                Nexora
            </div>
        </div>
    </footer>
);
