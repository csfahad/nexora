import { IconInfoCircle } from "@tabler/icons-react";
import { MEANINGFUL_VOTE_COUNT } from "./standings";

const plural = (votes: number): string => (votes === 1 ? "vote" : "votes");

export const VoteVolumeNotice = ({
    votes,
    scope,
}: {
    readonly votes: number;
    readonly scope: "global" | "personal";
}) => {
    if (votes >= MEANINGFUL_VOTE_COUNT) return null;

    return (
        <div className="evidence-note">
            <IconInfoCircle aria-hidden stroke={1.75} />

            {votes === 0 ? (
                <p>
                    <strong>No votes yet.</strong> The speed columns are measured from
                    real answers, but the ranking starts at the first vote.
                </p>
            ) : (
                <p>
                    <strong className="numeric">
                        {votes} {plural(votes)}
                    </strong>{" "}
                    {scope === "personal" ? "from you" : "so far"} — not enough to rank a
                    model. These are real wins from real votes, but at this volume one
                    vote moves a model from 0% to 100%, so the order is honest rather than
                    settled.
                </p>
            )}
        </div>
    );
};
