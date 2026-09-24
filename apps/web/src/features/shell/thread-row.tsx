import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconCheck, IconMessage, IconX } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ThreadMenu } from "./thread-menu";
import { ThreadTitle } from "./thread-title";
import type { ThreadHistoryItem } from "./thread-history";

const RenameForm = ({
    initial,
    busy,
    onCancel,
    onSave,
}: Readonly<{
    initial: string;
    busy: boolean;
    onCancel: () => void;
    onSave: (title: string) => void;
}>) => {
    const [value, setValue] = useState(initial);
    const title = value.trim();

    return (
        <form
            className="flex items-center gap-1 px-1 py-0.5"
            onSubmit={(event) => {
                event.preventDefault();
                if (title.length > 0) onSave(title);
            }}
        >
            <input
                autoFocus
                value={value}
                disabled={busy}
                maxLength={120}
                onFocus={(event) => event.target.select()}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === "Escape") onCancel();
                }}
                aria-label="Thread title"
                className="border-input bg-card text-foreground min-w-0 flex-1 rounded-md border px-2 py-1 text-[0.8125rem]"
            />

            <Button
                size="icon-sm"
                variant="primary"
                type="submit"
                loading={busy}
                disabled={title.length === 0}
                aria-label="Save thread title"
                className="size-7"
            >
                <IconCheck aria-hidden stroke={2} />
            </Button>

            <Button
                size="icon-sm"
                variant="ghost"
                disabled={busy}
                onClick={onCancel}
                aria-label="Cancel rename"
                className="size-7"
            >
                <IconX aria-hidden stroke={1.75} />
            </Button>
        </form>
    );
};

export const ThreadRow = ({
    thread,
    renaming,
    busy,
    onNavigate,
    onStartRename,
    onCancelRename,
    onRename,
    onShare,
    onDelete,
}: Readonly<{
    thread: ThreadHistoryItem;
    renaming: boolean;
    busy: boolean;
    onNavigate?: () => void;
    onStartRename: () => void;
    onCancelRename: () => void;
    onRename: (title: string) => void;
    onShare: () => void;
    onDelete: () => void;
}>) =>
    renaming ? (
        <RenameForm
            key={thread.id}
            initial={thread.title}
            busy={busy}
            onCancel={onCancelRename}
            onSave={onRename}
        />
    ) : (
        <div className="thread-row">
            <Link
                to="/thread/$threadId"
                params={{ threadId: thread.id }}
                activeOptions={{ exact: true }}
                onClick={onNavigate}
                className="side-row min-w-0"
            >
                <IconMessage aria-hidden className="size-4 shrink-0" stroke={1.75} />

                <ThreadTitle title={thread.title} />
            </Link>

            <ThreadMenu
                title={thread.title}
                onRename={onStartRename}
                onShare={onShare}
                onDelete={onDelete}
            />
        </div>
    );
