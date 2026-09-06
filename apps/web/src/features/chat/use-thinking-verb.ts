import { useEffect, useState } from "react";

const VERBS = [
    "Thinking",
    "Pondering",
    "Reasoning",
    "Deliberating",
    "Composing",
    "Weighing",
    "Considering",
    "Formulating",
    "Assembling",
    "Measuring",
    "Mulling",
    "Ruminating",
] as const;

const ROTATE_MS = 2400;

const seedFrom = (id: string): number =>
    [...id].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % VERBS.length, 7);

export const useThinkingVerb = (id: string, active: boolean): string => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!active) return;

        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        const timer = window.setInterval(
            () => setStep((current) => current + 1),
            ROTATE_MS,
        );

        return () => window.clearInterval(timer);
    }, [active]);

    return VERBS[(seedFrom(id) + step) % VERBS.length] ?? VERBS[0];
};
