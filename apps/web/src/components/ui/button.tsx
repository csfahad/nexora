import { cva } from "class-variance-authority";
import { IconLoader2 } from "@tabler/icons-react";
import type { VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export const buttonClasses = cva(
    cn(
        "transition-state relative inline-flex shrink-0 items-center justify-center gap-2",
        "rounded-md font-medium whitespace-nowrap select-none",
        "not-disabled:active:translate-y-px",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "aria-busy:cursor-progress",
        "[&>svg]:shrink-0",
    ),
    {
        variants: {
            variant: {
                primary:
                    "bg-primary text-primary-foreground not-disabled:hover:bg-primary-hover",
                secondary: cn(
                    "bg-secondary text-secondary-foreground",
                    "not-disabled:hover:text-foreground",
                    "not-disabled:hover:brightness-110 dark:not-disabled:hover:brightness-125",
                ),
                outline: cn(
                    "border border-input bg-transparent text-foreground",
                    "not-disabled:hover:bg-accent",
                ),
                ghost: cn(
                    "bg-transparent text-muted-foreground",
                    "not-disabled:hover:bg-accent not-disabled:hover:text-foreground",
                ),
                destructive: cn(
                    "bg-destructive text-destructive-foreground",
                    "not-disabled:hover:brightness-110",
                ),
            },
            size: {
                sm: "h-8 px-2.5 text-[0.8125rem] [&>svg]:size-4",
                md: "h-9 px-3.5 text-sm [&>svg]:size-4",
                lg: "h-11 px-5 text-[0.9375rem] [&>svg]:size-[1.125rem]",
                icon: "size-9 [&>svg]:size-[1.125rem]",
                "icon-sm": "size-8 [&>svg]:size-4",
            },
        },
        defaultVariants: { variant: "secondary", size: "md" },
    },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonClasses> & {
        readonly loading?: boolean;
        readonly children?: ReactNode;
    };

export const Button = ({
    className,
    variant,
    size,
    loading = false,
    disabled = false,
    type = "button",
    children,
    ...props
}: ButtonProps) => (
    <button
        {...props}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonClasses({ variant, size }), className)}
    >
        {loading ? (
            <>
                <IconLoader2 aria-hidden data-spinner className="absolute animate-spin" />
                <span className="invisible inline-flex items-center gap-2">
                    {children}
                </span>
            </>
        ) : (
            children
        )}
    </button>
);
