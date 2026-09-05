import type { ReactNode } from "react";
import {
    IconArrowDownRight,
    IconArrowUpRight,
    IconBolt,
    IconClock,
    IconCoin,
    IconGauge,
} from "@tabler/icons-react";
import type { ModelResponseMetrics } from "./model-response-metrics";

const NUMBER = new Intl.NumberFormat("en-US");

const ms = (value: number | null): string => {
    if (value === null) return "—";

    return value < 1000 ? `${NUMBER.format(value)} ms` : `${(value / 1000).toFixed(2)} s`;
};

const rate = (value: number | null): string =>
    value === null ? "—" : `${value.toFixed(1)} tok/s`;

const count = (value: number | null): string =>
    value === null ? "—" : NUMBER.format(value);

const Metric = ({
    icon,
    label,
    value,
}: {
    readonly icon: ReactNode;
    readonly label: string;
    readonly value: string;
}) => (
    <div className="metric" title={label}>
        {icon}
        <dt className="sr-only">{label}</dt>
        <dd className="numeric text-foreground text-[0.8125rem]">{value}</dd>
    </div>
);

export const ResponseMetrics = ({
    metrics,
}: {
    readonly metrics: ModelResponseMetrics | null;
}) => (
    <dl className="metrics-row" aria-label="Measured numbers for this answer">
        <Metric
            icon={<IconBolt aria-hidden stroke={1.75} />}
            label="Time to first token"
            value={ms(metrics?.ttftMs ?? null)}
        />
        <Metric
            icon={<IconClock aria-hidden stroke={1.75} />}
            label="Total time"
            value={ms(metrics?.durationMs ?? null)}
        />
        <Metric
            icon={<IconGauge aria-hidden stroke={1.75} />}
            label="Speed"
            value={rate(metrics?.tokensPerSecond ?? null)}
        />
        <Metric
            icon={<IconArrowDownRight aria-hidden stroke={1.75} />}
            label="Input tokens"
            value={count(metrics?.promptTokens ?? null)}
        />
        <Metric
            icon={<IconArrowUpRight aria-hidden stroke={1.75} />}
            label="Output tokens"
            value={count(metrics?.completionTokens ?? null)}
        />
        <Metric
            icon={<IconCoin aria-hidden stroke={1.75} />}
            label="Cost"
            value={metrics === null ? "—" : `$${metrics.costUsd.toFixed(4)}`}
        />
    </dl>
);
