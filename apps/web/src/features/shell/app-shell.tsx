import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Dialog, VisuallyHidden } from "radix-ui";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";

const DESKTOP_QUERY = "(min-width: 1024px)";

export const AppShell = ({ children }: { readonly children: ReactNode }) => {
    const isDesktop = useMediaQuery(DESKTOP_QUERY, true);
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        if (isDesktop && drawerOpen) setDrawerOpen(false);
    }, [isDesktop, drawerOpen]);

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
                inert={!isDesktop || collapsed}
                className={cn(
                    "border-sidebar-border hidden shrink-0 overflow-hidden border-r lg:block",
                    "duration-(--dur-panel) ease-(--ease-out-expo) transition-[width]",
                    collapsed ? "lg:w-0" : "lg:w-68",
                )}
            >
                <div className="w-68 h-full">
                    <AppSidebar />
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
                        <AppSidebar onNavigate={() => setDrawerOpen(false)} />
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
};
