import { database } from "@/infrastructure/database";
import { notTheModelsFault } from "@/infrastructure/response-failure";
import { latestAttempts } from "@/infrastructure/response-order";
import { readOwnerId } from "@/infrastructure/session.server";
import type { ModelTier } from "@/infrastructure/model-catalog";
import { STANDINGS_READ_FAILED, rankStandings } from "./standings";
import type {
    GetStandingsResult,
    PricingTab,
    ScopeStandings,
    StandingRow,
    StandingsView,
} from "./standings";

const TIER_ORDER: readonly ModelTier[] = ["FREE", "STANDARD", "ADVANCED", "FRONTIER"];

const dearerTier = (a: ModelTier, b: ModelTier): ModelTier =>
    TIER_ORDER.indexOf(a) >= TIER_ORDER.indexOf(b) ? a : b;

const tierFilter = (tab: PricingTab) =>
    tab === "free" ? { tier: "FREE" as const } : { tier: { not: "FREE" as const } };

const VOTED_TURN_SELECT = {
    vote: { select: { winnerResponseId: true } },
    responses: {
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            modelId: true,
            modelName: true,
            failure: true,
            tier: true,
        },
    },
} as const;

type ResponseRow = Readonly<{
    id: string;
    modelId: string;
    modelName: string;
    failure: string | null;
    tier: ModelTier;
}>;

type VotedTurn = Readonly<{
    vote: Readonly<{ winnerResponseId: string }> | null;
    responses: readonly ResponseRow[];
}>;

type SpeedGroup = Readonly<{
    modelId: string;
    modelName: string;
    tier: ModelTier;
    _avg: Readonly<{ ttftMs: number | null; tokensPerSecond: unknown }>;
}>;

type Tally = { wins: number; battles: number; modelName: string; tier: ModelTier };

const inTab = (tier: ModelTier, tab: PricingTab): boolean =>
    tab === "free" ? tier === "FREE" : tier !== "FREE";

const competitorsOf = (turn: VotedTurn, tab: PricingTab): readonly ResponseRow[] => {
    const winnerId = turn.vote?.winnerResponseId;
    const latest = latestAttempts(turn.responses);
    const winner = turn.responses.find((row) => row.id === winnerId);

    const contenders =
        winner !== undefined && !latest.some((row) => row.id === winner.id)
            ? [...latest.filter((row) => row.modelId !== winner.modelId), winner]
            : latest;

    return contenders.filter(
        (row) => inTab(row.tier, tab) && !notTheModelsFault(row.failure),
    );
};

const tallyTurns = (
    turns: readonly VotedTurn[],
    tab: PricingTab,
): ReadonlyMap<string, Tally> => {
    const tallies = new Map<string, Tally>();

    for (const turn of turns) {
        for (const row of competitorsOf(turn, tab)) {
            const tally = tallies.get(row.modelId) ?? {
                wins: 0,
                battles: 0,
                modelName: row.modelName,
                tier: row.tier,
            };

            tallies.set(row.modelId, {
                modelName: row.modelName,
                tier: dearerTier(tally.tier, row.tier),
                battles: tally.battles + 1,
                wins: tally.wins + (row.id === turn.vote?.winnerResponseId ? 1 : 0),
            });
        }
    }

    return tallies;
};

const mergeRoster = (
    tallies: ReadonlyMap<string, Tally>,
    speed: readonly SpeedGroup[],
): readonly StandingRow[] => {
    const speedBy = new Map(speed.map((group) => [group.modelId, group]));
    const modelIds = new Set([...tallies.keys(), ...speedBy.keys()]);

    return [...modelIds].map((modelId): StandingRow => {
        const tally = tallies.get(modelId);
        const measured = speedBy.get(modelId);
        const average = measured?._avg;

        return {
            modelId,
            modelName: tally?.modelName ?? measured?.modelName ?? modelId,
            tier: tally?.tier ?? measured?.tier ?? "FREE",
            wins: tally?.wins ?? 0,
            battles: tally?.battles ?? 0,
            ttftMs:
                average?.ttftMs === null || average?.ttftMs === undefined
                    ? null
                    : Math.round(average.ttftMs),
            tokensPerSecond:
                average?.tokensPerSecond === null ||
                average?.tokensPerSecond === undefined
                    ? null
                    : Number(average.tokensPerSecond),
        };
    });
};

const readSpeed = (userId: string | null, tab: PricingTab) =>
    database().modelResponse.groupBy({
        by: ["modelId", "modelName", "tier"],
        where: {
            status: "COMPLETE",
            ...tierFilter(tab),
            ...(userId === null ? {} : { turn: { thread: { is: { userId } } } }),
        },
        _avg: { ttftMs: true, tokensPerSecond: true },
    });

const countVotes = (userId: string | null, tab: PricingTab) =>
    database().vote.count({
        where: {
            ...(userId === null ? {} : { userId }),
            turn: { responses: { some: tierFilter(tab) } },
        },
    });

const readScopes = async (userId: string | null): Promise<ScopeStandings> => {
    const [turns, freeSpeed, paidSpeed, freeVotes, paidVotes] = await Promise.all([
        database().turn.findMany({
            where:
                userId === null
                    ? { vote: { isNot: null } }
                    : { vote: { is: { userId } } },
            select: VOTED_TURN_SELECT,
        }),
        readSpeed(userId, "free"),
        readSpeed(userId, "paid"),
        countVotes(userId, "free"),
        countVotes(userId, "paid"),
    ]);

    const view = (
        tab: PricingTab,
        speed: readonly SpeedGroup[],
        votes: number,
    ): StandingsView => ({
        rows: rankStandings(mergeRoster(tallyTurns(turns, tab), speed)),
        votes,
    });

    return {
        free: view("free", freeSpeed, freeVotes),
        paid: view("paid", paidSpeed, paidVotes),
    };
};

export const runGetStandings = async (headers: Headers): Promise<GetStandingsResult> => {
    const userId = await readOwnerId(headers);

    try {
        const [global, personal] = await Promise.all([
            readScopes(null),
            userId === null ? Promise.resolve(null) : readScopes(userId),
        ]);

        return { status: "ready", standings: { global, personal } };
    } catch (error) {
        console.error("[leaderboard] could not read standings:", error);

        return { status: "error", message: STANDINGS_READ_FAILED };
    }
};
