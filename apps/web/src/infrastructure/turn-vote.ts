export const MIN_VOTABLE_ANSWERS = 2;

export type ColumnVote =
    | Readonly<{ state: "closed" }>
    | Readonly<{ state: "open"; turnId: string; responseId: string; modelName: string }>
    | Readonly<{ state: "won" }>;

const CLOSED: ColumnVote = { state: "closed" };

export type VotableColumn = Readonly<{
    id: string;
    modelName: string;
    state: "streaming" | "complete" | "failed";
}>;

export const columnVotes = (
    turn: Readonly<{ id: string; winnerResponseId: string | null }>,
    columns: readonly VotableColumn[],
): ReadonlyMap<string, ColumnVote> => {
    const winnerResponseId = turn.winnerResponseId;

    if (winnerResponseId !== null) {
        return new Map(
            columns.map((column) => [
                column.id,
                column.id === winnerResponseId ? { state: "won" } : CLOSED,
            ]),
        );
    }

    const settled = !columns.some((column) => column.state === "streaming");
    const finished = columns.filter((column) => column.state === "complete");
    const open = settled && finished.length >= MIN_VOTABLE_ANSWERS;

    return new Map(
        columns.map((column) => [
            column.id,
            open && column.state === "complete"
                ? {
                      state: "open",
                      turnId: turn.id,
                      responseId: column.id,
                      modelName: column.modelName,
                  }
                : CLOSED,
        ]),
    );
};

export const voteFor = (
    votes: ReadonlyMap<string, ColumnVote>,
    responseId: string,
): ColumnVote => votes.get(responseId) ?? CLOSED;
