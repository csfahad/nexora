import type { ReactNode } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { createHighlighterCore } from "shiki/core";
import type { HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { CODE_THEME_NAME, codeTheme } from "./code-theme";
import type { Grammar } from "./code-languages";

const GRAMMARS: Readonly<Record<Grammar, () => Promise<unknown>>> = {
    typescript: () => import("@shikijs/langs/typescript"),
    tsx: () => import("@shikijs/langs/tsx"),
    javascript: () => import("@shikijs/langs/javascript"),
    jsx: () => import("@shikijs/langs/jsx"),
    python: () => import("@shikijs/langs/python"),
    json: () => import("@shikijs/langs/json"),
    shellscript: () => import("@shikijs/langs/shellscript"),
    sql: () => import("@shikijs/langs/sql"),
    css: () => import("@shikijs/langs/css"),
    html: () => import("@shikijs/langs/html"),
    markdown: () => import("@shikijs/langs/markdown"),
    go: () => import("@shikijs/langs/go"),
    rust: () => import("@shikijs/langs/rust"),
    java: () => import("@shikijs/langs/java"),
    c: () => import("@shikijs/langs/c"),
    cpp: () => import("@shikijs/langs/cpp"),
    csharp: () => import("@shikijs/langs/csharp"),
    php: () => import("@shikijs/langs/php"),
    ruby: () => import("@shikijs/langs/ruby"),
    swift: () => import("@shikijs/langs/swift"),
    kotlin: () => import("@shikijs/langs/kotlin"),
    yaml: () => import("@shikijs/langs/yaml"),
    toml: () => import("@shikijs/langs/toml"),
    prisma: () => import("@shikijs/langs/prisma"),
    diff: () => import("@shikijs/langs/diff"),
};

let core: Promise<HighlighterCore> | undefined;
const loaded = new Map<Grammar, Promise<void>>();

const highlighter = (): Promise<HighlighterCore> => {
    core ??= createHighlighterCore({
        themes: [codeTheme],
        langs: [],
        engine: createJavaScriptRegexEngine(),
    });
    return core;
};

const load = (instance: HighlighterCore, grammar: Grammar): Promise<void> => {
    const already = loaded.get(grammar);
    if (already) return already;

    const pending = GRAMMARS[grammar]().then(async (module) => {
        await instance.loadLanguage(
            (
                module as Readonly<{
                    default: Parameters<HighlighterCore["loadLanguage"]>[0];
                }>
            ).default,
        );
    });

    loaded.set(grammar, pending);
    return pending;
};

export const highlight = async (
    code: string,
    grammar: Grammar,
): Promise<ReactNode | null> => {
    const instance = await highlighter();
    await load(instance, grammar);

    const root = instance.codeToHast(code, { lang: grammar, theme: CODE_THEME_NAME });
    const pre = root.children.at(0);
    if (pre?.type !== "element") return null;

    const codeElement = pre.children.at(0);
    if (codeElement?.type !== "element") return null;

    return toJsxRuntime(
        { type: "root", children: codeElement.children },
        { Fragment, jsx, jsxs },
    );
};
