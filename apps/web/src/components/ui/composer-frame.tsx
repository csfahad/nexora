import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const ComposerFrame = ({
    children,
    className,
    animated = false,
    ...props
}: ComponentProps<"div"> & {
    readonly children: ReactNode;
    readonly animated?: boolean;
}) => (
    <div
        {...props}
        className={cn(
            "composer-frame",
            animated && "composer-frame--animated",
            className,
        )}
    >
        {animated && <div aria-hidden className="composer-frame-light" />}
        <div className="composer-frame-content">{children}</div>
    </div>
);
