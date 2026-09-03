import { ModelAvatar } from "@/components/ui/model-avatar";
import type { CatalogModel } from "@/infrastructure/model-catalog";

export const ModelsScreen = ({
    models,
}: {
    readonly models: readonly CatalogModel[];
}) => (
    <div className="screen screen-scroll">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold">Models</h1>
                <p className="text-muted-foreground">
                    Every model Nexora can put in the arena — all free tier, all measured
                    the same way.
                </p>
                <p className="label-meta mt-1">
                    <span className="numeric">{models.length}</span> available now
                </p>
            </header>

            <ul className="mt-8 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {models.map((model) => (
                    <li key={model.id}>
                        <ModelCard model={model} />
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const ModelCard = ({ model }: { readonly model: CatalogModel }) => (
    <article className="border-border bg-card flex h-full flex-col rounded-xl border p-5">
        <div className="flex items-center gap-3">
            <ModelAvatar name={model.name} size="md" />
            <div className="min-w-0">
                <h2 className="font-heading text-foreground truncate text-base font-semibold">
                    {model.name}
                </h2>
                <p className="text-muted-foreground truncate text-sm">{model.provider}</p>
            </div>
        </div>

        <dl className="border-border mt-4 flex flex-col gap-2.5 border-t pt-4">
            <DetailRow
                label="Context"
                value={
                    model.contextLength > 0
                        ? `${model.contextLabel} tokens`
                        : "Not reported"
                }
                numeric={model.contextLength > 0}
            />
            <DetailRow label="Inputs" value={model.inputsLabel} />
            <DetailRow label="Price / 1M tokens" value={model.pricePerMTokens} numeric />
        </dl>
    </article>
);

const DetailRow = ({
    label,
    value,
    numeric = false,
}: {
    readonly label: string;
    readonly value: string;
    readonly numeric?: boolean;
}) => (
    <div className="flex items-center justify-between gap-3">
        <dt className="label-meta">{label}</dt>
        <dd className={`text-foreground text-sm ${numeric ? "numeric" : ""}`}>{value}</dd>
    </div>
);
