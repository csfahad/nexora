import { useRef } from "react";
import { cn } from "@/lib/utils";

export type ViewOption<T extends string> = Readonly<{
    value: T;
    label: string;
    panelId: string;
}>;

export const ViewToggle = <T extends string>({
    options,
    value,
    onChange,
    label,
}: {
    readonly options: readonly ViewOption<T>[];
    readonly value: T;
    readonly onChange: (value: T) => void;
    readonly label: string;
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

    return (
        <div
            role="tablist"
            aria-label={label}
            className="border-input bg-muted inline-flex items-center gap-1 rounded-lg border p-1"
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
                        role="tab"
                        id={`${option.panelId}-tab`}
                        aria-selected={selected}
                        aria-controls={option.panelId}
                        tabIndex={selected ? 0 : -1}
                        onClick={() => onChange(option.value)}
                        onKeyDown={(event) => handleKeyDown(event, index)}
                        className={cn(
                            "transition-state rounded-md px-3 py-1.5 text-sm font-medium",
                            selected
                                ? "border-border bg-card text-foreground border shadow-sm"
                                : "text-muted-foreground hover:text-foreground border border-transparent",
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
};
