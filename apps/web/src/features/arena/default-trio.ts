import { MAX_ARENA_MODELS } from "@/infrastructure/model-catalog";
import type { CatalogModel } from "@/infrastructure/model-catalog";

export const defaultTrio = (
    catalog: readonly CatalogModel[],
    limit: number = MAX_ARENA_MODELS,
    affordable: (model: CatalogModel) => boolean = () => true,
): readonly CatalogModel[] => {
    const walkOf = (models: readonly CatalogModel[]) =>
        models.reduce<{
            readonly picked: readonly CatalogModel[];
            readonly providers: readonly string[];
        }>(
            (acc, model) => {
                if (acc.picked.length >= limit) return acc;

                const provider = model.provider.trim().toLowerCase();
                if (acc.providers.includes(provider)) return acc;

                return {
                    picked: [...acc.picked, model],
                    providers: [...acc.providers, provider],
                };
            },
            { picked: [], providers: [] },
        ).picked;

    const sendable = catalog.filter(affordable);
    const preferred = walkOf(sendable);

    if (preferred.length === limit) return preferred;
    if (sendable.length >= limit) return sendable.slice(0, limit);

    const any = walkOf(catalog);

    return any.length === limit ? any : catalog.slice(0, limit);
};
