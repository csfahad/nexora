import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
    IconAlertTriangle,
    IconArrowRight,
    IconCode,
    IconBulb,
    IconPencil,
    IconX,
} from "@tabler/icons-react";
import { ComparisonMark } from "@/components/ui/comparison-mark";
import { ModelAvatar } from "@/components/ui/model-avatar";
import type { CatalogModel } from "@/infrastructure/model-catalog";
import { SESSION_UNAVAILABLE, useSessionState } from "@/infrastructure/session";
import { useAllowance } from "@/infrastructure/entitlement";
import { defaultTrio } from "./default-trio";
import { ModelPicker } from "./model-picker";
import { PromptComposer } from "./prompt-composer";
import { canSend } from "./send-cost";

const STARTERS = [
    {
        label: "Solve a coding problem",
        icon: IconCode,
        prompt: "Write a TypeScript function that groups an array of objects by a given key. Explain the tradeoffs and include an example.",
    },
    {
        label: "Explain something complex",
        icon: IconBulb,
        prompt: "Explain how large language models reason, where they tend to fail, and how to evaluate their answers. Use a concrete example.",
    },
    {
        label: "Find the right words",
        icon: IconPencil,
        prompt: "Help me write a short, clear introduction for a developer tool that compares AI models side by side. Give me three different approaches.",
    },
] as const;

export const ArenaScreen = ({
    models,
    onSubmit,
    notice = null,
}: {
    readonly models: readonly CatalogModel[];
    readonly onSubmit: (
        prompt: string,
        modelIds: readonly string[],
    ) => Promise<boolean> | boolean;
    readonly notice?: string | null;
}) => {
    const session = useSessionState();
    const allowance = useAllowance();
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState<readonly string[]>(() =>
        defaultTrio(models, undefined, (model) => canSend(allowance, model)).map(
            (model) => model.id,
        ),
    );
    const [sending, setSending] = useState(false);
    const [suggestion, setSuggestion] =
        useState<Readonly<{ text: string; id: number }>>();
    const selected = selectedIds.flatMap((id) => {
        const model = models.find((candidate) => candidate.id === id);
        return model ? [model] : [];
    });
    const submit = async (prompt: string): Promise<boolean> => {
        if (session.status !== "signed-in") {
            void navigate({ to: "/sign-in", search: { next: "/" } });
            return false;
        }
        setSending(true);
        try {
            return await onSubmit(prompt, selectedIds);
        } finally {
            setSending(false);
        }
    };
    return (
        <div className="screen screen-scroll">
            <div className="arena-layout">
                <div className="arena-intro">
                    <ComparisonMark />
                    <h1>
                        Your prompt.
                        <br />
                        <span>Three perspectives.</span>
                    </h1>
                    <p>
                        Compare AI models side by side. See how they think, measure what
                        matters, and choose your winner.
                    </p>
                </div>
                <div className="arena-workbench">
                    <PromptComposer
                        onSubmit={submit}
                        busy={sending}
                        disabled={selectedIds.length === 0}
                        suggestion={suggestion}
                        showSendLabel
                        controls={
                            <ModelPicker
                                models={models}
                                selectedIds={selectedIds}
                                onChange={setSelectedIds}
                            />
                        }
                    />
                    {selected.length > 0 && (
                        <ul className="arena-lineup" aria-label="Selected models">
                            {selected.map((model) => (
                                <li key={model.id} className="arena-model">
                                    <ModelAvatar
                                        modelId={model.id}
                                        provider={model.provider}
                                        name={model.name}
                                        size="sm"
                                    />
                                    <span title={model.name}>{model.name}</span>
                                    <button
                                        type="button"
                                        aria-label={`Remove ${model.name}`}
                                        onClick={() =>
                                            setSelectedIds((ids) =>
                                                ids.filter((id) => id !== model.id),
                                            )
                                        }
                                    >
                                        <IconX aria-hidden stroke={1.75} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {selected.length === 0 && (
                        <p
                            role="status"
                            className="arena-notice text-muted-foreground text-center"
                        >
                            Choose at least one model to start comparing.
                        </p>
                    )}
                    {notice !== null && (
                        <p
                            role="alert"
                            className="arena-notice text-foreground flex items-start justify-center gap-2 text-center"
                        >
                            <IconAlertTriangle
                                aria-hidden
                                stroke={1.75}
                                className="text-destructive mt-0.5 size-4 shrink-0"
                            />
                            {notice}
                        </p>
                    )}
                    <div className="arena-suggestions" aria-label="Prompt ideas">
                        {STARTERS.map(({ label, icon: Icon, prompt }) => (
                            <button
                                key={label}
                                type="button"
                                className="prompt-suggestion"
                                onClick={() =>
                                    setSuggestion((previous) => ({
                                        text: prompt,
                                        id: (previous?.id ?? 0) + 1,
                                    }))
                                }
                            >
                                <Icon aria-hidden stroke={1.75} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="arena-footer">
                    {session.status === "signed-out" ? (
                        <>
                            <Link
                                to="/sign-in"
                                search={{ next: "/" }}
                                className="inline-flex items-center gap-1 font-medium"
                            >
                                Sign in to compare{" "}
                                <IconArrowRight aria-hidden className="size-3.5" />
                            </Link>
                            <span>
                                Free models available. Your threads and votes, saved.
                            </span>
                        </>
                    ) : (
                        <span>
                            One prompt. Independent answers. Real speed, tokens, and cost.
                        </span>
                    )}
                </div>
                {session.status === "unavailable" && (
                    <p
                        role="alert"
                        className="arena-notice text-foreground flex items-start gap-2 text-sm"
                    >
                        <IconAlertTriangle
                            aria-hidden
                            stroke={1.75}
                            className="text-destructive mt-0.5 size-4 shrink-0"
                        />
                        {SESSION_UNAVAILABLE}
                    </p>
                )}
            </div>
        </div>
    );
};
