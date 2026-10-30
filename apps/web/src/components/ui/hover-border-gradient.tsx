import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const HoverBorderGradient = ({
    children,
    className,
    ...props
}: ComponentProps<"div"> & {
    readonly children: ReactNode;
}) => (
    <div {...props} className={cn("hover-border-gradient", className)}>
        <div aria-hidden className="hover-border-light" />
        <div className="hover-border-content">{children}</div>
    </div>
);
