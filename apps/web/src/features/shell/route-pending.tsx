import { useLocation } from "@tanstack/react-router";
import { PageLoading } from "@/components/ui/page-loading";
import { PublicLayout } from "@/components/ui/public-layout";

export const RoutePending = () => {
    const { pathname } = useLocation();
    const billing = pathname.startsWith("/settings/billing");
    const label = pathname.startsWith("/thread/")
        ? "Opening thread…"
        : billing
          ? "Loading billing…"
          : pathname.startsWith("/leaderboard")
            ? "Loading leaderboard…"
            : "Loading models…";
    const loading = <PageLoading label={label} />;
    return billing ? (
        <PublicLayout mainId="billing-main">{loading}</PublicLayout>
    ) : (
        loading
    );
};
