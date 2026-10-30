import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { Wordmark } from "./wordmark";

export const StandaloneHeader = ({
    title,
    children,
    titleAsHeading = false,
}: {
    readonly title: string;
    readonly children?: ReactNode;
    readonly titleAsHeading?: boolean;
}) => {
    const Title = titleAsHeading ? "h1" : "span";
    return (
        <header className="standalone-topbar flex shrink-0 items-center gap-4">
            <Link
                to="/"
                aria-label="Nexora — go to arena"
                className="inline-flex shrink-0 items-center"
            >
                <Wordmark />
            </Link>
            <span aria-hidden className="bg-border h-5 w-px shrink-0" />
            <Title
                title={title}
                className="text-foreground min-w-0 flex-1 truncate text-sm font-medium leading-none"
            >
                {title}
            </Title>
            {children}
            <ThemeMenu side="bottom" />
        </header>
    );
};
