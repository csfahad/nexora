import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { MAX_ARENA_MODELS } from "@/infrastructure/model-catalog";
import type { CatalogModel } from "@/infrastructure/model-catalog";
import type { AllowanceView } from "@/infrastructure/entitlement";
import { defaultTrio } from "./default-trio";
import { canSend } from "./send-cost";

const useLayoutEffectSafely = typeof window === "undefined" ? useEffect : useLayoutEffect;

type Selection = Readonly<{ scope: string | null; ids: readonly string[] }>;

const storageKey = (scope: string): string => `nexora:arena-models:${scope}`;

const readSelection = (scope: string | null): readonly string[] | undefined => {
    if (scope === null) return undefined;
    try {
        const raw = window.localStorage.getItem(storageKey(scope));
        if (raw === null) return undefined;
        const value: unknown = JSON.parse(raw);
        if (
            Array.isArray(value) &&
            value.length <= MAX_ARENA_MODELS &&
            value.every(
                (id: unknown): id is string =>
                    typeof id === "string" && id.trim().length > 0,
            )
        )
            return value;
    } catch {}
    return undefined;
};

const availableIds = (
    ids: readonly string[],
    models: readonly CatalogModel[],
): readonly string[] =>
    [...new Set(ids)]
        .filter((id) => models.some((model) => model.id === id))
        .slice(0, MAX_ARENA_MODELS);

export const useModelSelection = (
    models: readonly CatalogModel[],
    allowance: AllowanceView,
    scope: string | null,
    initialSelectedIds?: readonly string[],
): readonly [readonly string[], (ids: readonly string[]) => void] => {
    const [selection, setSelection] = useState<Selection | null>(null);
    const defaults = useMemo(
        () =>
            initialSelectedIds ??
            defaultTrio(models, undefined, (model) => canSend(allowance, model)).map(
                (model) => model.id,
            ),
        [allowance, initialSelectedIds, models],
    );

    useLayoutEffectSafely(() => {
        if (selection?.scope === scope) return;
        setSelection({
            scope,
            ids: initialSelectedIds ?? readSelection(scope) ?? defaults,
        });
    }, [defaults, initialSelectedIds, scope, selection]);

    const selectedIds = useMemo(
        () => availableIds(selection?.scope === scope ? selection.ids : defaults, models),
        [defaults, models, scope, selection],
    );

    const select = (ids: readonly string[]): void => {
        const next = availableIds(ids, models);
        setSelection({ scope, ids: next });
        if (scope === null) return;
        try {
            window.localStorage.setItem(storageKey(scope), JSON.stringify(next));
        } catch {}
    };

    return [selectedIds, select];
};
