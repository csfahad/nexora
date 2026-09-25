import {
    HeadContent,
    Outlet,
    Scripts,
    createRootRoute,
    useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { themeInitScript } from "@/components/theme/theme-init-script";
import { ArenaStreamProvider } from "@/features/chat/arena-stream";
import { AppShell } from "@/features/shell/app-shell";
import { ShellChromeProvider } from "@/features/shell/shell-chrome";
import { getThreadHistory } from "@/features/shell/thread-history";
import { usePostHogViewer } from "@/infrastructure/posthog-browser";
import { getSessionState } from "@/infrastructure/session";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
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
        links: [{ rel: "stylesheet", href: appCss }],
    }),
    loader: async () => {
        const [session, threadGroups] = await Promise.all([
            getSessionState(),
            getThreadHistory(),
        ]);

        return { session, threadGroups };
    },
    staleTime: Number.POSITIVE_INFINITY,
    shellComponent: RootDocument,
    component: RootLayout,
});

function RootLayout() {
    usePostHogViewer();
    const { threadGroups } = Route.useLoaderData();
    const pathname = useRouterState({ select: (state) => state.location.pathname });

    if (pathname.startsWith("/share/")) {
        return <Outlet />;
    }

    return (
        <ShellChromeProvider>
            <AppShell threadGroups={threadGroups}>
                <ArenaStreamProvider>
                    <Outlet />
                </ArenaStreamProvider>
            </AppShell>
        </ShellChromeProvider>
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
                <Scripts />
            </body>
        </html>
    );
}
