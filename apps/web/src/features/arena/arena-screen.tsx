import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { IconAlertTriangle } from "@tabler/icons-react";
import type { CatalogModel } from "@/infrastructure/model-catalog";
import { SESSION_UNAVAILABLE, useSessionState } from "@/infrastructure/session";
import { defaultTrio } from "./default-trio";
import { ModelPicker } from "./model-picker";
import { PromptComposer } from "./prompt-composer";

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
    const [selectedIds, setSelectedIds] = useState<readonly string[]>(() =>
        defaultTrio(models).map((model) => model.id),
    );
    const [sending, setSending] = useState(false);
    const session = useSessionState();
    const navigate = useNavigate();

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
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center gap-8 px-4 py-10">
                <div className="flex flex-col gap-3 text-center">
                    <h1 className="text-balance text-3xl font-semibold">
                        Put three models to the test.
                    </h1>
                    <p className="text-muted-foreground text-pretty text-base">
                        Send one prompt, watch them answer side by side, and vote for the
                        best — with every answer&rsquo;s real speed and token count in
                        view.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <PromptComposer
                        onSubmit={submit}
                        busy={sending}
                        controls={
                            <ModelPicker
                                models={models}
                                selectedIds={selectedIds}
                                onChange={setSelectedIds}
                            />
                        }
                    />

                    {notice !== null && (
                        <p
                            role="alert"
                            className="text-foreground flex items-start justify-center gap-2 text-pretty text-center text-sm"
                        >
                            <IconAlertTriangle
                                aria-hidden
                                stroke={1.75}
                                className="text-destructive mt-0.5 size-4 shrink-0"
                            />
                            {notice}
                        </p>
                    )}

                    {session.status === "signed-out" && (
                        <p className="text-muted-foreground text-pretty text-center text-sm">
                            <Link
                                to="/sign-in"
                                search={{ next: "/" }}
                                className="text-primary font-medium underline underline-offset-2"
                            >
                                Sign in
                            </Link>{" "}
                            to send a prompt. Your threads and votes are saved to your
                            account.
                        </p>
                    )}

                    {session.status === "unavailable" && (
                        <p
                            role="alert"
                            className="text-foreground flex items-start justify-center gap-2 text-pretty text-sm"
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
        </div>
    );
};
