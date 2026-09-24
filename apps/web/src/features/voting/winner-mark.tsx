import { IconTrophy } from "@tabler/icons-react";
import type { ColumnVote } from "@/infrastructure/turn-vote";

export const WinnerMark = ({ vote }: { readonly vote: ColumnVote }) =>
    vote.state === "won" ? (
        <p className="winner-mark">
            <IconTrophy aria-hidden stroke={2} />
            Winner
        </p>
    ) : null;
