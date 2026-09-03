export type StandingRow = Readonly<{
    rank: number;
    model: string;
    wins: number;
    battles: number;
    ttftMs: number;
    tokensPerSecond: number;
}>;

export const DEMO_STANDINGS: readonly StandingRow[] = [
    {
        rank: 1,
        model: "NVIDIA Nemotron 3 Ultra",
        wins: 507,
        battles: 700,
        ttftMs: 1186,
        tokensPerSecond: 57,
    },
    {
        rank: 2,
        model: "Nemotron 3.5 Lightning",
        wins: 441,
        battles: 662,
        ttftMs: 402,
        tokensPerSecond: 91,
    },
    {
        rank: 3,
        model: "Dots 3 Note (preview)",
        wins: 388,
        battles: 640,
        ttftMs: 733,
        tokensPerSecond: 48,
    },
    {
        rank: 4,
        model: "Laguna S 2.1",
        wins: 296,
        battles: 581,
        ttftMs: 918,
        tokensPerSecond: 39,
    },
    {
        rank: 5,
        model: "Qwen3 Coder Flash",
        wins: 214,
        battles: 522,
        ttftMs: 1547,
        tokensPerSecond: 44,
    },
    {
        rank: 6,
        model: "Mistral Small 3.2",
        wins: 173,
        battles: 498,
        ttftMs: 611,
        tokensPerSecond: 63,
    },
] as const;

export const winRate = (row: StandingRow): number =>
    Math.round((row.wins / row.battles) * 100);
