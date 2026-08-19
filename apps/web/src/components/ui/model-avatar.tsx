import { cn } from "@/lib/utils";

export const ModelAvatar = ({
    name,
    size = "md",
    className,
}: {
    readonly name: string;
    readonly size?: "sm" | "md" | "lg";
    readonly className?: string;
}) => {
    const initial = name.trim().charAt(0).toUpperCase() || "?";

    return (
        <span
            aria-hidden
            data-size={size}
            className={cn(
                "grid shrink-0 place-items-center rounded-full",
                "border-input bg-muted font-heading text-foreground border font-semibold",
                "select-none",
                size === "sm" && "size-6 text-[0.6875rem]",
                size === "md" && "size-8 text-xs",
                size === "lg" && "size-10 text-sm",
                className,
            )}
        >
            {initial}
        </span>
    );
};
