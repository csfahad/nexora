import { useState } from "react";
import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { IconSearch } from "@tabler/icons-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AccountRow } from "./account-row";
import { DeleteThreadDialog } from "./delete-thread-dialog";
import { NAV_ITEMS } from "./nav-items";
import { useSearchShortcutLabel } from "./search-shortcut";
import { ShareThreadDialog } from "./share-dialog";
import { deleteThread, renameThread, threadMutationNotice } from "./thread-actions";
import { groupDomId } from "./thread-history";
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
            N
        </Link>

        <nav aria-label="Primary" className="mt-4 flex flex-col items-center gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <Link
                    key={to}
                    to={to}
                    activeOptions={{ exact: true }}
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

        <div className="mt-auto flex flex-col items-center gap-3">
            <ThemeToggle orientation="vertical" />
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
            <div className="flex h-14 items-center px-4">
                <Link
                    to="/"
                    activeOptions={{ exact: true }}
                    onClick={onNavigate}
                    aria-label="Nexora — go to arena"
                    className="font-heading text-foreground rounded-md text-lg font-semibold tracking-tight"
                >
                    Nexora
                </Link>
            </div>

            <nav aria-label="Primary" className="flex flex-col gap-0.5 px-3">
                {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                    <Link
                        key={to}
                        to={to}
                        activeOptions={{ exact: true }}
                        onClick={onNavigate}
                        className="side-row"
                    >
                        <Icon aria-hidden className="size-4.5" stroke={1.75} />
                        {label}
                    </Link>
                ))}

                <button type="button" onClick={onOpenSearch} className="side-row">
                    <IconSearch aria-hidden className="size-4.5" stroke={1.75} />
                    Search Threads
                    {shortcut !== null && <kbd className="kbd ml-auto">{shortcut}</kbd>}
                </button>
            </nav>

            <div className="border-border mx-4 mt-4 border-t" />

            <p className="label-meta px-4 pb-1 pt-4">Recent Threads</p>

            <div className="flex-1 overflow-y-auto px-3 py-1">
                {threadGroups.length === 0 ? (
                    <p className="text-muted-foreground text-pretty px-2 py-3 text-sm">
                        Your threads will appear here once you send a prompt.
                    </p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {threadGroups.map((group) => (
                            <section
                                key={group.label}
                                aria-labelledby={groupDomId(group.label)}
                            >
                                <h2
                                    id={groupDomId(group.label)}
                                    className="label-meta px-2 pb-1"
                                >
                                    {group.label}
                                </h2>

                                <div className="flex flex-col gap-0.5">
                                    {group.threads.map((thread) => (
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
                                            onRename={(title) =>
                                                void rename(thread.id, title)
                                            }
                                            onShare={() => {
                                                setNotice(null);
                                                setSharing(thread);
                                            }}
                                            onDelete={() => setPendingDelete(thread)}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
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

            <div className="border-border flex items-center justify-between gap-2 border-t px-3 py-3">
                <AccountRow onNavigate={onNavigate} />
                <ThemeToggle />
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
