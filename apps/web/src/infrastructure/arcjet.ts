import arcjet, {
    detectBot,
    detectPromptInjection,
    shield,
    tokenBucket,
} from "@arcjet/node";
import type { ArcjetDecision, ArcjetNodeRequest, ArcjetReason } from "@arcjet/node";
import { getRequestIP } from "@tanstack/react-start/server";
import { serverEnv } from "@/infrastructure/env";

const HOURLY_MODEL_CALLS = 30;

const buildBase = () =>
    arcjet({
        key: serverEnv().ARCJET_KEY,
        rules: [shield({ mode: "LIVE" }), detectBot({ mode: "LIVE", allow: [] })],
    });

let base: ReturnType<typeof buildBase> | undefined;

export const arcjetClient = (): ReturnType<typeof buildBase> => {
    if (base) return base;

    base = buildBase();

    return base;
};

const spendRule = tokenBucket({
    mode: "LIVE",
    characteristics: ["userId"],
    capacity: HOURLY_MODEL_CALLS,
    refillRate: HOURLY_MODEL_CALLS,
    interval: "1h",
});

const injectionRule = detectPromptInjection({ mode: "LIVE" });

const buildPromptClient = () =>
    arcjetClient().withRule(spendRule).withRule(injectionRule);
const buildSpendClient = () => arcjetClient().withRule(spendRule);
const buildInjectionClient = () => arcjetClient().withRule(injectionRule);

let promptClient: ReturnType<typeof buildPromptClient> | undefined;
let spendClient: ReturnType<typeof buildSpendClient> | undefined;
let injectionClient: ReturnType<typeof buildInjectionClient> | undefined;

const toNodeRequest = (request: Request): ArcjetNodeRequest => ({
    headers: Object.fromEntries(request.headers),
    method: request.method,
    url: request.url,
    body: "",
});

const trustedIp = (): string | undefined => getRequestIP();

export type RequestVerdict =
    | Readonly<{ status: "allowed" }>
    | Readonly<{ status: "blocked"; message: string; httpStatus: number }>;

const ALLOWED: RequestVerdict = { status: "allowed" };

const RATE_LIMITED = "You've started a lot of model answers in the last hour.";
const PROMPT_REFUSED =
    "We couldn't send that prompt: it reads as an attempt to override a model's own instructions. Reword it and send it again.";
const REQUEST_REFUSED = "We couldn't accept that request. Reload the page and try again.";

const untilReset = (seconds: number): string => {
    const minutes = Math.ceil(Math.max(seconds, 0) / 60);

    if (minutes <= 1) return "in about a minute";
    if (minutes < 60) return `in about ${minutes} minutes`;

    const hours = Math.ceil(minutes / 60);

    return hours === 1 ? "in about an hour" : `in about ${hours} hours`;
};

const blockingReasons = (decision: ArcjetDecision): readonly ArcjetReason[] => {
    const denied = decision.results
        .filter((result) => result.conclusion === "DENY" && result.state !== "DRY_RUN")
        .map((result) => result.reason);

    if (denied.length > 0) return denied;

    return decision.isDenied() ? [decision.reason] : [];
};

const failures = (decision: ArcjetDecision): readonly string[] => {
    const perRule = decision.results.flatMap((result) =>
        result.reason.isError() ? [result.reason.message] : [],
    );

    if (perRule.length > 0) return perRule;

    return decision.isErrored() ? [decision.reason.message] : [];
};

const verdictFor = (decision: ArcjetDecision, path: string): RequestVerdict => {
    failures(decision).forEach((message) => {
        console.error(`[arcjet] ${path} was not fully checked:`, message);
    });

    const reasons = blockingReasons(decision);

    if (reasons.length === 0) return ALLOWED;

    const types = reasons.map((reason) => reason.type ?? "unknown").join(", ");

    console.warn(`[arcjet] blocked ${path}: ${types}`);

    const resets = reasons.flatMap((reason) =>
        reason.isRateLimit() ? [reason.reset] : [],
    );

    if (resets.length > 0) {
        return {
            status: "blocked",
            message: `${RATE_LIMITED} Try again ${untilReset(Math.max(...resets))}.`,
            httpStatus: 429,
        };
    }

    if (reasons.some((reason) => reason.isPromptInjection())) {
        return { status: "blocked", message: PROMPT_REFUSED, httpStatus: 400 };
    }

    return { status: "blocked", message: REQUEST_REFUSED, httpStatus: 403 };
};

const injectionUnchecked = (decision: ArcjetDecision): boolean =>
    !decision.results.some((result) => result.reason.isPromptInjection());

const rescreenInjection = async (
    request: Request,
    prompt: string,
): Promise<RequestVerdict> => {
    if (!injectionClient) injectionClient = buildInjectionClient();

    const decision = await injectionClient.protect(toNodeRequest(request), {
        detectPromptInjectionMessage: prompt,
        ipSrc: trustedIp(),
    });

    return verdictFor(decision, "startTurn recheck");
};

export const screenPrompt = async (
    request: Request,
    input: Readonly<{ userId: string; prompt: string; models: number }>,
): Promise<RequestVerdict> => {
    if (!promptClient) promptClient = buildPromptClient();

    const decision = await promptClient.protect(toNodeRequest(request), {
        userId: input.userId,
        requested: input.models,
        detectPromptInjectionMessage: input.prompt,
        ipSrc: trustedIp(),
    });

    const verdict = verdictFor(decision, "startTurn");

    if (verdict.status === "blocked") return verdict;

    return injectionUnchecked(decision)
        ? rescreenInjection(request, input.prompt)
        : verdict;
};

export const screenRetry = async (
    request: Request,
    input: Readonly<{ userId: string }>,
): Promise<RequestVerdict> => {
    if (!spendClient) spendClient = buildSpendClient();

    const decision = await spendClient.protect(toNodeRequest(request), {
        userId: input.userId,
        requested: 1,
        ipSrc: trustedIp(),
    });

    return verdictFor(decision, "retryResponse");
};

export const screenStream = async (request: Request): Promise<RequestVerdict> => {
    const decision = await arcjetClient().protect(toNodeRequest(request), {
        ipSrc: trustedIp(),
    });

    return verdictFor(decision, "/api/chat");
};
