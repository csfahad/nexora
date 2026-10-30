import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import type { TablerIcon } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { THEME_CHOICES, isThemeChoice, themeChoiceLabel } from "./theme";
import type { ThemeChoice } from "./theme";
import { useTheme } from "./use-theme";

const ICONS: Readonly<Record<ThemeChoice, TablerIcon>> = {
    system: IconDeviceDesktop,
    light: IconSun,
    dark: IconMoon,
};

const labelFor = (choice: ThemeChoice) =>
    choice === "system" ? "System" : themeChoiceLabel(choice);

export const ThemeMenu = ({ side = "top" }: { readonly side?: "top" | "bottom" }) => {
    const { choice, ready, select } = useTheme();
    const Icon = ICONS[choice];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Choose theme"
                    title={`Theme: ${labelFor(choice)}`}
                    data-theme-choice={ready ? choice : undefined}
                >
                    <Icon aria-hidden stroke={1.75} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side={side} align="end" aria-label="Theme">
                <DropdownMenuRadioGroup
                    value={ready ? choice : undefined}
                    onValueChange={(value) => {
                        if (isThemeChoice(value)) select(value);
                    }}
                >
                    {THEME_CHOICES.map((option) => {
                        const Glyph = ICONS[option];
                        return (
                            <DropdownMenuRadioItem key={option} value={option}>
                                <Glyph aria-hidden className="size-4" stroke={1.75} />
                                {labelFor(option)}
                            </DropdownMenuRadioItem>
                        );
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
