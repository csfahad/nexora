import { useEffect, useState } from "react";
import { IconLink, IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { shareUrlFor } from "./share-slug";
import { readShareLink, revokeShareLink, shareNotice, shareThread } from "./share-thread";
import type { ShareLinkResult } from "./share-thread";

const originOf = (): string =>
    typeof window === "undefined" ? "" : window.location.origin;

export const ShareThreadDialog = ({
    threadId,
    title,
    open,
    onOpenChange,
}: Readonly<{
    threadId: string | null;
    title: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>) => {
    const [slug, setSlug] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!open || threadId === null) return;

        let cancelled = false;

        setLoading(true);
        setNotice(null);
        setSlug(null);

        void readShareLink({ data: { threadId } })
            .catch((): null => null)
            .then((result) => {
                if (cancelled) return;

                setLoading(false);
                setNotice(shareNotice(result));
                setSlug(result?.status === "ok" ? result.slug : null);
            });

        return () => {
            cancelled = true;
        };
    }, [open, threadId]);

    const run = async (call: Promise<ShareLinkResult>) => {
        setBusy(true);
        setNotice(null);

        const result = await call.catch((): null => null);

        setBusy(false);
        setNotice(shareNotice(result));
        if (result?.status === "ok") setSlug(result.slug);
    };

    const url = slug === null ? null : shareUrlFor(originOf(), slug);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md p-5"
                onEscapeKeyDown={(event) => {
                    if (busy) event.preventDefault();
                }}
            >
                <div className="flex flex-col gap-2">
                    <DialogTitle>Share this thread</DialogTitle>
                    <DialogDescription>
                        {title === null
                            ? "Anyone with the link can read every prompt, answer and measured number in this thread. They can't send prompts, vote, or see your account."
                            : `Anyone with the link can read every prompt, answer and measured number in “${title}”. They can't send prompts, vote, or see your account.`}
                    </DialogDescription>
                </div>

                <div className="mt-5">
                    {loading ? (
                        <p
                            role="status"
                            className="text-muted-foreground flex items-center gap-2 text-sm"
                        >
                            <IconLoader2
                                aria-hidden
                                data-spinner
                                className="size-4 animate-spin"
                            />
                            Checking this thread&rsquo;s link
                        </p>
                    ) : url === null ? (
                        <Button
                            variant="primary"
                            loading={busy}
                            onClick={() => {
                                if (threadId !== null) {
                                    void run(shareThread({ data: { threadId } }));
                                }
                            }}
                        >
                            <IconLink aria-hidden stroke={1.75} />
                            Create link
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-3">
                            <div className="border-input bg-muted flex items-center gap-1 rounded-md border py-1 pl-3 pr-1">
                                <input
                                    readOnly
                                    value={url}
                                    aria-label="Share link"
                                    onFocus={(event) => event.target.select()}
                                    className="text-foreground min-w-0 flex-1 bg-transparent text-[0.8125rem]"
                                />

                                <CopyButton text={url} label="Copy share link" />
                            </div>

                            <p className="text-muted-foreground text-pretty text-xs">
                                Revoking stops this link working for everyone who has it.
                                Sharing again makes a different link, not this one.
                            </p>
                        </div>
                    )}
                </div>

                {notice !== null && (
                    <p role="alert" className="text-destructive mt-3 text-pretty text-xs">
                        {notice}
                    </p>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    {url !== null && (
                        <Button
                            variant="destructive"
                            size="sm"
                            loading={busy}
                            onClick={() => {
                                if (threadId !== null) {
                                    void run(revokeShareLink({ data: { threadId } }));
                                }
                            }}
                        >
                            Revoke link
                        </Button>
                    )}

                    <DialogClose asChild>
                        <Button variant="ghost" size="sm" disabled={busy}>
                            Done
                        </Button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
};
