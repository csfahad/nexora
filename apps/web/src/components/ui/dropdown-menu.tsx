import type { ComponentProps } from "react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;

export const DropdownMenuContent = ({
    className,
    align = "end",
    sideOffset = 6,
    ...props
}: ComponentProps<typeof MenuPrimitive.Content>) => (
    <MenuPrimitive.Portal>
        <MenuPrimitive.Content
            align={align}
            sideOffset={sideOffset}
            className={cn(
                "origin-(--radix-dropdown-menu-content-transform-origin)",
                "duration-(--dur-state) bg-popover text-popover-foreground outline-hidden z-50 min-w-40 rounded-lg p-1 shadow-lg",
                "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                className,
            )}
            {...props}
        />
    </MenuPrimitive.Portal>
);

type DropdownMenuItemProps = ComponentProps<typeof MenuPrimitive.Item> &
    Readonly<{ variant?: "default" | "danger" }>;

export const DropdownMenuItem = ({
    className,
    variant = "default",
    ...props
}: DropdownMenuItemProps) => (
    <MenuPrimitive.Item
        data-variant={variant}
        className={cn("menu-row", className)}
        {...props}
    />
);
