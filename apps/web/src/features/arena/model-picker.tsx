import { useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { buttonClasses } from "@/components/ui/button";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { ModelStack } from "@/components/ui/model-stack";
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
    const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);

    const selected = selectedIds
        .map((id) => models.find((model) => model.id === id))
        .filter((model): model is CatalogModel => model !== undefined);

    const atCap = selectedIds.length >= MAX_ARENA_MODELS;
    const atFloor = selectedIds.length <= 1;

    const toggle = (id: string) => {
        if (selectedIds.includes(id)) {
            if (atFloor) return;
            onChange(selectedIds.filter((selectedId) => selectedId !== id));
            return;
        }

        if (atCap) return;
        onChange([...selectedIds, id]);
    };

    const focusRow = (index: number) => {
        setActiveIndex(index);
        const row = rowRefs.current[index];
        row?.focus();
        row?.scrollIntoView({ block: "nearest" });
    };

    const move = (delta: number, from: number) =>
        focusRow((from + delta + models.length) % models.length);

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
                focusRow(models.length - 1);
                break;
            default:
                break;
        }
    };

    const firstSelectedIndex = Math.max(
        0,
        models.findIndex((model) => selectedIds.includes(model.id)),
    );

    return (
        <div className="flex min-w-0 flex-1 items-center gap-2">
            <Popover>
                <PopoverTrigger
                    className={cn(
                        buttonClasses({ variant: "outline", size: "sm" }),
                        "group/trigger min-w-0 max-w-full pl-1.5",
                    )}
                >
                    <ModelStack models={selected} />
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
                        focusRow(firstSelectedIndex);
                    }}
                >
                    <PopoverHeader className="border-border border-b px-4 py-3">
                        <PopoverTitle>Models</PopoverTitle>
                        <PopoverDescription>
                            {atCap
                                ? "Three is the maximum. Remove one to swap."
                                : atFloor
                                  ? `One of ${MAX_ARENA_MODELS} chosen. At least one stays in the thread.`
                                  : `${selectedIds.length} of ${MAX_ARENA_MODELS} chosen.`}
                        </PopoverDescription>
                    </PopoverHeader>

                    <div
                        role="listbox"
                        aria-multiselectable
                        aria-label="Models in the arena"
                        className="max-h-72 overflow-y-auto p-1.5"
                    >
                        {models.map((model, index) => {
                            const isSelected = selectedIds.includes(model.id);
                            const isBlocked = isSelected ? atFloor : atCap;

                            return (
                                <button
                                    key={model.id}
                                    ref={(node) => {
                                        rowRefs.current[index] = node;
                                    }}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    aria-disabled={isBlocked || undefined}
                                    tabIndex={index === activeIndex ? 0 : -1}
                                    onClick={() => toggle(model.id)}
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
                                            {model.provider}
                                        </span>
                                    </span>

                                    <span className="numeric text-muted-foreground shrink-0 text-xs">
                                        {model.contextLabel}
                                    </span>

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
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
};

const cnRow =
    "transition-state flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm";
