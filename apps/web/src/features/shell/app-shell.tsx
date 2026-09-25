import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./app-sidebar";
import { isSearchShortcut } from "./search-shortcut";
import { ThreadSearchDialog } from "./thread-search-dialog";
import { TopBar } from "./top-bar";
import type { ThreadHistoryGroup } from "./thread-history";

const DESKTOP_QUERY = "(min-width: 1024px)";

export const AppShell = ({
    children,
    threadGroups,
}: {
    readonly children: ReactNode;
    readonly threadGroups: readonly ThreadHistoryGroup[];
}) => {
    const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => {
        if (isDesktop && drawerOpen) setDrawerOpen(false);
    }, [isDesktop, drawerOpen]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!isSearchShortcut(event)) return;

            event.preventDefault();
            setDrawerOpen(false);
            setSearchOpen((value) => !value);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const openSearch = useCallback(() => {
        setDrawerOpen(false);
        setSearchOpen(true);
    }, []);

    const sidebarShown = isDesktop ? !collapsed : drawerOpen;
    const toggleSidebar = () => {
        if (isDesktop) {
            setCollapsed((value) => !value);
        } else {
            setDrawerOpen((value) => !value);
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            <aside
                inert={!isDesktop}
                className={cn(
                    "border-sidebar-border hidden shrink-0 overflow-hidden border-r lg:block",
                    "duration-(--dur-panel) ease-(--ease-out-expo) transition-[width]",
                    collapsed ? "lg:w-16" : "lg:w-68",
                )}
            >
                <div className={cn("h-full", collapsed ? "w-16" : "w-68")}>
                    <AppSidebar
                        threadGroups={threadGroups}
                        collapsed={collapsed}
                        onOpenSearch={openSearch}
                    />
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <TopBar onToggleSidebar={toggleSidebar} sidebarShown={sidebarShown} />
                <main className="relative min-h-0 flex-1 overflow-hidden">
                    {children}
                </main>
            </div>

            <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
                <Dialog.Portal>
                    <Dialog.Overlay
                        className={cn(
                            "fixed inset-0 z-40 bg-black/50 lg:hidden",
                            "data-[state=open]:animate-in data-[state=open]:fade-in",
                            "data-[state=closed]:animate-out data-[state=closed]:fade-out",
                        )}
                    />
                    <Dialog.Content
                        aria-describedby={undefined}
                        className={cn(
                            "w-68 fixed inset-y-0 left-0 z-50 max-w-[85vw] shadow-xl lg:hidden",
                            "duration-(--dur-panel) ease-(--ease-out-expo)",
                            "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
                            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
                        )}
                    >
                        <VisuallyHidden.Root>
                            <Dialog.Title>Navigation</Dialog.Title>
                        </VisuallyHidden.Root>
                        <AppSidebar
                            threadGroups={threadGroups}
                            onOpenSearch={openSearch}
                            onNavigate={() => setDrawerOpen(false)}
                        />
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>

            <ThreadSearchDialog
                open={searchOpen}
                onOpenChange={setSearchOpen}
                threadGroups={threadGroups}
                onNavigate={() => setDrawerOpen(false)}
            />
        </div>
    );
};
