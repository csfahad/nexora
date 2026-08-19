import { useCallback, useEffect, useState } from "react";
import {
    THEME_STORAGE_KEY,
    isThemeChoice,
    nextChoice,
    resolveTheme,
} from "@/components/theme/theme";
import type { Theme, ThemeChoice } from "@/components/theme/theme";

const LIGHT_QUERY = "(prefers-color-scheme: light)";

const applyTheme = (theme: Theme, choice: ThemeChoice) => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    root.setAttribute("data-theme-choice", choice);
};

const readStoredChoice = (): ThemeChoice => {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        return isThemeChoice(stored) ? stored : "system";
    } catch {
        return "system";
    }
};

export const useTheme = () => {
    const [choice, setChoice] = useState<ThemeChoice>("system");
    const [theme, setTheme] = useState<Theme>("dark");
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(LIGHT_QUERY);
        const stored = readStoredChoice();

        const sync = (next: ThemeChoice) => {
            const resolved = resolveTheme(next, media.matches);
            setChoice(next);
            setTheme(resolved);
            applyTheme(resolved, next);
        };

        sync(stored);
        setReady(true);

        const onSystemChange = () => {
            if (readStoredChoice() === "system") sync("system");
        };
        media.addEventListener("change", onSystemChange);
        return () => media.removeEventListener("change", onSystemChange);
    }, []);

    const select = useCallback((next: ThemeChoice) => {
        const resolved = resolveTheme(next, window.matchMedia(LIGHT_QUERY).matches);
        setChoice(next);
        setTheme(resolved);
        applyTheme(resolved, next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {}
    }, []);

    const cycle = useCallback(() => select(nextChoice(choice)), [choice, select]);

    return { choice, theme, ready, select, cycle } as const;
};
