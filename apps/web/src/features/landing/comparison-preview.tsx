import { useState } from "react";
import {
    IconArrowUp,
    IconCheck,
    IconColumns3,
    IconLayoutSidebar,
    IconThumbUp,
} from "@tabler/icons-react";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { COMPARISON_EXAMPLES, EXAMPLE_PROVIDERS } from "./comparison-examples";

export const ComparisonPreview = () => {
    const [exampleId, setExampleId] = useState("code");
    const [winner, setWinner] = useState<number | null>(null);
    const example =
        COMPARISON_EXAMPLES.find(({ id }) => id === exampleId) ?? COMPARISON_EXAMPLES[0];

    return (
        <div className="comparison-preview" id="how-it-works">
            <div className="preview-window-header">
                <div className="preview-window-controls" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <IconLayoutSidebar size={16} stroke={1.5} />
                </div>
                <span className="preview-window-title">
                    Nexora <span aria-hidden>/</span> New comparison
                </span>
                <IconColumns3
                    className="preview-window-view"
                    size={16}
                    stroke={1.5}
                    aria-hidden
                />
            </div>
            <div className="preview-window-content">
                <div className="preview-toolbar">
                    <div
                        className="preview-scenarios"
                        role="group"
                        aria-label="Choose an example prompt"
                    >
                        {COMPARISON_EXAMPLES.map(({ id, label }) => (
                            <button
                                type="button"
                                key={id}
                                aria-pressed={exampleId === id}
                                onClick={() => {
                                    setExampleId(id);
                                    setWinner(null);
                                }}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <span className="preview-example-label">Interactive example</span>
                </div>
                <div className="preview-prompt">
                    <span className="preview-you">You</span>
                    <p>{example.prompt}</p>
                    <span className="preview-send" aria-hidden>
                        <IconArrowUp size={19} />
                    </span>
                </div>
                <div className="preview-branches" aria-hidden>
                    <svg viewBox="0 0 900 48" preserveAspectRatio="none">
                        <path d="M450 0V10 Q450 22 438 22H162 Q150 22 150 34V48 M450 0V48 M450 0V10 Q450 22 462 22H738 Q750 22 750 34V48" />
                    </svg>
                </div>
                <div className="preview-answers">
                    {example.answers.map((answer, index) => {
                        const provider = EXAMPLE_PROVIDERS[index];
                        const chosen = winner === index;
                        return (
                            <article
                                className="preview-answer"
                                data-chosen={chosen}
                                key={`${example.id}-${provider.name}`}
                            >
                                <div className="preview-model">
                                    <ModelAvatar
                                        modelId={provider.modelId}
                                        name={provider.name}
                                        size="sm"
                                    />
                                    <span>{provider.name}</span>
                                    <span className="preview-model-label">Example</span>
                                </div>
                                <div className="preview-answer-copy">
                                    <h3>{answer.title}</h3>
                                    <p>{answer.text}</p>
                                    <p className="preview-answer-detail">
                                        {answer.detail}
                                    </p>
                                </div>
                                <dl className="preview-metrics numeric">
                                    <div>
                                        <dt>First token</dt>
                                        <dd>{answer.ttft}</dd>
                                    </div>
                                    <div>
                                        <dt>Speed</dt>
                                        <dd>{answer.speed}</dd>
                                    </div>
                                    <div>
                                        <dt>Tokens</dt>
                                        <dd>{answer.tokens}</dd>
                                    </div>
                                    <div>
                                        <dt>Cost</dt>
                                        <dd>{answer.cost}</dd>
                                    </div>
                                </dl>
                                <button
                                    type="button"
                                    className="preview-vote"
                                    aria-pressed={chosen}
                                    aria-label={`Choose the ${provider.name} example answer`}
                                    onClick={() => setWinner(chosen ? null : index)}
                                >
                                    {chosen ? (
                                        <IconCheck aria-hidden size={16} />
                                    ) : (
                                        <IconThumbUp aria-hidden size={16} />
                                    )}
                                    {chosen ? "Your pick" : "Choose this answer"}
                                </button>
                            </article>
                        );
                    })}
                </div>
                <div className="preview-caption">
                    <p>Illustrative answers and metrics, not live model results.</p>
                    <p role="status" aria-live="polite">
                        {winner === null
                            ? "Read the answers. Pick the one you’d use."
                            : `${EXAMPLE_PROVIDERS[winner].name} is your pick. This example vote isn’t saved.`}
                    </p>
                </div>
            </div>
        </div>
    );
};
