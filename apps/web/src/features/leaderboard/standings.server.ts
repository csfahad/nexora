import { database } from "@/infrastructure/database";
import { RESPONSE_FAILURE } from "@/infrastructure/response-failure";
import { latestAttempts } from "@/infrastructure/response-order";
import { readOwnerId } from "@/infrastructure/session.server";
import { STANDINGS_READ_FAILED, rankStandings } from "./standings";
import type { GetStandingsResult, StandingRow, StandingsView } from "./standings";

const NOT_A_BATTLE: readonly string[] = [
    RESPONSE_FAILURE.CANCELLED,
    RESPONSE_FAILURE.MODEL_UNAVAILABLE,
];

const VOTED_TURN_SELECT = {
    vote: { select: { winnerResponseId: true } },
    responses: {
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            modelId: true,
            modelName: true,
            failure: true,
        },
    },
} as const;

type ResponseRow = Readonly<{
    id: string;
    modelId: string;
    modelName: string;
    failure: string | null;
}>;

type VotedTurn = Readonly<{
    vote: Readonly<{ winnerResponseId: string }> | null;
    responses: readonly ResponseRow[];
}>;

type SpeedGroup = Readonly<{
    modelId: string;
    modelName: string;
    _avg: Readonly<{ ttftMs: number | null; tokensPerSecond: unknown }>;
}>;

type Tally = { wins: number; battles: number; modelName: string };

const competitorsOf = (turn: VotedTurn): readonly ResponseRow[] => {
    const winnerId = turn.vote?.winnerResponseId;
    const latest = latestAttempts(turn.responses);
    const winner = turn.responses.find((row) => row.id === winnerId);

    const contenders =
        winner !== undefined && !latest.some((row) => row.id === winner.id)
            ? [...latest.filter((row) => row.modelId !== winner.modelId), winner]
            : latest;

    return contenders.filter(
        (row) => row.failure === null || !NOT_A_BATTLE.includes(row.failure),
    );
};

const tallyTurns = (turns: readonly VotedTurn[]): ReadonlyMap<string, Tally> => {
    const tallies = new Map<string, Tally>();

    for (const turn of turns) {
        for (const row of competitorsOf(turn)) {
            const tally = tallies.get(row.modelId) ?? {
                wins: 0,
                battles: 0,
                modelName: row.modelName,
            };

            tallies.set(row.modelId, {
                modelName: row.modelName,
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

const readScope = async (userId: string | null): Promise<StandingsView> => {
    const [turns, speed, votes] = await Promise.all([
        database().turn.findMany({
            where:
                userId === null
                    ? { vote: { isNot: null } }
                    : { vote: { is: { userId } } },
            select: VOTED_TURN_SELECT,
        }),
        database().modelResponse.groupBy({
            by: ["modelId", "modelName"],
            where: {
                status: "COMPLETE",
                ...(userId === null ? {} : { turn: { thread: { is: { userId } } } }),
            },
            _avg: { ttftMs: true, tokensPerSecond: true },
        }),
        database().vote.count({
            where: userId === null ? {} : { userId },
        }),
    ]);

    return { rows: rankStandings(mergeRoster(tallyTurns(turns), speed)), votes };
};

export const runGetStandings = async (headers: Headers): Promise<GetStandingsResult> => {
    const userId = await readOwnerId(headers);

    try {
        const [global, personal] = await Promise.all([
            readScope(null),
            userId === null ? Promise.resolve(null) : readScope(userId),
        ]);

        return { status: "ready", standings: { global, personal } };
    } catch (error) {
        console.error("[leaderboard] could not read standings:", error);

        return { status: "error", message: STANDINGS_READ_FAILED };
    }
};
