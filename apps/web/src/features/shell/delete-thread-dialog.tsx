import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

export const DeleteThreadDialog = ({
    title,
    open,
    busy,
    onOpenChange,
    onConfirm,
}: Readonly<{
    title: string | null;
    open: boolean;
    busy: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}>) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
            className="max-w-sm p-5"
            onEscapeKeyDown={(event) => {
                if (busy) event.preventDefault();
            }}
        >
            <div className="flex flex-col gap-2">
                <DialogTitle>Delete this thread?</DialogTitle>
                <DialogDescription>
                    {title === null
                        ? "Its prompts, answers and votes go with it. This can't be undone."
                        : `“${title}” and every prompt, answer and vote in it will be gone. This can't be undone.`}
                </DialogDescription>
            </div>

            <div className="mt-5 flex justify-end gap-2">
                <DialogClose asChild>
                    <Button variant="ghost" size="sm" disabled={busy}>
                        Keep it
                    </Button>
                </DialogClose>

                <Button
                    variant="destructive"
                    size="sm"
                    loading={busy}
                    onClick={onConfirm}
                >
                    Delete thread
                </Button>
            </div>
        </DialogContent>
    </Dialog>
);
