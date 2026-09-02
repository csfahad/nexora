import { ModelAvatar } from "@/components/ui/model-avatar";

export type StackedModel = Readonly<{ id: string; name: string }>;

export const ModelStack = ({ models }: { readonly models: readonly StackedModel[] }) => (
    <>
        <span aria-hidden className="model-stack">
            {models.map((model) => (
                <ModelAvatar key={model.id} name={model.name} size="sm" />
            ))}
        </span>

        <span className="truncate">
            {models.length} {models.length === 1 ? "model" : "models"}
        </span>
    </>
);
