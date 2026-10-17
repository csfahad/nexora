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
            <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold">Leaderboard</h1>
                    <p className="text-muted-foreground">
                        Every model&rsquo;s real record, from actual head-to-head votes.
                    </p>
                </header>

                <div className="mt-6 flex flex-wrap items-center gap-3">
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
        <strong className="text-foreground font-medium">
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
    <div className="border-border mt-4 overflow-x-auto rounded-xl border">
        <table className="min-w-184 w-full border-collapse text-left">
            <thead>
                <tr className="border-border border-b">
                    <Th className="w-12 text-right">#</Th>
                    <Th>Model</Th>
                    <Th className="w-88">Win rate</Th>
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
                                <ModelAvatar name={row.modelName} size="sm" />
                                <span className="text-foreground font-medium">
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
            <div
                aria-hidden
                className="bg-input h-1.5 w-28 shrink-0 overflow-hidden rounded-full"
            >
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
    <div className="border-border bg-card mt-4 rounded-xl border px-6 py-14 text-center">
        <h3 className="font-heading text-lg font-semibold">Nothing measured yet</h3>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            {pricing === "free"
                ? "Send a prompt in the arena and the models that answer will appear here with their real numbers."
                : "No paid model has answered a voted prompt yet. Once one does, its real record appears here."}
        </p>
        <Link to="/" className={buttonClasses({ variant: "outline", class: "mt-5" })}>
            Go to the arena
        </Link>
    </div>
);

const EmptyPersonal = () => (
    <div className="border-border bg-card mt-4 rounded-xl border px-6 py-14 text-center">
        <h2 className="font-heading text-lg font-semibold">No personal ranking yet</h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            Your ranking is built from your own votes. Send a prompt in the arena and pick
            a winner, and your head-to-head record will appear here.
        </p>
        <Link to="/" className={buttonClasses({ variant: "outline", class: "mt-5" })}>
            Go to the arena
        </Link>
    </div>
);

const EmptyPersonalPaid = () => (
    <div className="border-border bg-card mt-4 rounded-xl border px-6 py-14 text-center">
        <h2 className="font-heading text-lg font-semibold">
            No paid-model votes from you yet
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            This fills in once you vote on a turn that included a paid model. Your
            free-model record is on the Free tab.
        </p>
        <Link
            to="/models"
            className={buttonClasses({ variant: "outline", class: "mt-5" })}
        >
            Browse paid models
        </Link>
    </div>
);

const SignedOutPersonal = () => (
    <div className="border-border bg-card mt-4 rounded-xl border px-6 py-14 text-center">
        <h2 className="font-heading text-lg font-semibold">
            Sign in to see your ranking
        </h2>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
            A personal ranking is built from the votes you cast. The global one beside it
            reads the same whether you are signed in or not.
        </p>
        <Link
            to="/sign-in"
            search={{ next: "/leaderboard" }}
            className={buttonClasses({ variant: "primary", class: "mt-5" })}
        >
            Sign in
        </Link>
    </div>
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
