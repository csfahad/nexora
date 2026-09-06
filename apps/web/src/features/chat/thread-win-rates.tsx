import { ModelAvatar } from "@/components/ui/model-avatar";
import type { ThreadView } from "./get-thread";

export type ModelWins = Readonly<{
    modelId: string;
    modelName: string;
    wins: number;
}>;

export const winRatesFor = (
    thread: ThreadView,
): Readonly<{ rates: readonly ModelWins[]; voted: number }> => {
    const voted = thread.turns.filter((turn) => turn.vote !== null);
    const roster = thread.turns[0]?.responses ?? [];

    return {
        voted: voted.length,
        rates: roster.map((model) => ({
            modelId: model.modelId,
            modelName: model.modelName,
            wins: voted.filter((turn) =>
                turn.responses.some(
                    (row) =>
                        row.id === turn.vote?.winnerResponseId &&
                        row.modelId === model.modelId,
                ),
            ).length,
        })),
    };
};

const leaderOf = (rates: readonly ModelWins[]): string | null => {
    const best = rates.reduce((most, rate) => Math.max(most, rate.wins), 0);
    const tied = rates.filter((rate) => rate.wins === best);

    return best > 0 && tied.length === 1 ? (tied[0]?.modelId ?? null) : null;
};

export const ThreadWinRates = ({ thread }: { readonly thread: ThreadView }) => {
    const { rates, voted } = winRatesFor(thread);

    if (voted === 0) return null;

    const leader = leaderOf(rates);

    return (
        <ul className="win-pills" aria-label="Wins in this thread">
            {rates.map((rate) => (
                <li
                    key={rate.modelId}
                    className="win-pill"
                    data-leading={rate.modelId === leader ? "" : undefined}
                >
                    <ModelAvatar name={rate.modelName} size="sm" />

                    <span aria-hidden>
                        {rate.wins}/{voted}
                    </span>

                    <span className="sr-only">
                        {rate.modelName} won {rate.wins} of {voted} voted turns
                    </span>
                </li>
            ))}
        </ul>
    );
};
