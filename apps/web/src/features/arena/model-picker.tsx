import { useMemo, useRef, useState } from "react";
import { IconCheck, IconChevronDown, IconSearch } from "@tabler/icons-react";
import { buttonClasses } from "@/components/ui/button";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { ModelStack } from "@/components/ui/model-stack";
import { TierChip } from "@/components/ui/tier-chip";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { MAX_ARENA_MODELS } from "@/infrastructure/model-catalog";
import type { CatalogModel } from "@/infrastructure/model-catalog";
import { useAllowance } from "@/infrastructure/entitlement";
import { blockedReason, sendLabel } from "./send-cost";

const MODEL_QUERY_MAX_LENGTH = 200;

const matchesModel = (model: CatalogModel, query: string): boolean => {
    const needle = query.trim().toLocaleLowerCase();

    if (needle.length === 0) return true;

    return (
        model.name.toLocaleLowerCase().includes(needle) ||
        model.provider.toLocaleLowerCase().includes(needle) ||
        model.id.toLocaleLowerCase().includes(needle)
    );
};

export const ModelPicker = ({
    models,
    selectedIds,
    onChange,
}: {
    readonly models: readonly CatalogModel[];
    readonly selectedIds: readonly string[];
    readonly onChange: (ids: readonly string[]) => void;
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [query, setQuery] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const allowance = useAllowance();

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const selected = useMemo(
        () =>
            selectedIds
                .map((id) => models.find((model) => model.id === id))
                .filter((model): model is CatalogModel => model !== undefined),
        [models, selectedIds],
    );

    const available = useMemo(
        () =>
            models.filter(
                (model) => !selectedSet.has(model.id) && matchesModel(model, query),
            ),
        [models, query, selectedSet],
    );

    const visibleModels = useMemo(
        () => [...selected, ...available],
        [available, selected],
    );

    const atCap = selectedIds.length >= MAX_ARENA_MODELS;

    const toggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter((selectedId) => selectedId !== id));
            return;
        }

        if (atCap) return;
        onChange([...selectedIds, id]);
    };

    const focusRow = (index: number) => {
        if (visibleModels.length === 0) return;

        const nextIndex = Math.max(0, Math.min(index, visibleModels.length - 1));
        setActiveIndex(nextIndex);
        const row = rowRefs.current[nextIndex];
        row?.focus();
        row?.scrollIntoView({ block: "nearest" });
    };

    const move = (delta: number, from: number) =>
        focusRow((from + delta + visibleModels.length) % visibleModels.length);

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) => {
        switch (event.key) {
            case "ArrowDown":
            case "ArrowRight":
                event.preventDefault();
                move(1, index);
                break;
            case "ArrowUp":
            case "ArrowLeft":
                event.preventDefault();
                move(-1, index);
                break;
            case "Home":
                event.preventDefault();
                focusRow(0);
                break;
            case "End":
                event.preventDefault();
                focusRow(visibleModels.length - 1);
                break;
            default:
                break;
        }
    };

    const firstSelectedIndex = Math.max(
        0,
        visibleModels.findIndex((model) => selectedSet.has(model.id)),
    );
    const firstSearchIndex =
        query.trim().length > 0 && available.length > 0
            ? selected.length
            : firstSelectedIndex;
    const focusedIndex =
        visibleModels.length === 0 ? 0 : Math.min(activeIndex, visibleModels.length - 1);

    const description =
        selectedIds.length === 0
            ? "Choose at least one model to send."
            : atCap
              ? "Three selected. Remove one to swap."
              : `${selectedIds.length} of ${MAX_ARENA_MODELS} selected.`;

    return (
        <div className="flex min-w-0 flex-1 items-center gap-2">
            <Popover>
                <PopoverTrigger
                    className={cn(
                        buttonClasses({ variant: "outline", size: "sm" }),
                        "group/trigger min-w-0 max-w-full pl-1.5",
                    )}
                >
                    <ModelStack
                        models={selected}
                        label={
                            selected.length === 0
                                ? "Choose a model"
                                : sendLabel(allowance, selected)
                        }
                    />
                    <IconChevronDown
                        aria-hidden
                        stroke={1.75}
                        className="transition-state group-data-[state=open]/trigger:rotate-180"
                    />
                </PopoverTrigger>

                <PopoverContent
                    align="start"
                    className="w-[min(22rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
                    onOpenAutoFocus={(event) => {
                        event.preventDefault();
                        searchInputRef.current?.focus();
                        setActiveIndex(firstSelectedIndex);
                    }}
                    onCloseAutoFocus={() => {
                        setQuery("");
                        setActiveIndex(0);
                    }}
                >
                    <PopoverHeader className="border-border border-b px-4 py-3">
                        <PopoverTitle>Models</PopoverTitle>
                        <PopoverDescription>{description}</PopoverDescription>
                    </PopoverHeader>

                    <div className="border-border relative border-b px-3 py-2">
                        <IconSearch
                            aria-hidden
                            className="text-muted-foreground pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2"
                            stroke={1.75}
                        />
                        <label htmlFor="model-picker-search" className="sr-only">
                            Search models
                        </label>
                        <input
                            id="model-picker-search"
                            ref={searchInputRef}
                            type="search"
                            role="combobox"
                            aria-expanded="true"
                            aria-autocomplete="list"
                            aria-controls="model-picker-results"
                            aria-activedescendant={
                                visibleModels.length > 0
                                    ? modelOptionId(focusedIndex)
                                    : undefined
                            }
                            value={query}
                            maxLength={MODEL_QUERY_MAX_LENGTH}
                            onChange={(event) => {
                                const nextQuery = event.target.value;
                                const hasResults = models.some(
                                    (model) =>
                                        !selectedSet.has(model.id) &&
                                        matchesModel(model, nextQuery),
                                );

                                setQuery(nextQuery);
                                setActiveIndex(
                                    nextQuery.trim().length > 0 && hasResults
                                        ? selected.length
                                        : firstSelectedIndex,
                                );
                            }}
                            onKeyDown={(event) => {
                                if (visibleModels.length === 0) return;

                                if (event.key === "ArrowDown") {
                                    event.preventDefault();
                                    focusRow(firstSearchIndex);
                                } else if (event.key === "ArrowUp") {
                                    event.preventDefault();
                                    focusRow(visibleModels.length - 1);
                                } else if (event.key === "Enter") {
                                    event.preventDefault();
                                    const model = visibleModels.at(focusedIndex);
                                    if (model !== undefined) toggle(model.id);
                                }
                            }}
                            placeholder="Search by name, provider or ID"
                            className="field-input field-input--icon min-h-9"
                        />
                    </div>

                    {selected.length > 0 && (
                        <p className="label-meta border-border border-b px-3 pb-1 pt-2">
                            Selected
                        </p>
                    )}

                    <div
                        role="listbox"
                        aria-multiselectable
                        aria-label="Models in the arena"
                        id="model-picker-results"
                        className="max-h-72 overflow-y-auto p-1.5"
                    >
                        {visibleModels.map((model, index) => {
                            const isSelected = selectedSet.has(model.id);
                            const blocked = blockedReason(allowance, model);
                            const isBlocked = !isSelected && (atCap || blocked !== null);

                            return (
                                <button
                                    key={model.id}
                                    ref={(node) => {
                                        rowRefs.current[index] = node;
                                    }}
                                    type="button"
                                    role="option"
                                    id={modelOptionId(index)}
                                    aria-selected={isSelected}
                                    aria-disabled={isBlocked || undefined}
                                    tabIndex={index === focusedIndex ? 0 : -1}
                                    onClick={() => {
                                        if (blocked !== null && !isSelected) return;
                                        toggle(model.id);
                                    }}
                                    onKeyDown={(event) => handleKeyDown(event, index)}
                                    className={cn(
                                        cnRow,
                                        isSelected && "bg-accent",
                                        isBlocked
                                            ? "cursor-not-allowed opacity-45"
                                            : "hover:bg-accent",
                                    )}
                                >
                                    <ModelAvatar name={model.name} size="sm" />

                                    <span className="min-w-0 flex-1 text-left">
                                        <span className="text-foreground block truncate">
                                            {model.name}
                                        </span>
                                        <span className="text-muted-foreground block truncate text-xs">
                                            {blocked ?? model.provider}
                                        </span>
                                    </span>

                                    <TierChip tier={model.tier} />

                                    <span className="flex size-4 shrink-0 items-center justify-center">
                                        {isSelected && (
                                            <IconCheck
                                                aria-hidden
                                                stroke={2.25}
                                                className="text-primary size-4"
                                            />
                                        )}
                                    </span>
                                </button>
                            );
                        })}

                        {visibleModels.length === selected.length && (
                            <p className="text-muted-foreground px-2.5 py-5 text-center text-sm">
                                {query.trim().length > 0
                                    ? `No models match “${query.trim()}”.`
                                    : "No other models available."}
                            </p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const modelOptionId = (index: number): string => `model-picker-option-${index}`;

const cnRow =
    "transition-state flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm";
