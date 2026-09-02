import { useEffect, useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const CLEARED_AFTER_MS = 1600;

export const CopyButton = ({
    text,
    label,
    className,
}: {
    readonly text: string;
    readonly label: string;
    readonly className?: string;
}) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;

        const timer = window.setTimeout(() => setCopied(false), CLEARED_AFTER_MS);

        return () => window.clearTimeout(timer);
    }, [copied]);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            setCopied(false);
        }
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => void copy()}
                aria-label={copied ? "Copied" : label}
                className={className}
            >
                {copied ? (
                    <IconCheck aria-hidden stroke={2} className="text-win" />
                ) : (
                    <IconCopy aria-hidden stroke={1.75} />
                )}
            </Button>

            <span aria-live="polite" className="sr-only">
                {copied ? "Copied to clipboard" : ""}
            </span>
        </>
    );
};
