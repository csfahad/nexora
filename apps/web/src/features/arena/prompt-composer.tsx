import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { IconArrowUp, IconPlayerStopFilled } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const MAX_HEIGHT_PX = 120;

const draftStorageKey = (key: string): string => `nexora:draft:${key}`;

export const PromptComposer = ({
    onSubmit,
    controls,
    busy = false,
    draftKey = "arena",
    onStop,
}: {
    readonly onSubmit: (prompt: string) => boolean | Promise<boolean>;
    readonly controls?: ReactNode;
    readonly busy?: boolean;
    readonly draftKey?: string;
    readonly onStop?: () => void;
}) => {
    const [draft, setDraft] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const storageKey = draftStorageKey(draftKey);

    useEffect(() => {
        try {
            const saved = window.sessionStorage.getItem(storageKey);

            if (saved !== null && saved.length > 0) setDraft(saved);
        } catch {}
    }, [storageKey]);

    const persisted = useRef(false);

    useEffect(() => {
        if (!persisted.current) {
            persisted.current = true;

            return;
        }

        try {
            if (draft.length === 0) {
                window.sessionStorage.removeItem(storageKey);
            } else {
                window.sessionStorage.setItem(storageKey, draft);
            }
        } catch {}
    }, [draft, storageKey]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;

        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [draft]);

    const trimmed = draft.trim();
    const canSubmit = trimmed.length > 0 && !busy;

    const submit = async () => {
        if (!canSubmit) return;

        if (await onSubmit(trimmed)) setDraft("");
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submit();
        }
    };

    return (
        <div className={cnComposer}>
            <label htmlFor="arena-prompt" className="sr-only">
                Prompt
            </label>
            <textarea
                id="arena-prompt"
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask anything. Enter to send, Shift + Enter for a new line."
                className="text-foreground min-h-6 w-full resize-none bg-transparent text-sm leading-relaxed focus-visible:outline-none"
            />

            <div className="mt-1.5 flex items-center justify-between gap-2">
                {controls ?? <span />}

                {onStop === undefined ? (
                    <Button
                        variant="primary"
                        size="icon"
                        onClick={() => void submit()}
                        disabled={!canSubmit}
                        loading={busy}
                        aria-label="Send prompt"
                    >
                        <IconArrowUp aria-hidden stroke={2} />
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onStop}
                        aria-label="Stop answering"
                        className="[&>svg]:size-3.5"
                    >
                        <IconPlayerStopFilled aria-hidden stroke={2} />
                    </Button>
                )}
            </div>
        </div>
    );
};

const cnComposer =
    "transition-state rounded-xl border border-input bg-card px-3 py-2.5 " +
    "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 " +
    "focus-within:[outline-color:var(--ring)]";
