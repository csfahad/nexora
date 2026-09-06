import { Children, isValidElement, memo } from "react";
import type { ReactNode } from "react";
import Markdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { closeOpenMarkers } from "./close-open-markers";
import { CodeBlock, CodeStreamingProvider } from "./code-block";

const LANGUAGE = /language-([\w+#.-]+)/;

const textOf = (node: ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(textOf).join("");

    return isValidElement<{ readonly children?: ReactNode }>(node)
        ? textOf(node.props.children)
        : "";
};

const fenceOf = (
    children: ReactNode,
): Readonly<{ language: string | null; code: string }> => {
    const first = Children.toArray(children)[0];

    if (
        !isValidElement<{ readonly className?: string; readonly children?: ReactNode }>(
            first,
        )
    ) {
        return { language: null, code: textOf(children) };
    }

    return {
        language: LANGUAGE.exec(first.props.className ?? "")?.[1] ?? null,
        code: textOf(first.props.children).replace(/\n$/, ""),
    };
};

const components: Components = {
    pre: ({ children }) => <CodeBlock {...fenceOf(children)} />,

    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noreferrer noopener">
            {children}
        </a>
    ),

    img: ({ src, alt }) => (
        <a
            href={typeof src === "string" ? src : undefined}
            target="_blank"
            rel="noreferrer noopener"
        >
            {alt !== undefined && alt.length > 0 ? alt : "image"}
        </a>
    ),

    table: ({ children }) => (
        <div className="max-w-full overflow-x-auto">
            <table>{children}</table>
        </div>
    ),
};

const PLUGINS = [remarkGfm];

export const AnswerMarkdown = memo(
    ({ text, streaming }: { readonly text: string; readonly streaming: boolean }) => (
        <div className="md-answer prose prose-sm max-w-none">
            <CodeStreamingProvider streaming={streaming}>
                <Markdown remarkPlugins={PLUGINS} components={components}>
                    {streaming ? closeOpenMarkers(text) : text}
                </Markdown>
            </CodeStreamingProvider>
        </div>
    ),
);

AnswerMarkdown.displayName = "AnswerMarkdown";
