import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRouteWithContext,
    useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { themeInitScript } from "@/components/theme/theme-init-script";
import { ArenaStreamProvider } from "@/features/chat/arena-stream";
import { AppShell } from "@/features/shell/app-shell";
import { ShellChromeProvider } from "@/features/shell/shell-chrome";
import { getThreadHistory } from "@/features/shell/thread-history";
import { usePostHogViewer } from "@/infrastructure/posthog-browser";
import { UNMETERED, getAllowance } from "@/infrastructure/entitlement";
import { getSessionState, useSessionState } from "@/infrastructure/session";
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { useShellState } from "@/features/shell/optimistic-history";
import type { ShellState } from "@/features/shell/optimistic-history";
import type { ChatState } from "@/features/chat/optimistic-turns";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{ chat: ChatState; shell: ShellState }>()(
    {
        head: () => ({
            meta: [
                { charSet: "utf-8" },
                { name: "viewport", content: "width=device-width, initial-scale=1" },
                { title: "Nexora" },
                {
                    name: "description",
                    content:
                        "Send one prompt to up to three AI models at once, compare their answers side by side, and vote for the best.",
                },
            ],
            links: [
                { rel: "stylesheet", href: appCss },
                {
                    rel: "preload",
                    href: "/fonts/ApfelGrotezk-Mittel.woff2",
                    as: "font",
                    type: "font/woff2",
                    crossOrigin: "anonymous",
                },
                {
                    rel: "preload",
                    href: "/fonts/Inter-Variable.woff2",
                    as: "font",
                    type: "font/woff2",
                    crossOrigin: "anonymous",
                },
                { rel: "icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48" },
                {
                    rel: "icon",
                    href: "/favicon-32x32.png",
                    type: "image/png",
                    sizes: "32x32",
                },
                {
                    rel: "icon",
                    href: "/favicon.svg",
                    type: "image/svg+xml",
                    sizes: "any",
                },
                {
                    rel: "apple-touch-icon",
                    href: "/apple-touch-icon.png",
                    sizes: "180x180",
                },
            ],
        }),
        loader: async ({ context }) => {
            const signedOut = {
                session: { status: "signed-out" as const },
                threadGroups: [],
                allowance: UNMETERED,
            };
            if (context.shell.getSnapshot().revoked) return signedOut;
            const [session, threadGroups, allowance] = await Promise.all([
                getSessionState(),
                getThreadHistory(),
                getAllowance(),
            ]);

            return context.shell.getSnapshot().revoked
                ? signedOut
                : { session, threadGroups, allowance };
        },
        staleTime: Number.POSITIVE_INFINITY,
        shellComponent: RootDocument,
        component: RootLayout,
    },
);

function RootLayout() {
    usePostHogViewer();
    const { threadGroups } = Route.useLoaderData();
    const { shell, signingOut, notice } = useShellState();
    const session = useSessionState();
    const pathname = useRouterState({
        select: (state) => state.matches.at(-1)?.pathname ?? state.location.pathname,
    });

    const standalone =
        pathname === "/" ||
        /^\/(terms|privacy)\/?$/.test(pathname) ||
        pathname.startsWith("/share/") ||
        pathname === "/plans" ||
        pathname === "/sign-in" ||
        pathname === "/sign-in/" ||
        pathname === "/settings/billing" ||
        pathname === "/settings/billing/";

    return (
        <ArenaStreamProvider
            key={session.status === "signed-in" ? session.user.id : session.status}
        >
            {signingOut ? (
                <PageLoading label="Signing out…" fullPage />
            ) : (
                <>
                    {standalone ? (
                        <Outlet />
                    ) : (
                        <ShellChromeProvider>
                            <AppShell threadGroups={threadGroups}>
                                <Outlet />
                            </AppShell>
                        </ShellChromeProvider>
                    )}
                    {notice !== null && (
                        <div role="alert" className="action-notice">
                            <p>{notice}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => shell.notify(null)}
                            >
                                Dismiss
                            </Button>
                        </div>
                    )}
                </>
            )}
        </ArenaStreamProvider>
    );
}

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className="dark" suppressHydrationWarning>
            <head>
                <HeadContent />
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
            <body>
                {children}
                {import.meta.env.DEV && (
                    <TanStackDevtools
                        config={{ position: "bottom-right" }}
                        plugins={[
                            {
                                name: "Tanstack Router",
                                render: <TanStackRouterDevtoolsPanel />,
                            },
                        ]}
                    />
                )}
                <Analytics />
                <SpeedInsights />
                <Scripts />
            </body>
        </html>
    );
}
