import { useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { TierChip } from "@/components/ui/tier-chip";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewOption } from "@/components/ui/view-toggle";
import { isFreeModel } from "@/infrastructure/model-catalog";
import type { CatalogModel } from "@/infrastructure/model-catalog";

type Tab = "free" | "paid";

const TABS: readonly ViewOption<Tab>[] = [
    { value: "free", label: "Free", panelId: "models-free" },
    { value: "paid", label: "Paid", panelId: "models-paid" },
];

const byContext = (a: CatalogModel, b: CatalogModel): number =>
    b.contextLength - a.contextLength || a.name.localeCompare(b.name);

const byCost = (a: CatalogModel, b: CatalogModel): number =>
    a.referenceAnswerCostUsd - b.referenceAnswerCostUsd || a.name.localeCompare(b.name);

const matches = (model: CatalogModel, query: string): boolean => {
    const needle = query.trim().toLowerCase();

    if (needle.length === 0) return true;

    return (
        model.name.toLowerCase().includes(needle) ||
        model.provider.toLowerCase().includes(needle) ||
        model.id.toLowerCase().includes(needle)
    );
};

export const ModelsScreen = ({
    models,
}: {
    readonly models: readonly CatalogModel[];
}) => {
    const [tab, setTab] = useState<Tab>("free");
    const [query, setQuery] = useState("");

    const { free, paid } = useMemo(
        () => ({
            free: models.filter(isFreeModel),
            paid: models.filter((model) => !isFreeModel(model)),
        }),
        [models],
    );

    const shown = useMemo(() => {
        const pool = tab === "free" ? free : paid;

        return pool
            .filter((model) => matches(model, query))
            .sort(tab === "free" ? byContext : byCost);
    }, [tab, free, paid, query]);

    const total = tab === "free" ? free.length : paid.length;
    const filtered = query.trim().length > 0;

    return (
        <div className="screen screen-scroll">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold">Models</h1>
                    <p className="text-muted-foreground">
                        Every model Nexora can price and measure, free and paid, measured
                        the same way.
                    </p>
                </header>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <ViewToggle
                        options={TABS}
                        value={tab}
                        onChange={(next) => setTab(next)}
                        label="Catalog"
                    />

                    <div className="relative w-full sm:max-w-72">
                        <IconSearch
                            className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2"
                            aria-hidden
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Filter by name or provider"
                            aria-label="Filter models by name or provider"
                            className="field-input field-input--icon"
                        />
                    </div>
                </div>

                <p className="label-meta mt-4" aria-live="polite">
                    <span className="numeric">{shown.length}</span>
                    {filtered ? ` of ${total} shown` : " available now"}
                </p>

                {TABS.map((option) => (
                    <div
                        key={option.value}
                        id={option.panelId}
                        role="tabpanel"
                        aria-labelledby={`${option.panelId}-tab`}
                        hidden={option.value !== tab}
                    >
                        {option.value === tab &&
                            (shown.length === 0 ? (
                                <p className="text-muted-foreground mt-8 text-sm">
                                    {filtered
                                        ? "No model here matches that. Try a shorter search."
                                        : "No models on this tab right now."}
                                </p>
                            ) : (
                                <ul className="mt-6 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {shown.map((model) => (
                                        <li key={model.id}>
                                            <ModelCard model={model} />
                                        </li>
                                    ))}
                                </ul>
                            ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

const ModelCard = ({ model }: { readonly model: CatalogModel }) => (
    <article className="border-border bg-card flex h-full flex-col rounded-xl border p-5">
        <div className="flex items-start gap-3">
            <ModelAvatar name={model.name} size="md" />
            <div className="min-w-0 flex-1">
                <h2 className="font-heading text-foreground truncate text-base font-semibold">
                    {model.name}
                </h2>
                <p className="text-muted-foreground truncate text-sm">{model.provider}</p>
            </div>
            <TierChip tier={model.tier} />
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
            <DetailRow
                label="Per answer"
                value={model.referenceAnswerCostLabel}
                numeric
            />
        </dl>

        <p className="price-pair mt-2.5">
            <span className="price-value numeric">{model.promptPricePerMTokens}</span> in
            <span className="price-value numeric">
                {model.completionPricePerMTokens}
            </span>{" "}
            out / 1M
        </p>
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
