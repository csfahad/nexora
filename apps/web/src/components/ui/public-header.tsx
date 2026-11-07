import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconArrowUpRight, IconMenu2, IconX } from "@tabler/icons-react";
import { Dialog } from "radix-ui";
import { useSessionState } from "@/infrastructure/session";
import { Button, buttonClasses } from "./button";
import { Wordmark } from "./wordmark";

export const PublicHeader = () => {
    const session = useSessionState();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
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
                    <Link to="/leaderboard">Leaderboard</Link>
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
                                size: "md",
                            })}
                        >
                            Sign in <IconArrowUpRight aria-hidden size={16} />
                        </Link>
                    )}
                    <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
                        <Dialog.Trigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="public-menu-trigger"
                                aria-label="Open navigation"
                            >
                                <IconMenu2 aria-hidden size={20} />
                            </Button>
                        </Dialog.Trigger>
                        <Dialog.Portal>
                            <Dialog.Overlay className="public-menu-overlay" />
                            <Dialog.Content
                                className="public-menu-panel"
                                aria-describedby={undefined}
                            >
                                <div className="public-menu-heading">
                                    <Dialog.Title>Explore Nexora</Dialog.Title>
                                    <Dialog.Close asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Close navigation"
                                        >
                                            <IconX aria-hidden size={20} />
                                        </Button>
                                    </Dialog.Close>
                                </div>
                                <nav aria-label="Mobile navigation">
                                    <Link
                                        to="/"
                                        hash="how-it-works"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        How it works
                                    </Link>
                                    <Link to="/models" onClick={() => setMenuOpen(false)}>
                                        Models
                                    </Link>
                                    <Link
                                        to="/leaderboard"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Leaderboard
                                    </Link>
                                    <Link to="/plans" onClick={() => setMenuOpen(false)}>
                                        Pricing
                                    </Link>
                                    <Link
                                        to="/app"
                                        onClick={() => setMenuOpen(false)}
                                        className={buttonClasses({
                                            variant: "primary",
                                        })}
                                    >
                                        Start comparing{" "}
                                        <IconArrowUpRight aria-hidden size={16} />
                                    </Link>
                                </nav>
                            </Dialog.Content>
                        </Dialog.Portal>
                    </Dialog.Root>
                </div>
            </div>
        </header>
    );
};
