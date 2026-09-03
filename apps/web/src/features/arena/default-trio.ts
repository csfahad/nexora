import { MAX_ARENA_MODELS } from "@/infrastructure/model-catalog";
import type { CatalogModel } from "@/infrastructure/model-catalog";

export const defaultTrio = (
    catalog: readonly CatalogModel[],
    limit: number = MAX_ARENA_MODELS,
): readonly CatalogModel[] => {
    const walk = catalog.reduce<{
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
    );

    return walk.picked.length === limit ? walk.picked : catalog.slice(0, limit);
};
