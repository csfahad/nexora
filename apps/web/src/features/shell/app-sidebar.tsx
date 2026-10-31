import { useState } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { IconMessage, IconSearch } from "@tabler/icons-react";
import { Wordmark } from "@/components/ui/wordmark";
import { ThemeMenu } from "@/components/theme/theme-menu";
import { AccountRow } from "./account-row";
import { DeleteThreadDialog } from "./delete-thread-dialog";
import { NAV_ITEMS } from "./nav-items";
import { useSearchShortcutLabel } from "./search-shortcut";
import { ShareThreadDialog } from "./share-dialog";
import { deleteThread, renameThread, threadMutationNotice } from "./thread-actions";
import { ThreadRow } from "./thread-row";
import type { ThreadHistoryGroup, ThreadHistoryItem } from "./thread-history";

type AppSidebarProps = Readonly<{
    threadGroups: readonly ThreadHistoryGroup[];
    onOpenSearch: () => void;
    onNavigate?: () => void;
    collapsed?: boolean;
}>;

const CompactSidebar = ({
    onOpenSearch,
    onNavigate,
}: Pick<AppSidebarProps, "onOpenSearch" | "onNavigate">) => (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col items-center py-3">
        <Link
            to="/"
            onClick={onNavigate}
            aria-label="Nexora — go to arena"
            className="font-heading text-foreground grid size-9 place-items-center rounded-md text-base font-semibold"
        >
            <Wordmark compact />
        </Link>

        <nav aria-label="Primary" className="mt-4 flex flex-col items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact: true, includeSearch: false }}
                    onClick={onNavigate}
                    aria-label={label}
                    title={label}
                    className="side-row size-9 justify-center p-0"
                >
                    <Icon aria-hidden className="size-4.5" stroke={1.75} />
                </Link>
            ))}

            <button
                type="button"
                onClick={onOpenSearch}
                aria-label="Search threads"
                title="Search threads"
                className="side-row size-9 justify-center p-0"
            >
                <IconSearch aria-hidden className="size-4.5" stroke={1.75} />
            </button>
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
            <ThemeMenu />
            <AccountRow compact onNavigate={onNavigate} />
        </div>
    </div>
);

export const AppSidebar = ({
    threadGroups,
    onOpenSearch,
    onNavigate,
    collapsed = false,
}: AppSidebarProps) => {
    const router = useRouter();
    const { pathname } = useLocation();
    const shortcut = useSearchShortcutLabel();
    const threads = threadGroups.flatMap((group) => group.threads);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<ThreadHistoryItem | null>(null);
    const [sharing, setSharing] = useState<ThreadHistoryItem | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    if (collapsed) {
        return <CompactSidebar onOpenSearch={onOpenSearch} onNavigate={onNavigate} />;
    }

    const rename = async (threadId: string, title: string) => {
        setBusyId(threadId);
        setNotice(null);

        const problem = threadMutationNotice(
            await renameThread({ data: { threadId, title } }).catch(() => null),
        );

        setBusyId(null);
        setNotice(problem);
        if (problem !== null) return;

        setEditingId(null);
        await router.invalidate();
    };

    const confirmDelete = async (thread: ThreadHistoryItem) => {
        setBusyId(thread.id);
        setNotice(null);

        const problem = threadMutationNotice(
            await deleteThread({ data: { threadId: thread.id } }).catch(() => null),
        );

        setBusyId(null);
        setPendingDelete(null);
        setNotice(problem);
        if (problem !== null) return;

        await router.invalidate();

        // The open thread just stopped existing, so nothing is left to read.
        if (pathname === `/thread/${thread.id}`) await router.navigate({ to: "/" });
    };

    return (
        <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
            <div className="sidebar-brand flex items-center">
                <Link
                    to="/"
                    activeOptions={{ exact: true, includeSearch: false }}
                    onClick={onNavigate}
                    aria-label="Nexora — go to arena"
                    className="font-heading text-foreground rounded-md text-lg font-semibold tracking-tight"
                >
                    <Wordmark />
                </Link>
            </div>

            <nav aria-label="Primary" className="sidebar-nav flex flex-col">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        activeOptions={{ exact: true, includeSearch: false }}
                        onClick={onNavigate}
                        className="side-row"
                    >
                        <Icon aria-hidden className="size-4.5" stroke={1.75} />
                        {label}
                    </Link>
                ))}

                <button type="button" onClick={onOpenSearch} className="side-row">
                    <IconSearch aria-hidden className="size-4.5" stroke={1.75} />
                    Search threads
                    {shortcut !== null && <kbd className="kbd ml-auto">{shortcut}</kbd>}
                </button>
            </nav>

            <div aria-hidden className="sidebar-history-separator" />
            <p className="sidebar-section-label">Recent threads</p>

            <div className="sidebar-history">
                {threads.length === 0 ? (
                    <div className="sidebar-empty">
                        <IconMessage aria-hidden stroke={1.5} />
                        <strong>A fresh start.</strong>Your comparisons will appear here,
                        ready to pick up where you left off.
                    </div>
                ) : (
                    <nav aria-label="Recent threads" className="sidebar-thread-list">
                        {threads.map((thread) => (
                            <ThreadRow
                                key={thread.id}
                                thread={thread}
                                renaming={editingId === thread.id}
                                busy={busyId === thread.id}
                                onNavigate={onNavigate}
                                onStartRename={() => {
                                    setNotice(null);
                                    setEditingId(thread.id);
                                }}
                                onCancelRename={() => setEditingId(null)}
                                onRename={(title) => void rename(thread.id, title)}
                                onShare={() => {
                                    setNotice(null);
                                    setSharing(thread);
                                }}
                                onDelete={() => setPendingDelete(thread)}
                            />
                        ))}
                    </nav>
                )}

                {notice !== null && (
                    <p
                        role="alert"
                        className="text-destructive text-pretty px-2 py-2 text-xs"
                    >
                        {notice}
                    </p>
                )}
            </div>

            <div className="sidebar-bottom">
                <div className="sidebar-account">
                    <AccountRow onNavigate={onNavigate} />
                </div>
                <ThemeMenu />
            </div>

            <ShareThreadDialog
                threadId={sharing?.id ?? null}
                title={sharing?.title ?? null}
                open={sharing !== null}
                onOpenChange={(open) => {
                    if (!open) setSharing(null);
                }}
            />

            <DeleteThreadDialog
                open={pendingDelete !== null}
                title={pendingDelete?.title ?? null}
                busy={pendingDelete !== null && busyId === pendingDelete.id}
                onOpenChange={(open) => {
                    if (!open) setPendingDelete(null);
                }}
                onConfirm={() => {
                    if (pendingDelete !== null) void confirmDelete(pendingDelete);
                }}
            />
        </div>
    );
};
