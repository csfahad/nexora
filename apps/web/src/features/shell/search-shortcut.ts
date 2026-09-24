import { useEffect, useState } from "react";

export const isSearchShortcut = (event: KeyboardEvent): boolean =>
    event.key.toLowerCase() === "k" &&
    (event.metaKey || event.ctrlKey) &&
    !event.altKey &&
    !event.shiftKey;

export const useSearchShortcutLabel = (): string | null => {
    const [label, setLabel] = useState<string | null>(null);

    useEffect(() => {
        setLabel(/mac|iphone|ipad|ipod/i.test(navigator.userAgent) ? "⌘K" : "Ctrl K");
    }, []);

    return label;
};
