export const THEMES = ["dark", "light"] as const;

export type Theme = (typeof THEMES)[number];

/** What the user picked. `system` means "follow the OS", which is the default. */
export const THEME_CHOICES = ["system", ...THEMES] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];

export const THEME_STORAGE_KEY = "nexora-theme";

export const isThemeChoice = (value: unknown): value is ThemeChoice =>
    typeof value === "string" && (THEME_CHOICES as readonly string[]).includes(value);

/** Dark is the product default, so an unknown OS preference resolves to dark. */
export const resolveTheme = (choice: ThemeChoice, prefersLight: boolean): Theme =>
    choice === "system" ? (prefersLight ? "light" : "dark") : choice;

export const nextChoice = (choice: ThemeChoice): ThemeChoice =>
    choice === "system" ? "light" : choice === "light" ? "dark" : "system";

export const themeChoiceLabel = (choice: ThemeChoice): string =>
    choice === "system" ? "System theme" : choice === "light" ? "Light" : "Dark";
