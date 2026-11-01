import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { IconArrowUpRight } from "@tabler/icons-react";
import { PublicLayout } from "@/components/ui/public-layout";

export type LegalSection = Readonly<{ id: string; title: string; content: ReactNode }>;
export type LegalDocument = Readonly<{
    title: string;
    description: string;
    kind: "terms" | "privacy";
    summary: readonly Readonly<{ title: string; text: string }>[];
    sections: readonly LegalSection[];
}>;

const Contents = ({ sections }: { readonly sections: readonly LegalSection[] }) => (
    <nav aria-label="On this page">
        <ol>
            {sections.map(({ id, title }, index) => (
                <li key={id}>
                    <a href={`#${id}`}>
                        <span className="numeric">{index + 1}.</span>
                        {title}
                    </a>
                </li>
            ))}
        </ol>
    </nav>
);

export const LegalScreen = ({ document }: { readonly document: LegalDocument }) => (
    <PublicLayout>
        <div className="legal-page-content">
            <header className="legal-intro">
                <h1>{document.title}</h1>
                <p>{document.description}</p>
                <div className="legal-meta">
                    <span>Effective November 1, 2026</span>
                    <span>Operated by Nexora · India</span>
                </div>
            </header>
            <div className="legal-summary" aria-label="At a glance">
                {document.summary.map(({ title, text }) => (
                    <div key={title}>
                        <h2>{title}</h2>
                        <p>{text}</p>
                    </div>
                ))}
            </div>
            <p className="legal-summary-note">
                These highlights are a guide. The full{" "}
                {document.kind === "terms" ? "terms" : "policy"} below applies.
            </p>
            <details className="legal-mobile-contents">
                <summary>On this page</summary>
                <Contents sections={document.sections} />
            </details>
            <div className="legal-reading-layout">
                <aside className="legal-contents">
                    <p>On this page</p>
                    <Contents sections={document.sections} />
                    <a
                        className="legal-contact-link"
                        href="mailto:support@nexora.csfahad.in"
                    >
                        Contact Nexora <IconArrowUpRight aria-hidden size={16} />
                    </a>
                </aside>
                <article className="legal-document">
                    {document.sections.map(({ id, title, content }, index) => (
                        <section id={id} key={id} aria-labelledby={`${id}-heading`}>
                            <h2 id={`${id}-heading`}>
                                <span className="numeric">{index + 1}.</span>
                                {title}
                            </h2>
                            {content}
                        </section>
                    ))}
                    <div className="legal-document-end">
                        <p>
                            Questions about{" "}
                            {document.kind === "terms" ? "these terms" : "your privacy"}?
                        </p>
                        <a href="mailto:support@nexora.csfahad.in">
                            support@nexora.csfahad.in{" "}
                            <IconArrowUpRight aria-hidden size={16} />
                        </a>
                        <Link to={document.kind === "terms" ? "/privacy" : "/terms"}>
                            Read our{" "}
                            {document.kind === "terms"
                                ? "Privacy Policy"
                                : "Terms of Service"}
                        </Link>
                    </div>
                </article>
            </div>
        </div>
    </PublicLayout>
);
