import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { IconArrowUp, IconPlayerStopFilled } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

const MAX_HEIGHT_PX = 180;
const draftStorageKey = (key: string): string => `nexora:draft:${key}`;

export const PromptComposer = ({
    onSubmit,
    controls,
    busy = false,
    disabled = false,
    draftKey = "arena",
    onStop,
    suggestion,
    showSendLabel = false,
}: {
    readonly onSubmit: (prompt: string) => boolean | Promise<boolean>;
    readonly controls?: ReactNode;
    readonly busy?: boolean;
    readonly disabled?: boolean;
    readonly draftKey?: string;
    readonly onStop?: () => void;
    readonly suggestion?: Readonly<{ text: string; id: number }>;
    readonly showSendLabel?: boolean;
}) => {
    const [draft, setDraft] = useState("");
    const [restoredKey, setRestoredKey] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const submitting = useRef(false);
    const storageKey = draftStorageKey(draftKey);
    useEffect(() => {
        try {
            setDraft(window.sessionStorage.getItem(storageKey) ?? "");
        } catch {
            setDraft("");
        }
        setRestoredKey(storageKey);
    }, [storageKey]);
    useEffect(() => {
        if (restoredKey !== storageKey) return;
        try {
            if (draft.length === 0) window.sessionStorage.removeItem(storageKey);
            else window.sessionStorage.setItem(storageKey, draft);
        } catch {}
    }, [draft, storageKey, restoredKey]);
    useEffect(() => {
        if (!suggestion) return;
        setDraft(suggestion.text);
        textareaRef.current?.focus();
    }, [suggestion]);
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [draft, showSendLabel]);
    const trimmed = draft.trim();
    const canSubmit = trimmed.length > 0 && !busy && !disabled;
    const submit = async () => {
        if (!canSubmit || submitting.current) return;
        submitting.current = true;
        try {
            if (await onSubmit(trimmed)) {
                setDraft((current) => (current.trim() === trimmed ? "" : current));
            }
        } finally {
            submitting.current = false;
        }
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            void submit();
        }
    };
    return (
        <HoverBorderGradient>
            <div
                className={
                    showSendLabel
                        ? "prompt-composer"
                        : "prompt-composer prompt-composer--follow-up"
                }
            >
                <label htmlFor="arena-prompt" className="sr-only">
                    Prompt
                </label>
                <textarea
                    id="arena-prompt"
                    name="prompt"
                    autoComplete="off"
                    ref={textareaRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={showSendLabel ? 2 : 1}
                    placeholder={
                        showSendLabel
                            ? "What would you like to compare?"
                            : "Ask a follow-up…"
                    }
                    aria-describedby="composer-keyboard-hint"
                />
                <div className="composer-toolbar">
                    {controls ?? <span />}
                    <span id="composer-keyboard-hint" className="composer-hint">
                        Enter to send · Shift + Enter for a new line
                    </span>
                    {onStop === undefined ? (
                        <Button
                            variant="primary"
                            size={showSendLabel ? "md" : "icon"}
                            className={showSendLabel ? "composer-send" : undefined}
                            onClick={() => void submit()}
                            disabled={!canSubmit}
                            loading={busy}
                            aria-label={showSendLabel ? "Compare models" : "Send prompt"}
                        >
                            {showSendLabel && <span>Compare</span>}
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
                            <IconPlayerStopFilled aria-hidden />
                        </Button>
                    )}
                </div>
            </div>
        </HoverBorderGradient>
    );
};
