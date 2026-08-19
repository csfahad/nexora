import { Fragment } from "react";
import { useRouterState } from "@tanstack/react-router";
import { IconChevronRight, IconLayoutSidebar } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { breadcrumbFor } from "./nav-items";
import { useShellChrome } from "./shell-chrome";

export const TopBar = ({
    onToggleSidebar,
    sidebarShown,
}: {
    readonly onToggleSidebar: () => void;
    readonly sidebarShown: boolean;
}) => {
    const pathname = useRouterState({ select: (state) => state.location.pathname });
    const crumbs = breadcrumbFor(pathname);
    const trailing = useShellChrome()?.trailing ?? null;

    return (
        <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b px-3">
            <Button
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                aria-label={sidebarShown ? "Hide sidebar" : "Show sidebar"}
                aria-expanded={sidebarShown}
            >
                <IconLayoutSidebar aria-hidden stroke={1.75} />
            </Button>

            <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
                <ol className="flex items-center gap-1.5 text-sm">
                    {crumbs.map((crumb, index) => {
                        const last = index === crumbs.length - 1;
                        return (
                            <Fragment key={crumb}>
                                {index > 0 && (
                                    <IconChevronRight
                                        aria-hidden
                                        className="text-muted-foreground size-4 shrink-0"
                                    />
                                )}
                                <li
                                    aria-current={last ? "page" : undefined}
                                    className={
                                        last
                                            ? "text-foreground truncate font-medium"
                                            : "text-muted-foreground truncate"
                                    }
                                >
                                    {crumb}
                                </li>
                            </Fragment>
                        );
                    })}
                </ol>
            </nav>

            {trailing && (
                <div className="flex shrink-0 items-center gap-2">{trailing}</div>
            )}
        </header>
    );
};
