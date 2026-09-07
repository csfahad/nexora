import { createFileRoute } from "@tanstack/react-router";
import { LeaderboardScreen } from "@/features/leaderboard/leaderboard-screen";

export const Route = createFileRoute("/leaderboard")({
    head: () => ({ meta: [{ title: "Leaderboard · Nexora" }] }),
    component: LeaderboardScreen,
});
