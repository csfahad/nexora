export const RESPONSE_FAILURE = {
    PROVIDER: "PROVIDER",
    CANCELLED: "CANCELLED",
    MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE",
    INTERRUPTED: "INTERRUPTED",
} as const;

export type ResponseFailure = (typeof RESPONSE_FAILURE)[keyof typeof RESPONSE_FAILURE];

const SENTENCES: Readonly<Record<ResponseFailure, string>> = {
    PROVIDER: "This model could not answer just now. You can retry it on its own.",
    CANCELLED: "You stopped this answer.",
    MODEL_UNAVAILABLE: "This model isn't on the free list anymore, so it wasn't asked.",
    INTERRUPTED: "This answer was interrupted before it finished.",
};

const isKnown = (code: string): code is ResponseFailure => code in SENTENCES;

export const failureSentence = (code: string | null): string =>
    code !== null && isKnown(code) ? SENTENCES[code] : SENTENCES.PROVIDER;
