import { cn } from "@/lib/utils";
import { NEXORA_MARK_PATHS } from "./nexora-mark";

export const NexoraMark = ({ className }: { readonly className?: string }) => (
    <svg
        aria-hidden
        focusable="false"
        viewBox="0 0 32 32"
        fill="currentColor"
        className={cn("nexora-mark", className)}
    >
        {NEXORA_MARK_PATHS.map((path) => (
            <path key={path} d={path} />
        ))}
    </svg>
);

export const Wordmark = ({ compact = false }: { readonly compact?: boolean }) => (
    <span className="wordmark" translate="no">
        <span className="wordmark-icon">
            <NexoraMark />
        </span>
        {!compact && <span>Nexora</span>}
    </span>
);
