import { cn } from "@/lib/utils";

export const NexoraMark = ({ className }: { readonly className?: string }) => (
    <svg
        aria-hidden
        viewBox="0 0 32 32"
        fill="none"
        className={cn("nexora-mark", className)}
    >
        <path
            d="M8 25V7l16 18V7"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M8 16h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity=".45"
        />
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
