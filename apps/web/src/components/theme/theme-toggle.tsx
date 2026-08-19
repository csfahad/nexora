import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import { useRef } from "react";
import type { TablerIcon } from "@tabler/icons-react";
import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";
import { THEME_CHOICES, themeChoiceLabel } from "@/components/theme/theme";
import { useTheme } from "@/components/theme/use-theme";
import type { ThemeChoice } from "@/components/theme/theme";

const ICONS: Readonly<Record<ThemeChoice, TablerIcon>> = {
    system: IconDeviceDesktop,
    light: IconSun,
    dark: IconMoon,
};

const STEP: Readonly<Record<string, number | undefined>> = {
    ArrowRight: 1,
    ArrowDown: 1,
    ArrowLeft: -1,
    ArrowUp: -1,
};

export const ThemeToggle = ({ className }: { readonly className?: string }) => {
    const { choice, ready, select } = useTheme();
    const groupRef = useRef<HTMLDivElement>(null);

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step = STEP[event.key];
        if (step === undefined) return;

        event.preventDefault();
        const next =
            THEME_CHOICES[
                (THEME_CHOICES.indexOf(choice) + step + THEME_CHOICES.length) %
                    THEME_CHOICES.length
            ];
        select(next);
        // Focus has to travel with the selection, or the ring stays behind on the
        // option the user just moved off.
        groupRef.current
            ?.querySelector<HTMLButtonElement>(`[data-choice="${next}"]`)
            ?.focus();
    };

    return (
        <div
            ref={groupRef}
            role="radiogroup"
            aria-label="Color theme"
            onKeyDown={onKeyDown}
            className={cn(
                "border-border inline-flex items-center gap-0.5 rounded-md border p-0.5",
                className,
            )}
        >
            {THEME_CHOICES.map((option) => {
                const Glyph = ICONS[option];
                const selected = ready && option === choice;

                return (
                    <button
                        key={option}
                        type="button"
                        role="radio"
                        data-choice={option}
                        aria-checked={selected}
                        aria-label={themeChoiceLabel(option)}
                        title={themeChoiceLabel(option)}
                        tabIndex={option === choice ? 0 : -1}
                        onClick={() => select(option)}
                        className={cn(
                            "transition-state grid size-7 place-items-center rounded-sm",
                            "active:translate-y-px",
                            selected
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                    >
                        <Glyph aria-hidden className="size-4" />
                    </button>
                );
            })}
        </div>
    );
};
