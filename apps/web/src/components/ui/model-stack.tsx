import { ModelAvatar } from "@/components/ui/model-avatar";

export type StackedModel = Readonly<{ id: string; name: string }>;

export const ModelStack = ({
    models,
    label,
}: {
    readonly models: readonly StackedModel[];
    readonly label?: string;
}) => (
    <>
        <span aria-hidden className="model-stack">
            {models.map((model) => (
                <ModelAvatar
                    key={model.id}
                    modelId={model.id}
                    name={model.name}
                    size="sm"
                />
            ))}
        </span>

        <span className="truncate">
            {label ?? `${models.length} ${models.length === 1 ? "model" : "models"}`}
        </span>
    </>
);
