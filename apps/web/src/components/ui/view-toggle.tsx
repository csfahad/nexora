import { useRef } from "react";
import { cn } from "@/lib/utils";

export type ViewOption<T extends string> = Readonly<{
    value: T;
    label: string;
    panelId?: string;
}>;

export type ToggleMode = "tabs" | "radio";

export const ViewToggle = <T extends string>({
    options,
    value,
    onChange,
    label,
    mode = "tabs",
}: {
    readonly options: readonly ViewOption<T>[];
    readonly value: T;
    readonly onChange: (value: T) => void;
    readonly label: string;
    readonly mode?: ToggleMode;
}) => {
    const refs = useRef<Array<HTMLButtonElement | null>>([]);

    const move = (delta: number, from: number) => {
        const next = (from + delta + options.length) % options.length;
        onChange(options[next].value);
        refs.current[next]?.focus();
    };

    const handleKeyDown = (
        event: React.KeyboardEvent<HTMLButtonElement>,
        index: number,
    ) => {
        switch (event.key) {
            case "ArrowRight":
            case "ArrowDown":
                event.preventDefault();
                move(1, index);
                break;
            case "ArrowLeft":
            case "ArrowUp":
                event.preventDefault();
                move(-1, index);
                break;
            case "Home":
                event.preventDefault();
                move(-index, index);
                break;
            case "End":
                event.preventDefault();
                move(options.length - 1 - index, index);
                break;
            default:
                break;
        }
    };

    const tabs = mode === "tabs";

    return (
        <div
            role={tabs ? "tablist" : "radiogroup"}
            aria-label={label}
            className="view-toggle"
        >
            {options.map((option, index) => {
                const selected = option.value === value;

                return (
                    <button
                        key={option.value}
                        ref={(node) => {
                            refs.current[index] = node;
                        }}
                        type="button"
                        role={tabs ? "tab" : "radio"}
                        {...(tabs
                            ? {
                                  id: option.panelId
                                      ? `${option.panelId}-tab`
                                      : undefined,
                                  "aria-selected": selected,
                                  "aria-controls": option.panelId,
                              }
                            : { "aria-checked": selected })}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className={cn(
                            "view-toggle-option transition-state rounded-lg px-4 py-1.5 text-sm font-medium",
                            selected
                                ? "view-toggle-selected bg-card text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
