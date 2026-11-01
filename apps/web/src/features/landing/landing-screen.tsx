import { Link } from "@tanstack/react-router";
import {
    IconArrowDown,
    IconArrowRight,
    IconArrowUpRight,
    IconCheck,
    IconLink,
    IconLock,
    IconMessageCircle,
    IconTrophy,
} from "@tabler/icons-react";
import { buttonClasses } from "@/components/ui/button";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { PublicLayout } from "@/components/ui/public-layout";
import { FREE_ANSWERS_PER_DAY, PAID_PLANS } from "@/infrastructure/plans";
import { ComparisonPreview } from "./comparison-preview";
import { HeroShowcase } from "./hero-showcase";

const PROVIDERS = [
    { id: "openai", name: "OpenAI" },
    { id: "anthropic", name: "Anthropic" },
    { id: "google", name: "Google" },
    { id: "deepseek", name: "DeepSeek" },
    { id: "meta-llama", name: "Meta" },
    { id: "mistralai", name: "Mistral" },
] as const;

const FAQS = [
    {
        question: "Can I start for free?",
        answer: `Yes. Sign in with Google or GitHub to compare free models, save threads, and vote. The free allowance is ${FREE_ANSWERS_PER_DAY} model answers per day; provider availability and hourly limits also apply. A prompt sent to three models uses three answers.`,
    },
    {
        question: "Which models can I compare?",
        answer: "Nexora uses OpenRouter’s live catalog. Choose up to three available models and mix providers. Free models are available on every plan; a paid plan unlocks eligible paid models within its tier allowances. The model catalog shows current prices and flags models outside the arena’s price ceiling.",
    },
    {
        question: "What happens when I ask a follow-up?",
        answer: "Each model continues its own conversation using your earlier prompts and that model’s earlier answers. Models don’t read each other’s responses. You can compare how each one develops its answer in the same thread.",
    },
    {
        question: "How are the rankings calculated?",
        answer: "The leaderboard uses votes on actual comparisons, with global and personal views and separate free and paid results. Win rate reflects how often an answer is chosen; speed comes from completed calls. Vote volume is shown so a small sample doesn’t look like a settled verdict.",
    },
    {
        question: "Are my comparisons public?",
        answer: "Your threads are private to your account unless you create a share link. Anyone with that link can read the full comparison, including prompts, answers, metrics, and votes. Revoke the link to stop future access. Our Privacy Policy explains processing by model, analytics, and security providers.",
    },
] as const;

export const LandingScreen = () => (
    <PublicLayout>
        <section className="landing-hero" aria-labelledby="landing-heading">
            <h1 id="landing-heading">
                One prompt.
                <br />
                <span>Three perspectives.</span>
            </h1>
            <p>
                Find the AI that works for you. Compare answers side by side,
                <br className="hero-line-break" /> see what each one costs, and choose
                your winner.
            </p>
            <div className="landing-actions">
                <Link
                    to="/app"
                    className={buttonClasses({ variant: "primary", size: "lg" })}
                >
                    Start comparing <IconArrowRight aria-hidden size={18} />
                </Link>
                <Link to="/" hash="how-it-works" className="landing-text-link">
                    Try the example <IconArrowDown aria-hidden size={16} />
                </Link>
            </div>
            <p className="landing-start-note">
                Start with free models. No credit card required.
            </p>
        </section>

        <HeroShowcase>
            <section
                className="landing-demo-section"
                aria-label="Try a three-model comparison"
            >
                <ComparisonPreview />
            </section>
        </HeroShowcase>
        <div className="landing-demo-section">
            <ol className="landing-steps">
                <li>
                    <span>1</span>
                    <div>
                        <strong>Bring your prompt</strong>
                        <p>Pick up to three models.</p>
                    </div>
                </li>
                <li>
                    <span>2</span>
                    <div>
                        <strong>Compare the answers</strong>
                        <p>Read them with the numbers beside them.</p>
                    </div>
                </li>
                <li>
                    <span>3</span>
                    <div>
                        <strong>Make your call</strong>
                        <p>Vote for the answer you’d actually use.</p>
                    </div>
                </li>
            </ol>
        </div>
        <section className="landing-provider-section" aria-label="Browse model providers">
            <p>Different models. One place to compare them.</p>
            <div className="landing-providers">
                {PROVIDERS.map(({ id, name }) => (
                    <span key={id}>
                        <ModelAvatar modelId={`${id}/example`} name={name} size="sm" />
                        {name}
                    </span>
                ))}
            </div>
            <Link to="/models" className="landing-text-link">
                Explore the live catalog <IconArrowUpRight aria-hidden size={16} />
            </Link>
        </section>

        <section className="landing-features" aria-labelledby="features-heading">
            <div className="landing-section-intro">
                <h2 id="features-heading">
                    An answer is only
                    <br />
                    part of the picture.
                </h2>
                <p>
                    The useful differences show up in the details.
                    <br />
                    Nexora keeps those details in view.
                </p>
            </div>
            <div className="landing-bento">
                <article className="landing-feature feature-cost">
                    <div className="feature-copy">
                        <h3>Know what that answer cost.</h3>
                        <p>
                            Time to first token, generation speed, token count, and
                            per-call cost. Free answers show $0.0000. Provider-reported
                            costs are measured; estimates are identified.
                        </p>
                    </div>
                    <div
                        className="cost-illustration"
                        aria-label="Illustrative per-answer measurements"
                    >
                        <div className="illustration-label">
                            <span>Every answer, measured</span>
                            <span>Example</span>
                        </div>
                        <dl className="cost-receipt numeric">
                            <div>
                                <dt>First token</dt>
                                <dd>
                                    0.42<span> s</span>
                                </dd>
                            </div>
                            <div>
                                <dt>Generation</dt>
                                <dd>
                                    68<span> tok/s</span>
                                </dd>
                            </div>
                            <div>
                                <dt>Tokens</dt>
                                <dd>312</dd>
                            </div>
                            <div>
                                <dt>Cost</dt>
                                <dd>$0.0018</dd>
                            </div>
                        </dl>
                        <div className="cost-receipt-foot">
                            <IconCheck aria-hidden size={16} /> In the arena, these
                            numbers come from the call.
                        </div>
                    </div>
                </article>
                <article className="landing-feature feature-followup">
                    <div className="feature-copy">
                        <h3>Keep the conversation going.</h3>
                        <p>
                            Ask a follow-up. Each model remembers its own answers, so you
                            can see which one holds up beyond the first reply.
                        </p>
                    </div>
                    <div
                        className="followup-illustration"
                        aria-label="Example follow-up continues each model’s own conversation"
                    >
                        <div className="followup-message">
                            <IconMessageCircle aria-hidden size={18} />
                            <span>What if two requests arrive at once?</span>
                        </div>
                        <div className="followup-tracks">
                            {PROVIDERS.slice(0, 3).map(({ id, name }) => (
                                <div key={id}>
                                    <ModelAvatar
                                        modelId={`${id}/example`}
                                        name={name}
                                        size="sm"
                                    />
                                    <span className="followup-track" />
                                    <span className="followup-node" />
                                    <span className="followup-track" />
                                    <span className="followup-node followup-node-last" />
                                </div>
                            ))}
                        </div>
                        <p>Same follow-up. Three separate conversations.</p>
                    </div>
                </article>
                <article className="landing-feature feature-share">
                    <div className="feature-copy">
                        <h3>Share the whole comparison.</h3>
                        <p>
                            Send a read-only link with the prompts, answers, numbers, and
                            winner. Revoke access whenever you choose.
                        </p>
                    </div>
                    <div
                        className="share-illustration"
                        aria-label="Share links are read-only and can be revoked"
                    >
                        <div className="share-link-row">
                            <IconLink aria-hidden size={20} />
                            <span>One link. The full picture.</span>
                            <IconArrowUpRight aria-hidden size={17} />
                        </div>
                        <div className="share-permissions">
                            <span>
                                <IconLock aria-hidden size={15} />
                                Read-only
                            </span>
                            <span>
                                <IconCheck aria-hidden size={15} />
                                Revocable
                            </span>
                        </div>
                    </div>
                </article>
                <article className="landing-feature feature-record">
                    <div className="feature-copy">
                        <h3>Your votes build a useful record.</h3>
                        <p>
                            See what wins across the community, or just for you. Free and
                            paid models have separate rankings, with vote volume alongside
                            the results.
                        </p>
                    </div>
                    <div
                        className="record-illustration"
                        aria-label="Global and personal leaderboards contain win rate, first-token timing and speed"
                    >
                        <div className="record-top">
                            <IconTrophy aria-hidden size={19} />
                            <span>Leaderboard</span>
                            <span className="record-scope">Global / Personal</span>
                        </div>
                        <div className="record-fields">
                            <span>Model</span>
                            <span>Win rate</span>
                            <span>First token</span>
                            <span>Speed</span>
                        </div>
                        <div className="record-models">
                            {PROVIDERS.slice(0, 3).map(({ id, name }) => (
                                <span key={id}>
                                    <ModelAvatar
                                        modelId={`${id}/example`}
                                        name={name}
                                        size="sm"
                                    />
                                    {name}
                                </span>
                            ))}
                        </div>
                        <Link to="/leaderboard" className="landing-text-link">
                            See the actual standings{" "}
                            <IconArrowUpRight aria-hidden size={16} />
                        </Link>
                    </div>
                </article>
            </div>
        </section>

        <section className="landing-plans" aria-labelledby="landing-plans-heading">
            <div>
                <h2 id="landing-plans-heading">
                    Start free.
                    <br />
                    Go deeper when you need to.
                </h2>
                <p>
                    Free models to find your footing. Paid plans for a wider range
                    <br className="hero-line-break" /> of models, with a clear monthly
                    answer allowance.
                </p>
            </div>
            <div className="landing-plan-choice">
                <div>
                    <span>Free</span>
                    <strong>$0</strong>
                    <p>{FREE_ANSWERS_PER_DAY} free-model answers per day</p>
                </div>
                <div>
                    <span>Paid plans from</span>
                    <strong>
                        ${PAID_PLANS[0].monthlyUsd}
                        <small> / month</small>
                    </strong>
                    <p>Standard, Advanced &amp; Frontier allowances</p>
                </div>
                <Link to="/plans" className={buttonClasses({ variant: "outline" })}>
                    Compare plans <IconArrowRight aria-hidden size={17} />
                </Link>
            </div>
        </section>

        <section className="landing-faq" aria-labelledby="faq-heading">
            <h2 id="faq-heading">A few things to know.</h2>
            <div>
                {FAQS.map(({ question, answer }) => (
                    <details key={question}>
                        <summary>
                            {question}
                            <span className="faq-plus" aria-hidden />
                        </summary>
                        <p>{answer}</p>
                    </details>
                ))}
            </div>
        </section>

        <section className="landing-close" aria-labelledby="close-heading">
            <h2 id="close-heading">
                The best model?
                <br />
                <span>You be the judge.</span>
            </h2>
            <p>Bring a question you care about. See what comes back.</p>
            <Link to="/app" className={buttonClasses({ variant: "primary", size: "lg" })}>
                Start your first comparison <IconArrowRight aria-hidden size={18} />
            </Link>
        </section>
    </PublicLayout>
);
