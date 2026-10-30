import { useCallback, useEffect, useState } from "react";
import {
    THEME_STORAGE_KEY,
    isThemeChoice,
    nextChoice,
    resolveTheme,
} from "@/components/theme/theme";
import type { Theme, ThemeChoice } from "@/components/theme/theme";

const LIGHT_QUERY = "(prefers-color-scheme: light)";
const THEME_CHANGE_EVENT = "nexora-theme-change";

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
        const onChoiceChange = (event: Event) => {
            if (event instanceof CustomEvent && isThemeChoice(event.detail)) {
                sync(event.detail);
            }
        };
        media.addEventListener("change", onSystemChange);
        window.addEventListener(THEME_CHANGE_EVENT, onChoiceChange);
        return () => {
            media.removeEventListener("change", onSystemChange);
            window.removeEventListener(THEME_CHANGE_EVENT, onChoiceChange);
        };
    }, []);

    const select = useCallback((next: ThemeChoice) => {
        const resolved = resolveTheme(next, window.matchMedia(LIGHT_QUERY).matches);
        setChoice(next);
        setTheme(resolved);
        applyTheme(resolved, next);
        try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {}
        window.dispatchEvent(
            new CustomEvent<ThemeChoice>(THEME_CHANGE_EVENT, { detail: next }),
        );
    }, []);

    const cycle = useCallback(() => select(nextChoice(choice)), [choice, select]);

    return { choice, theme, ready, select, cycle } as const;
};
