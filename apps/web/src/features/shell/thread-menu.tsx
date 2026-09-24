import { useRef } from "react";
import { IconDotsVertical, IconPencil, IconShare, IconTrash } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const ThreadMenu = ({
    title,
    onRename,
    onShare,
    onDelete,
}: Readonly<{
    title: string;
    onRename: () => void;
    onShare: () => void;
    onDelete: () => void;
}>) => {
    const selected = useRef(false);

    return (
        <DropdownMenu
            onOpenChange={(open) => {
                if (open) selected.current = false;
            }}
        >
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${title}`}
                    className="thread-actions bg-sidebar size-7"
                >
                    <IconDotsVertical aria-hidden stroke={1.75} />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                onCloseAutoFocus={(event) => {
                    if (selected.current) event.preventDefault();
                }}
            >
                <DropdownMenuItem
                    onSelect={() => {
                        selected.current = true;
                        onRename();
                    }}
                >
                    <IconPencil aria-hidden className="size-4" stroke={1.75} />
                    Rename
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={() => {
                        selected.current = true;
                        onShare();
                    }}
                >
                    <IconShare aria-hidden className="size-4" stroke={1.75} />
                    Share
                </DropdownMenuItem>

                <DropdownMenuItem
                    variant="danger"
                    onSelect={() => {
                        selected.current = true;
                        onDelete();
                    }}
                >
                    <IconTrash aria-hidden className="size-4" stroke={1.75} />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
