import { createFileRoute } from "@tanstack/react-router";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import { LeaderboardScreen } from "@/features/leaderboard/leaderboard-screen";
import { getStandings } from "@/features/leaderboard/standings";

export const Route = createFileRoute("/leaderboard")({
    head: () => ({ meta: [{ title: "Leaderboard · Nexora" }] }),
    loader: async () => getStandings(),
    component: LeaderboardRoute,
});

function LeaderboardRoute() {
    const result = Route.useLoaderData();

    if (result.status === "error") {
        return <LoaderErrorNotice message={result.message} />;
    }

    return <LeaderboardScreen standings={result.standings} />;
}
