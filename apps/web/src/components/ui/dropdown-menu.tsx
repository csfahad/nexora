import type { ComponentProps } from "react";
import { DropdownMenu as MenuPrimitive } from "radix-ui";
import { IconCheck } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export const DropdownMenu = MenuPrimitive.Root;
export const DropdownMenuTrigger = MenuPrimitive.Trigger;
export const DropdownMenuLabel = MenuPrimitive.Label;
export const DropdownMenuRadioGroup = MenuPrimitive.RadioGroup;
export const DropdownMenuSeparator = ({
    className,
    ...props
}: ComponentProps<typeof MenuPrimitive.Separator>) => (
    <MenuPrimitive.Separator
        className={cn("bg-border mx-1 my-1 h-px", className)}
        {...props}
    />
);

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
                "ui-popover duration-(--dur-state) bg-popover text-popover-foreground outline-hidden z-50 min-w-40 rounded-xl p-1.5",
                "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
                "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
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

export const DropdownMenuRadioItem = ({
    className,
    children,
    ...props
}: ComponentProps<typeof MenuPrimitive.RadioItem>) => (
    <MenuPrimitive.RadioItem className={cn("menu-row", className)} {...props}>
        {children}
        <span
            aria-hidden
            className="ml-auto inline-flex size-4 items-center justify-center"
        >
            <MenuPrimitive.ItemIndicator>
                <IconCheck className="size-4" stroke={1.75} />
            </MenuPrimitive.ItemIndicator>
        </span>
    </MenuPrimitive.RadioItem>
);
