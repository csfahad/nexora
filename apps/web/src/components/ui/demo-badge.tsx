import { cn } from "@/lib/utils";

export const DemoBadge = ({ className }: { readonly className?: string }) => (
    <span
        className={cn(
            "border-border inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5",
            "text-2xs text-muted-foreground font-medium uppercase tracking-wide",
            className,
        )}
    >
        <span aria-hidden className="bg-muted-foreground size-1.5 rounded-full" />
        Demonstration data
    </span>
);
