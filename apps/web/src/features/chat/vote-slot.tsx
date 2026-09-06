import { createContext, useContext } from "react";
import type { ComponentType, ReactNode } from "react";
import type { ColumnVote } from "@/infrastructure/turn-vote";

export type VoteSlot = ComponentType<{ readonly vote: ColumnVote }>;

const VoteSlotContext = createContext<VoteSlot | null>(null);

export const VoteSlotProvider = ({
    control,
    children,
}: {
    readonly control: VoteSlot;
    readonly children: ReactNode;
}) => <VoteSlotContext.Provider value={control}>{children}</VoteSlotContext.Provider>;

export const useVoteSlot = (): VoteSlot | null => useContext(VoteSlotContext);
