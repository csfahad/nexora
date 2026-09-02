export type OrderedResponse = Readonly<{ modelId: string; modelName: string }>;

export const byModelName = (a: OrderedResponse, b: OrderedResponse): number =>
    a.modelName.localeCompare(b.modelName) || a.modelId.localeCompare(b.modelId);

export const latestAttempts = <T extends Readonly<{ modelId: string }>>(
    inCreationOrder: readonly T[],
): readonly T[] =>
    inCreationOrder.filter(
        (response, index) =>
            !inCreationOrder.some(
                (later, laterIndex) =>
                    laterIndex > index && later.modelId === response.modelId,
            ),
    );
