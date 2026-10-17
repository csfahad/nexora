import { Link } from "@tanstack/react-router";
import { Plan } from "@/generated/prisma/enums";
import { TIER_WORD, useAllowance } from "@/infrastructure/entitlement";
import type { AllowanceView } from "@/infrastructure/entitlement";
import { PAID_TIERS } from "@/infrastructure/plans";

const count = (value: number): string => value.toLocaleString("en-US");

const MeterRow = ({
    word,
    left,
    total,
}: {
    readonly word: string;
    readonly left: number;
    readonly total: number;
}) => {
    const empty = left === 0;
    const filled = total === 0 ? 0 : Math.round((left / total) * 100);

    return (
        <div className="meter-row" data-empty={empty}>
            <p className="meter-line">
                <span className="meter-tier">{word}</span>
                <span className="meter-left">
                    {empty ? (
                        "None left"
                    ) : (
                        <>
                            <span className="numeric">{count(left)}</span> left
                        </>
                    )}
                </span>
            </p>

            <div aria-hidden className="meter-track">
                <div className="meter-fill" style={{ width: `${filled}%` }} />
            </div>
        </div>
    );
};

const freeSentence = (view: AllowanceView): string =>
    view.freeAnswersRemaining === 0
        ? `Today's ${count(view.freeAnswersPerDay)} free answers are used. They reset at midnight UTC.`
        : `${count(view.freeAnswersRemaining)} of ${count(view.freeAnswersPerDay)} free answers left today.`;

export const AllowanceMeter = () => {
    const view = useAllowance();

    if (!view.metered) return null;

    const paid = view.plan !== Plan.FREE;

    return (
        <section aria-labelledby="allowance-heading" className="meter-block">
            <div className="meter-head">
                <h2 id="allowance-heading" className="label-meta">
                    Allowance
                </h2>
                <span className="text-foreground text-xs font-medium">
                    {view.planName}
                </span>
            </div>

            {paid &&
                PAID_TIERS.map((tier) => (
                    <MeterRow
                        key={tier}
                        word={TIER_WORD[tier]}
                        left={view.remaining[tier]}
                        total={view.allowance[tier]}
                    />
                ))}

            {!paid && (
                <MeterRow
                    word="Free answers today"
                    left={view.freeAnswersRemaining}
                    total={view.freeAnswersPerDay}
                />
            )}

            {paid && <p className="meter-foot">{freeSentence(view)}</p>}

            <Link
                to="/plans"
                className="text-primary text-xs font-medium underline underline-offset-2"
            >
                Compare plans
            </Link>
        </section>
    );
};
