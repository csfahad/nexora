import { createServerFn } from "@tanstack/react-start";

export const MEANINGFUL_VOTE_COUNT = 100;

export type StandingRow = Readonly<{
    modelId: string;
    modelName: string;
    wins: number;
    battles: number;
    ttftMs: number | null;
    tokensPerSecond: number | null;
}>;

export type RankedRow = StandingRow & Readonly<{ rank: number | null }>;

export type StandingsView = Readonly<{
    rows: readonly RankedRow[];
    votes: number;
}>;

export type Standings = Readonly<{
    global: StandingsView;
    personal: StandingsView | null;
}>;

export type GetStandingsResult =
    | Readonly<{ status: "ready"; standings: Standings }>
    | Readonly<{ status: "error"; message: string }>;

export const STANDINGS_READ_FAILED =
    "We couldn't load the leaderboard just now. Try again.";

export const winRateOf = (row: StandingRow): number | null =>
    row.battles === 0 ? null : Math.round((row.wins / row.battles) * 100);

const byRate = (a: StandingRow, b: StandingRow): number => {
    const rateA = winRateOf(a);
    const rateB = winRateOf(b);

    if (rateA === null || rateB === null) {
        return rateA === rateB ? 0 : rateA === null ? 1 : -1;
    }

    return rateB - rateA || b.battles - a.battles;
};

export const rankStandings = (rows: readonly StandingRow[]): readonly RankedRow[] => {
    const sorted = [...rows].sort(
        (a, b) => byRate(a, b) || a.modelName.localeCompare(b.modelName),
    );

    return sorted.map((row) => ({
        ...row,
        rank:
            winRateOf(row) === null
                ? null
                : sorted.findIndex(
                      (other) => other.wins === row.wins && other.battles === row.battles,
                  ) + 1,
    }));
};

export const getStandings = createServerFn({ method: "GET" }).handler(
    async (): Promise<GetStandingsResult> => {
        const [{ getRequest }, { runGetStandings }] = await Promise.all([
            import("@tanstack/react-start/server"),
            import("./standings.server"),
        ]);

        return runGetStandings(getRequest().headers);
    },
);
