import { IconArrowRight, IconTrophy, IconUser } from "@tabler/icons-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { Link } from "@tanstack/react-router";
import { buttonClasses } from "@/components/ui/button";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { TierChip } from "@/components/ui/tier-chip";
import { ViewToggle } from "@/components/ui/view-toggle";
import type { ViewOption } from "@/components/ui/view-toggle";
import { winRateOf } from "./standings";
import type {
    PricingTab,
    RankedRow,
    ScopeStandings,
    Standings,
    StandingsView,
} from "./standings";
import { VoteVolumeNotice } from "./vote-volume-notice";

type Scope = "global" | "personal";

const SCOPES: readonly ViewOption<Scope>[] = [
    { value: "global", label: "Global", panelId: "leaderboard-global" },
    { value: "personal", label: "Personal", panelId: "leaderboard-personal" },
];

const PRICING: readonly ViewOption<PricingTab>[] = [
    { value: "free", label: "Free" },
    { value: "paid", label: "Paid" },
];

export type LeaderboardSearch = Readonly<{ scope: Scope; pricing: PricingTab }>;

export const LeaderboardScreen = ({
    standings,
    scope,
    pricing,
    onChange,
}: {
    readonly standings: Standings;
    readonly scope: Scope;
    readonly pricing: PricingTab;
    readonly onChange: (next: LeaderboardSearch) => void;
}) => {
    const panelId = `leaderboard-${scope}`;

    return (
        <div className="screen screen-scroll">
            <div className="page-content">
                <PageHeading
                    title="Let the answers decide."
                    description="Real prompts. Head-to-head votes. See how models perform across the community, or build a ranking from your own comparisons."
                >
                    <Link
                        to="/"
                        className={buttonClasses({ variant: "outline", size: "sm" })}
                    >
                        Compare models
                        <IconArrowRight aria-hidden stroke={1.75} />
                    </Link>
                </PageHeading>

                <div className="page-toolbar leaderboard-toolbar">
                    <ViewToggle
                        label="Leaderboard scope"
                        options={SCOPES}
                        value={scope}
                        onChange={(next) => onChange({ scope: next, pricing })}
                    />
                    <ViewToggle
                        label="Model pricing"
                        mode="radio"
                        options={PRICING}
                        value={pricing}
                        onChange={(next) => onChange({ scope, pricing: next })}
                    />
                </div>

                <section
                    id={panelId}
                    role="tabpanel"
                    aria-labelledby={`${panelId}-tab`}
                    className="mt-6"
                >
                    {scope === "global" ? (
                        <GlobalScope views={standings.global} pricing={pricing} />
                    ) : (
                        <PersonalScope views={standings.personal} pricing={pricing} />
                    )}
                </section>
            </div>
        </div>
    );
};

const GlobalScope = ({
    views,
    pricing,
}: {
    readonly views: ScopeStandings;
    readonly pricing: PricingTab;
}) => (
    <>
        <div className="flex flex-col gap-1">
            <h2 className="font-heading text-lg font-semibold">
                {pricing === "free" ? "Free models" : "Paid models"}
            </h2>
            <p className="text-muted-foreground text-sm">
                Every vote, every user, ranked by real wins.
            </p>
        </div>

        <Scope view={views[pricing]} scope="global" pricing={pricing} />
    </>
);

const PersonalScope = ({
    views,
    pricing,
}: {
    readonly views: ScopeStandings | null;
    readonly pricing: PricingTab;
}) => {
    if (views === null) return <SignedOutPersonal />;

    const view = views[pricing];

    if (view.votes === 0) {
        return pricing === "paid" ? <EmptyPersonalPaid /> : <EmptyPersonal />;
    }

    return (
        <>
            <div className="flex flex-col gap-1">
                <h2 className="font-heading text-lg font-semibold">
                    {pricing === "free"
                        ? "Your free-model record"
                        : "Your paid-model record"}
                </h2>
                <p className="text-muted-foreground text-sm">
                    Built from the votes you cast, and nobody else&rsquo;s.
                </p>
            </div>

            <Scope view={view} scope="personal" pricing={pricing} />
        </>
    );
};

const Scope = ({
    view,
    scope,
    pricing,
}: {
    readonly view: StandingsView;
    readonly scope: Scope;
    readonly pricing: PricingTab;
}) =>
    view.rows.length === 0 ? (
        <NoModelsYet pricing={pricing} />
    ) : (
        <>
            <div className="mt-4 flex flex-col gap-3">
                <VoteVolumeNotice votes={view.votes} scope={scope} />
                <CrossTabNote pricing={pricing} />
            </div>

            <StandingsTable rows={view.rows} pricing={pricing} />
        </>
    );

const CrossTabNote = ({ pricing }: { readonly pricing: PricingTab }) => (
    <p className="text-muted-foreground text-2xs leading-relaxed">
        A prompt can be sent to free and paid models together, so some battles here were
        decided by a model on the{" "}
        <strong className="text-foreground standings-model-name font-medium">
            {pricing === "free" ? "Paid" : "Free"}
        </strong>{" "}
        tab.
    </p>
);

const StandingsTable = ({
    rows,
    pricing,
}: {
    readonly rows: readonly RankedRow[];
    readonly pricing: PricingTab;
}) => (
    <div className="standings-table">
        <table className="min-w-184 w-full border-collapse text-left">
            <caption className="sr-only">
                {pricing === "free" ? "Free" : "Paid"} model rankings, win rates, and
                measured response speed
            </caption>
            <thead>
                <tr className="border-border border-b">
                    <Th className="w-12 text-right">#</Th>
                    <Th>Model</Th>
                    <Th className="w-72">Win rate</Th>
                    <Th className="text-right">Avg. to first token</Th>
                    <Th className="text-right">Avg. tokens/sec</Th>
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr
                        key={row.modelId}
                        className="border-border hover:bg-muted/50 border-b last:border-b-0"
                    >
                        <td className="numeric text-muted-foreground px-3 py-3.5 text-right text-sm">
                            {row.rank ?? <Absent label="Unranked" />}
                        </td>
                        <td className="px-3 py-3.5">
                            <div className="flex items-center gap-2.5">
                                <ModelAvatar
                                    modelId={row.modelId}
                                    name={row.modelName}
                                    size="sm"
                                />
                                <span className="text-foreground standings-model-name font-medium">
                                    {row.modelName}
                                </span>
                                {pricing === "paid" && <TierChip tier={row.tier} />}
                            </div>
                        </td>
                        <td className="px-3 py-3.5">
                            <WinRateCell row={row} />
                        </td>
                        <td className="numeric text-foreground px-3 py-3.5 text-right text-sm">
                            {row.ttftMs === null ? (
                                <Absent label="Not measured" />
                            ) : (
                                `${row.ttftMs} ms`
                            )}
                        </td>
                        <td className="numeric text-foreground px-3 py-3.5 text-right text-sm">
                            {row.tokensPerSecond === null ? (
                                <Absent label="Not measured" />
                            ) : (
                                `${row.tokensPerSecond.toFixed(1)} tok/s`
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const WinRateCell = ({ row }: { readonly row: RankedRow }) => {
    const pct = winRateOf(row);

    if (pct === null) {
        return (
            <span className="text-muted-foreground text-sm">
                <Absent label="No votes yet" />
            </span>
        );
    }

    return (
        <div className="flex items-center gap-3">
            <span className="numeric text-foreground w-10 shrink-0 text-sm font-semibold">
                {pct}%
            </span>
            <div aria-hidden className="win-rate-track">
                <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-2xs text-muted-foreground whitespace-nowrap">
                Won <span className="numeric">{row.wins}</span> of{" "}
                <span className="numeric">{row.battles}</span>
            </span>
        </div>
    );
};

const Absent = ({ label }: { readonly label: string }) => (
    <>
        <span aria-hidden>&mdash;</span>
        <span className="sr-only">{label}</span>
    </>
);

const NoModelsYet = ({ pricing }: { readonly pricing: PricingTab }) => (
    <EmptyState
        icon={IconTrophy}
        title="Nothing measured yet"
        description={
            pricing === "free"
                ? "Send a prompt in the arena. Models that answer will appear here with their real numbers."
                : "No paid model has answered a voted prompt yet. Its record will appear after the first comparison."
        }
    >
        <Link to="/" className={buttonClasses({ variant: "outline", class: "mt-5" })}>
            Start a comparison
            <IconArrowRight aria-hidden stroke={1.75} />
        </Link>
    </EmptyState>
);
const EmptyPersonal = () => (
    <EmptyState
        icon={IconTrophy}
        title="Your ranking starts with a vote."
        description="Compare answers on a prompt of your own, then choose a winner. Each vote builds your personal record."
    >
        <Link to="/" className={buttonClasses({ variant: "outline", class: "mt-5" })}>
            Start a comparison
            <IconArrowRight aria-hidden stroke={1.75} />
        </Link>
    </EmptyState>
);
const EmptyPersonalPaid = () => (
    <EmptyState
        icon={IconTrophy}
        title="No paid-model votes yet"
        description="Vote on a comparison that includes a paid model to start this record. Your free-model results are on the Free tab."
    >
        <Link
            to="/models"
            className={buttonClasses({ variant: "outline", class: "mt-5" })}
        >
            Explore models
            <IconArrowRight aria-hidden stroke={1.75} />
        </Link>
    </EmptyState>
);
const SignedOutPersonal = () => (
    <EmptyState
        icon={IconUser}
        title="A ranking of your own."
        description="Sign in to keep your comparisons and build a personal ranking from the votes you cast."
    >
        <Link
            to="/sign-in"
            search={{ next: "/leaderboard" }}
            className={buttonClasses({ variant: "primary", class: "mt-5" })}
        >
            Sign in
            <IconArrowRight aria-hidden stroke={1.75} />
        </Link>
    </EmptyState>
);

const Th = ({
    children,
    className,
}: {
    readonly children: React.ReactNode;
    readonly className?: string;
}) => (
    <th scope="col" className={`label-meta px-3 py-2.5 font-medium ${className ?? ""}`}>
        {children}
    </th>
);
