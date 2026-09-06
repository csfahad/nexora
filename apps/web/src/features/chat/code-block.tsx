import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { grammarFor } from "./code-languages";

const StreamingContext = createContext(false);

export const CodeStreamingProvider = ({
    streaming,
    children,
}: {
    readonly streaming: boolean;
    readonly children: ReactNode;
}) => <StreamingContext.Provider value={streaming}>{children}</StreamingContext.Provider>;

export const CodeBlock = ({
    language,
    code,
}: {
    readonly language: string | null;
    readonly code: string;
}) => {
    const streaming = useContext(StreamingContext);
    const [coloured, setColoured] = useState<ReactNode | null>(null);
    const grammar = grammarFor(language);

    useEffect(() => {
        if (streaming || grammar === null) return;

        let live = true;

        import("./code-highlighter")
            .then(async ({ highlight }) => {
                const node = await highlight(code, grammar);
                if (live) setColoured(node);
            })
            .catch((error: unknown) => {
                console.error("[chat] could not highlight a code block:", error);
            });

        return () => {
            live = false;
        };
    }, [code, grammar, streaming]);

    return (
        <div className="code-block">
            <div className="code-bar">
                <span className="label-meta">{language ?? "code"}</span>
                <CopyButton text={code} label="Copy code" />
            </div>
            <pre className="code-body">
                <code>{coloured ?? code}</code>
            </pre>
        </div>
    );
};
