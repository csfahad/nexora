import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoaderErrorNotice } from "@/components/ui/retry-notice";
import { LeaderboardScreen } from "@/features/leaderboard/leaderboard-screen";
import { getStandings } from "@/features/leaderboard/standings";

const searchSchema = z.object({
    scope: z.enum(["global", "personal"]).default("global"),
    pricing: z.enum(["free", "paid"]).default("free"),
});

export const Route = createFileRoute("/leaderboard")({
    head: () => ({ meta: [{ title: "Leaderboard · Nexora" }] }),
    validateSearch: searchSchema,
    loader: async () => getStandings(),
    component: LeaderboardRoute,
});

function LeaderboardRoute() {
    const result = Route.useLoaderData();
    const { scope, pricing } = Route.useSearch();
    const navigate = Route.useNavigate();

    if (result.status === "error") {
        return <LoaderErrorNotice message={result.message} />;
    }

    return (
        <LeaderboardScreen
            standings={result.standings}
            scope={scope}
            pricing={pricing}
            onChange={(next) => {
                void navigate({ search: next, replace: true });
            }}
        />
    );
}
