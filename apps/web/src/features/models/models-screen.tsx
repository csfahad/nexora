import { useDeferredValue, useMemo, useState } from "react";
import { IconSearch, IconStack2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { EmptyState } from "@/components/ui/empty-state";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { PageHeading } from "@/components/ui/page-heading";
import { TierChip } from "@/components/ui/tier-chip";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewOption } from "@/components/ui/view-toggle";
import {
    isFreeModel,
    REFERENCE_PROMPT_TOKENS,
    REFERENCE_COMPLETION_TOKENS,
} from "@/infrastructure/model-catalog";
import type { CatalogModel } from "@/infrastructure/model-catalog";

type Tab = "free" | "paid";
const TABS: readonly ViewOption<Tab>[] = [
    { value: "free", label: "Free models", panelId: "models-free" },
    { value: "paid", label: "Paid models", panelId: "models-paid" },
];
const byContext = (a: CatalogModel, b: CatalogModel): number =>
    b.contextLength - a.contextLength || a.name.localeCompare(b.name);
const byCost = (a: CatalogModel, b: CatalogModel): number =>
    a.referenceAnswerCostUsd - b.referenceAnswerCostUsd || a.name.localeCompare(b.name);
const matches = (model: CatalogModel, query: string): boolean => {
    const needle = query.trim().toLowerCase();
    return (
        needle.length === 0 ||
        [model.name, model.provider, model.id].some((value) =>
            value.toLowerCase().includes(needle),
        )
    );
};

export const ModelsScreen = ({
    models,
}: {
    readonly models: readonly CatalogModel[];
}) => {
    const [tab, setTab] = useState<Tab>("free");
    const [query, setQuery] = useState("");
    const deferredQuery = useDeferredValue(query);
    const { free, paid } = useMemo(
        () => ({
            free: models.filter(isFreeModel),
            paid: models.filter((model) => !isFreeModel(model)),
        }),
        [models],
    );
    const shown = useMemo(
        () =>
            (tab === "free" ? free : paid)
                .filter((model) => matches(model, deferredQuery))
                .sort(tab === "free" ? byContext : byCost),
        [tab, free, paid, deferredQuery],
    );
    const total = tab === "free" ? free.length : paid.length;
    const filtered = deferredQuery.trim().length > 0;
    return (
        <div className="screen screen-scroll">
            <div className="page-content">
                <PageHeading
                    title="Find your next model."
                    description="Explore the live catalog. Compare context, capabilities, and price before you choose your lineup."
                >
                    <span className="catalog-count">
                        <IconStack2 aria-hidden stroke={1.75} />
                        <span className="numeric">{models.length}</span> models in the
                        catalog
                    </span>
                </PageHeading>
                <div className="page-toolbar">
                    <ViewToggle
                        options={TABS}
                        value={tab}
                        onChange={setTab}
                        label="Catalog"
                    />
                    <div className="search-field">
                        <IconSearch aria-hidden stroke={1.75} />
                        <label htmlFor="catalog-search" className="sr-only">
                            Search models by name, provider, or ID
                        </label>
                        <input
                            id="catalog-search"
                            name="model-search"
                            autoComplete="off"
                            type="search"
                            value={query}
                            maxLength={200}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search models…"
                            className="field-input field-input--icon"
                        />
                    </div>
                </div>
                <div className="catalog-summary">
                    <p className="label-meta" aria-live="polite">
                        <span className="numeric">{shown.length}</span>
                        {filtered ? ` of ${total} models shown` : " models available"}
                    </p>
                    <span className="label-meta">
                        {tab === "free"
                            ? "Largest context first"
                            : "Lowest reference cost first"}
                    </span>
                </div>
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
                                <EmptyState
                                    icon={IconSearch}
                                    title={
                                        filtered
                                            ? "No matching models"
                                            : "No models available"
                                    }
                                    description={
                                        filtered
                                            ? "Try a shorter name or a different provider."
                                            : "The live catalog has no models in this group right now."
                                    }
                                >
                                    {filtered && (
                                        <Button
                                            variant="outline"
                                            className="mt-5"
                                            onClick={() => setQuery("")}
                                        >
                                            Clear search
                                        </Button>
                                    )}
                                </EmptyState>
                            ) : (
                                <ul className="model-grid list-none">
                                    {shown.map((model) => (
                                        <li key={model.id}>
                                            <ModelCard model={model} />
                                        </li>
                                    ))}
                                </ul>
                            ))}
                    </div>
                ))}
                <p className="catalog-footnote">
                    Reference answer prices use{" "}
                    {REFERENCE_PROMPT_TOKENS.toLocaleString("en-US")} input and{" "}
                    {REFERENCE_COMPLETION_TOKENS.toLocaleString("en-US")} output tokens.
                    Actual cost is measured on each answer. Models marked “Not in arena”
                    exceed the arena’s price ceiling.
                </p>
            </div>
        </div>
    );
};

const ModelCard = ({ model }: { readonly model: CatalogModel }) => (
    <CardSpotlight className="model-card">
        <div className="model-card-head">
            <ModelAvatar
                modelId={model.id}
                provider={model.provider}
                name={model.name}
                size="md"
            />
            <div className="model-card-info">
                <h2>{model.name}</h2>
                <p className="model-provider">{model.provider}</p>
            </div>
            <TierChip tier={model.tier} />
        </div>
        <dl>
            <DetailRow
                label="Context window"
                value={
                    model.contextLength > 0
                        ? `${model.contextLabel} tokens`
                        : "Not reported"
                }
                numeric={model.contextLength > 0}
            />
            <DetailRow label="Accepts" value={model.inputsLabel} />
            <DetailRow
                label="Reference answer"
                value={model.referenceAnswerCostLabel}
                numeric
            />
        </dl>
        <p className="price-pair">
            <span className="price-value numeric">{model.promptPricePerMTokens}</span> in{" "}
            <span className="price-value numeric">{model.completionPricePerMTokens}</span>{" "}
            out / 1M tokens
        </p>
    </CardSpotlight>
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
    <div className="model-detail">
        <dt className="label-meta">{label}</dt>
        <dd className={numeric ? "numeric" : undefined}>{value}</dd>
    </div>
);
