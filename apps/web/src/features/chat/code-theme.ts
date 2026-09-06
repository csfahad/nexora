import type { ThemeRegistrationRaw } from "shiki/core";

export const CODE_THEME_NAME = "nexora";

const scoped = (scope: readonly string[], color: string) => ({
    scope: [...scope],
    settings: { foreground: color },
});

export const codeTheme: ThemeRegistrationRaw = {
    name: CODE_THEME_NAME,
    type: "dark",
    colors: {
        "editor.background": "var(--muted)",
        "editor.foreground": "var(--foreground)",
    },
    settings: [
        { settings: { foreground: "var(--foreground)" } },

        scoped(["comment", "punctuation.definition.comment"], "var(--muted-foreground)"),

        scoped(
            [
                "keyword",
                "keyword.control",
                "keyword.operator.new",
                "keyword.operator.expression",
                "storage",
                "storage.type",
                "storage.modifier",
                "constant.language",
                "variable.language",
                "support.type",
                "entity.name.type",
                "entity.name.class",
                "support.class",
                "entity.name.tag",
                "punctuation.definition.tag",
                "entity.name.section",
            ],
            "var(--code-keyword)",
        ),

        scoped(
            [
                "string",
                "string.quoted",
                "string.template",
                "constant.character",
                "constant.other.symbol",
                "punctuation.definition.string",
            ],
            "var(--code-string)",
        ),

        scoped(["constant.numeric"], "var(--code-number)"),

        scoped(
            [
                "entity.name.function",
                "support.function",
                "variable.function",
                "meta.function-call.generic",
            ],
            "var(--code-function)",
        ),
    ],
};
