import { useEffect, useRef } from "react";
import { NexoraMark } from "./wordmark";

export const PageLoading = ({
    label = "Loading…",
    fullPage = false,
}: {
    readonly label?: string;
    readonly fullPage?: boolean;
}) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (fullPage) ref.current?.focus({ preventScroll: true });
    }, [fullPage]);

    return (
        <div
            ref={ref}
            className={fullPage ? "page-loading page-loading--full" : "page-loading"}
            role="status"
            aria-live="polite"
            aria-busy="true"
            tabIndex={fullPage ? -1 : undefined}
        >
            <NexoraMark className="page-loading-mark" />
            <span className="sr-only">{label}</span>
        </div>
    );
};
