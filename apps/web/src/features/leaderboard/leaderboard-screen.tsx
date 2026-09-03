import { useState } from "react";
import { DemoBadge } from "@/components/ui/demo-badge";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { DEMO_STANDINGS, winRate } from "./demo-standings";
import type { StandingRow } from "./demo-standings";
import { ViewToggle } from "./view-toggle";
import type { ViewOption } from "./view-toggle";

type View = "global" | "personal";

const VIEWS: readonly ViewOption<View>[] = [
    { value: "global", label: "Global", panelId: "leaderboard-global" },
    { value: "personal", label: "Personal", panelId: "leaderboard-personal" },
];

export const LeaderboardScreen = () => {
    const [view, setView] = useState<View>("global");

    return (
        <div className="screen screen-scroll">
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold">Leaderboard</h1>
                    <p className="text-muted-foreground">
                        Every model&rsquo;s real record, from actual head-to-head votes.
                    </p>
                </header>

                <div className="mt-6">
                    <ViewToggle
                        label="Leaderboard scope"
                        options={VIEWS}
                        value={view}
                        onChange={setView}
                    />
                </div>

                {view === "global" ? (
                    <section
                        id="leaderboard-global"
                        role="tabpanel"
                        aria-labelledby="leaderboard-global-tab"
                        className="mt-6"
                    >
                        <div className="flex flex-wrap items-end justify-between gap-3">
                            <div className="flex flex-col gap-1">
                                <h2 className="font-heading text-lg font-semibold">
                                    Global ranking
                                </h2>
                                <p className="text-muted-foreground text-sm">
                                    Every vote, every user, ranked by real wins.
                                </p>
                            </div>
                            <DemoBadge />
                        </div>

                        <StandingsTable rows={DEMO_STANDINGS} />
                    </section>
                ) : (
                    <section
                        id="leaderboard-personal"
                        role="tabpanel"
                        aria-labelledby="leaderboard-personal-tab"
                        className="mt-6"
                    >
                        <EmptyPersonal />
                    </section>
                )}
            </div>
        </div>
    );
};

const StandingsTable = ({ rows }: { readonly rows: readonly StandingRow[] }) => (
    <div className="border-border mt-4 overflow-x-auto rounded-xl border">
        <table className="min-w-184 w-full border-collapse text-left">
            <thead>
                <tr className="border-border border-b">
                    <Th className="w-12 text-right">#</Th>
                    <Th>Model</Th>
                    <Th className="w-88">Win rate</Th>
                    <Th className="text-right">Avg. to first token</Th>
                    <Th className="text-right">Avg. tokens/sec</Th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr
                        key={row.rank}
                        className="border-border hover:bg-muted/50 border-b last:border-b-0"
                    >
                        <td className="numeric text-muted-foreground px-3 py-3.5 text-right text-sm">
                            {row.rank}
                        </td>
                        <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2.5">
                                <ModelAvatar name={row.model} size="sm" />
                                <span className="text-foreground font-medium">
                                    {row.model}
                                </span>
                            </div>
                        </td>
                        <td className="px-3 py-3.5">
                            <WinRateCell row={row} />
                        </td>
                        <td className="numeric text-foreground px-3 py-3.5 text-right text-sm">
                            {row.ttftMs} ms
                        </td>
                        <td className="numeric text-foreground px-3 py-3.5 text-right text-sm">
                            {row.tokensPerSecond} tok/s
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const WinRateCell = ({ row }: { readonly row: StandingRow }) => {
    const pct = winRate(row);
    return (
        <div className="flex items-center gap-3">
            <span className="numeric text-foreground w-10 shrink-0 text-sm font-semibold">
                {pct}%
            </span>
            <div
                aria-hidden
                className="bg-input h-1.5 w-28 shrink-0 overflow-hidden rounded-full"
            >
                <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-2xs text-muted-foreground whitespace-nowrap">
                Won <span className="numeric">{row.wins}</span> of{" "}
                <span className="numeric">{row.battles}</span>
            </span>
        </div>
    );
};

const EmptyPersonal = () => (
    <div className="border-border bg-card mt-4 rounded-xl border px-6 py-14 text-center">
        <h2 className="font-heading text-lg font-semibold">No personal ranking yet</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            Your ranking is built from your own votes. Send a prompt in the arena and pick
            a winner, and your head-to-head record will appear here.
        </p>
    </div>
);

const Th = ({
    children,
    className,
}: {
    readonly children: React.ReactNode;
    readonly className?: string;
}) => (
    <th scope="col" className={`label-meta px-3 py-2.5 font-medium ${className ?? ""}`}>
        {children}
    </th>
);
