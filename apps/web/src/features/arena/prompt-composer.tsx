import { useEffect, useRef, useState } from "react";
import { IconArrowUp, IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";

const MAX_HEIGHT_PX = 240;

export const PromptComposer = ({
    onSubmit,
    onAddModel,
    canAddModel = true,
}: {
    readonly onSubmit: (prompt: string) => void;
    readonly onAddModel: () => void;
    readonly canAddModel?: boolean;
}) => {
    const [draft, setDraft] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;

        el.style.height = "auto";
        el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    }, [draft]);

    const trimmed = draft.trim();
    const canSubmit = trimmed.length > 0;

    const submit = () => {
        if (!canSubmit) return;
        onSubmit(trimmed);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            submit();
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
                className="text-foreground min-h-22 w-full resize-none bg-transparent text-sm leading-relaxed focus-visible:outline-none"
            />

            <div className="mt-2 flex items-center justify-between gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddModel}
                    disabled={!canAddModel}
                    title={
                        canAddModel
                            ? undefined
                            : "Three models is the maximum for one thread."
                    }
                >
                    <IconPlus aria-hidden stroke={1.75} />
                    Add model
                </Button>

                <Button
                    variant="primary"
                    size="icon"
                    onClick={submit}
                    disabled={!canSubmit}
                    aria-label="Send prompt"
                    className="size-10 [&>svg]:size-5"
                >
                    <IconArrowUp aria-hidden stroke={2} />
                </Button>
            </div>
        </div>
    );
};

const cnComposer =
    "transition-state rounded-xl border border-input bg-card p-3 " +
    "focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 " +
    "focus-within:[outline-color:var(--ring)]";
