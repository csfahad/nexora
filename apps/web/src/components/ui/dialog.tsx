import type { ComponentProps } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

type DialogAlign = "center" | "top";

const alignClasses: Record<DialogAlign, string> = {
    center: "items-center",
    top: "items-start pt-[min(14vh,7rem)]",
};

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> &
    Readonly<{ align?: DialogAlign }>;

export const DialogContent = ({
    className,
    align = "center",
    children,
    ...props
}: DialogContentProps) => (
    <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
            className={cn(
                "ui-overlay duration-(--dur-panel) fixed inset-0 z-50",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            )}
        />

        <div
            className={cn(
                "fixed inset-0 z-50 flex justify-center overflow-y-auto overscroll-contain p-4",
                "pointer-events-none",
                alignClasses[align],
            )}
        >
            <DialogPrimitive.Content
                className={cn(
                    "duration-(--dur-state) pointer-events-auto",
                    align === "center" && "my-auto",
                    "ui-dialog bg-popover text-popover-foreground outline-hidden w-full max-w-md rounded-2xl",
                    "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                    "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                    className,
                )}
                {...props}
            >
                {children}
            </DialogPrimitive.Content>
        </div>
    </DialogPrimitive.Portal>
);

export const DialogTitle = ({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Title>) => (
    <DialogPrimitive.Title
        className={cn("font-heading text-foreground text-base font-semibold", className)}
        {...props}
    />
);

export const DialogDescription = ({
    className,
    ...props
}: ComponentProps<typeof DialogPrimitive.Description>) => (
    <DialogPrimitive.Description
        className={cn("text-muted-foreground text-pretty text-sm", className)}
        {...props}
    />
);
