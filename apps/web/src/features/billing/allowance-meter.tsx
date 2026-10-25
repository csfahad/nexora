import type { ReactNode } from "react";

const count = (value: number): string => value.toLocaleString("en-US");

export const AllowanceMeter = ({
    label,
    name,
    remaining,
    total,
    used,
}: {
    readonly label: ReactNode;
    readonly name: string;
    readonly remaining: number;
    readonly total: number;
    readonly used: number;
}) => {
    const available = Math.min(total, Math.max(0, remaining));
    const filled = total > 0 ? (available / total) * 100 : 0;

    return (
        <div className="allowance-meter" data-empty={available === 0}>
            <div className="allowance-label">{label}</div>
            <p className="allowance-value">
                <span className="numeric">{count(remaining)}</span>
                <span className="allowance-caption">remaining</span>
            </p>
            <div
                role="meter"
                aria-label={`${name} answers remaining`}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={available}
                aria-valuetext={`${count(remaining)} of ${count(total)} answers remaining`}
                className="allowance-track"
            >
                <div className="allowance-fill" style={{ width: `${filled}%` }} />
            </div>
            <p className="allowance-caption numeric">
                {count(used)} of {count(total)} used
                {available === 0 && total > 0 ? " · Allowance used up" : ""}
            </p>
        </div>
    );
};
