import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { IconMessageCircle } from "@tabler/icons-react";
import { ModelAvatar } from "@/components/ui/model-avatar";

const FRAGMENTS = [
    { id: "code", kind: "code" },
    { id: "models-far", kind: "models" },
    { id: "answer", kind: "answer" },
    { id: "conversation-far", kind: "conversation" },
    { id: "models", kind: "models" },
    { id: "code-far", kind: "code" },
    { id: "conversation", kind: "conversation" },
    { id: "answer-far", kind: "answer" },
] as const;

type Fragment = (typeof FRAGMENTS)[number];

const FragmentContent = ({ kind }: { readonly kind: Fragment["kind"] }) => {
    if (kind === "code")
        return (
            <>
                <span className="hero-fragment-label">A second look at your code</span>
                <pre>
                    <code>
                        <span className="hero-code-keyword">await</span>
                        {
                            " db.transaction(\n  async (tx) => {\n    await tx.events.create({\n      id: event.id\n    });\n    await applyPayment(tx);\n  }\n);"
                        }
                    </code>
                </pre>
            </>
        );
    if (kind === "models")
        return (
            <>
                <span className="hero-fragment-label">Different perspectives</span>
                <div className="hero-fragment-models">
                    {[
                        { id: "openai", name: "OpenAI" },
                        { id: "anthropic", name: "Anthropic" },
                        { id: "google", name: "Google" },
                    ].map(({ id, name }) => (
                        <div key={id}>
                            <ModelAvatar
                                modelId={`${id}/example`}
                                name={name}
                                size="sm"
                            />
                            <span>{name}</span>
                        </div>
                    ))}
                </div>
            </>
        );
    if (kind === "answer")
        return (
            <>
                <span className="hero-fragment-label">Find the right words</span>
                <p className="hero-fragment-title">A clearer reply.</p>
                <p>Your order will arrive on Thursday, two days later than expected.</p>
                <span className="hero-fragment-rule" />
                <p className="hero-fragment-detail">Clear timing. A useful next step.</p>
            </>
        );
    return (
        <>
            <span className="hero-fragment-label">Keep thinking it through</span>
            <IconMessageCircle size={22} stroke={1.5} />
            <p className="hero-fragment-title">What if two requests arrive at once?</p>
            <p>One follow-up. Three separate conversations.</p>
        </>
    );
};

export const HeroShowcase = ({ children }: { readonly children: ReactNode }) => {
    const showcaseRef = useRef<HTMLDivElement>(null);
    const inViewRef = useRef(false);

    useEffect(() => {
        const showcase = showcaseRef.current;
        const backdrop = showcase?.querySelector(".hero-backdrop");
        if (!showcase || !backdrop) return;
        const updateVisibility = () => {
            showcase.dataset.active = String(inViewRef.current && !document.hidden);
        };
        const observer = new IntersectionObserver((entries) => {
            inViewRef.current = entries.some((entry) => entry.isIntersecting);
            updateVisibility();
        });
        observer.observe(backdrop);
        document.addEventListener("visibilitychange", updateVisibility);
        return () => {
            observer.disconnect();
            document.removeEventListener("visibilitychange", updateVisibility);
        };
    }, []);

    return (
        <div className="hero-showcase" ref={showcaseRef}>
            <div className="hero-backdrop" aria-hidden="true">
                <div className="hero-backdrop-track">
                    {["previous", "current", "next"].map((copy) => (
                        <div className="hero-backdrop-scene" key={copy}>
                            {FRAGMENTS.map((fragment) => (
                                <div
                                    className="hero-backdrop-fragment"
                                    data-fragment={fragment.id}
                                    key={fragment.id}
                                >
                                    <FragmentContent kind={fragment.kind} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            {children}
        </div>
    );
};
