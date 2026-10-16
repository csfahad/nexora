export const RESPONSE_FAILURE = {
    PROVIDER: "PROVIDER",
    CANCELLED: "CANCELLED",
    MODEL_UNAVAILABLE: "MODEL_UNAVAILABLE",
    INTERRUPTED: "INTERRUPTED",
    ALLOWANCE_SPENT: "ALLOWANCE_SPENT",
    FREE_TIER_EXHAUSTED: "FREE_TIER_EXHAUSTED",
} as const;

export type ResponseFailure = (typeof RESPONSE_FAILURE)[keyof typeof RESPONSE_FAILURE];

const SENTENCES: Readonly<Record<ResponseFailure, string>> = {
    PROVIDER: "This model could not answer just now. You can retry it on its own.",
    CANCELLED: "You stopped this answer.",
    MODEL_UNAVAILABLE: "This model isn't in the arena anymore, so it wasn't asked.",
    INTERRUPTED: "This answer was interrupted before it finished.",
    ALLOWANCE_SPENT:
        "You've used this month's answers at this model's tier, so it wasn't asked.",
    FREE_TIER_EXHAUSTED:
        "You've used today's free answers. They reset at midnight UTC, and paid models aren't affected.",
};

const NOT_THE_MODELS_FAULT: readonly string[] = [
    RESPONSE_FAILURE.CANCELLED,
    RESPONSE_FAILURE.MODEL_UNAVAILABLE,
    RESPONSE_FAILURE.ALLOWANCE_SPENT,
    RESPONSE_FAILURE.FREE_TIER_EXHAUSTED,
];

export const notTheModelsFault = (failure: string | null): boolean =>
    failure !== null && NOT_THE_MODELS_FAULT.includes(failure);

const isKnown = (code: string): code is ResponseFailure => code in SENTENCES;

export const failureSentence = (code: string | null): string =>
    code !== null && isKnown(code) ? SENTENCES[code] : SENTENCES.PROVIDER;
