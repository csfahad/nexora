/* eslint-disable no-restricted-properties -- This probe deliberately changes build-time env to reproduce missing CI configuration. */
import assert from "node:assert/strict";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import ts from "typescript";

// Use the real SDKs against an in-memory ingestion endpoint. No events leave this process.
const loadModule = async (source) => {
    const compiled = ts
        .transpileModule(source, {
            compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.ESNext,
            },
        })
        .outputText.replace(
            /from "([^"]+)"/g,
            (_, specifier) => `from ${JSON.stringify(import.meta.resolve(specifier))}`,
        )
        .replace(
            /import "([^"]+)"/g,
            (_, specifier) => `import ${JSON.stringify(import.meta.resolve(specifier))}`,
        );
    return import(
        `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
    );
};

const envKeys = ["POSTHOG_KEY", "POSTHOG_HOST", "VITE_POSTHOG_KEY", "VITE_POSTHOG_HOST"];
const savedEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
const originalCwd = process.cwd();
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;
const originalProbeAnalytics = globalThis.nexoraProbeAnalytics;
const requests = [];
const warnings = [];

try {
    // An empty cwd reproduces CI, where the developer's .env is absent.
    process.chdir(await mkdtemp(join(tmpdir(), "nexora-posthog-")));
    for (const key of envKeys) delete process.env[key];
    const config = (
        await loadModule(
            await readFile(new URL("../vite.config.ts", import.meta.url), "utf8"),
        )
    ).default;
    assert.throws(() => config({ mode: "production" }), /PostHog requires/);
    process.env.POSTHOG_KEY = "phc_analytics_test";
    process.env.POSTHOG_HOST = "https://posthog.test";
    const fallback = config({ mode: "production" });
    assert.equal(
        JSON.parse(fallback.define["import.meta.env.VITE_POSTHOG_KEY"]),
        process.env.POSTHOG_KEY,
    );
    assert.equal(
        JSON.parse(fallback.define["import.meta.env.VITE_POSTHOG_HOST"]),
        process.env.POSTHOG_HOST,
    );
    process.env.VITE_POSTHOG_KEY = "phc_other_project";
    assert.throws(() => config({ mode: "production" }), /same project/);
    delete process.env.VITE_POSTHOG_KEY;
    process.env.VITE_POSTHOG_HOST = "https://other.posthog.test";
    assert.throws(() => config({ mode: "production" }), /same project/);
    delete process.env.VITE_POSTHOG_HOST;
    process.env.POSTHOG_KEY = "phx_personal_secret";
    assert.throws(() => config({ mode: "production" }), /PostHog requires/);
    const turbo = JSON.parse(
        await readFile(new URL("../../../turbo.json", import.meta.url), "utf8"),
    );
    for (const key of envKeys)
        assert.ok(
            turbo.tasks.build.env.includes(key),
            `${key} must survive Turbo strict mode`,
        );

    console.error = (...args) => warnings.push(args);
    globalThis.fetch = async (input, init) => {
        const url = new URL(
            typeof input === "string" ? input : (input.url ?? String(input)),
        );
        assert.equal(
            url.hostname,
            "posthog.test",
            "The probe must never contact a real ingestion endpoint",
        );
        const headers = new Headers(init?.headers);
        let body = init?.body;
        if (headers.get("content-encoding") === "gzip")
            body = gunzipSync(body).toString();
        if (body) requests.push({ url, payload: JSON.parse(String(body)) });
        return new Response(JSON.stringify({ status: 1 }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    };
    const source = (
        await readFile(
            new URL("../src/infrastructure/posthog.ts", import.meta.url),
            "utf8",
        )
    ).replace(
        'import { serverEnv } from "@/infrastructure/env";',
        'const serverEnv = () => ({ POSTHOG_KEY: "phc_analytics_test", POSTHOG_HOST: "https://posthog.test" });',
    );
    const analytics = await loadModule(source);
    const events = () =>
        requests.flatMap(
            ({ payload }) =>
                payload.batch ?? payload.events ?? (payload.event ? [payload] : []),
        );
    await Promise.all(
        ["https://nexora.csfahad.in", "http://localhost:3000"].map((origin) =>
            analytics.withPostHogRequest(new Request(`${origin}/app`), async () => {
                await analytics.capturePromptSent({
                    userId: "viewer",
                    threadId: "thread",
                    turnId: origin,
                    modelIds: ["model"],
                    available: 1,
                    followUp: false,
                });
            }),
        ),
    );
    const prompts = events().filter((event) => event.event === "prompt_sent");
    assert.equal(
        prompts.length,
        2,
        "Both environments must deliver events before any flush",
    );
    for (const prompt of prompts)
        assert.equal(prompt.properties.$current_url, `${prompt.properties.turn_id}/app`);

    await analytics.captureVoteCast({
        userId: "viewer",
        turnId: "turn",
        winnerResponseId: "answer",
        winnerModelId: "model",
        candidateModelIds: ["model", "other"],
    });
    await analytics.captureAnswerFinished({
        userId: "viewer",
        threadId: "thread",
        turnId: "turn",
        responseId: "answer",
        modelId: "model",
        outcome: "complete",
        ttftMs: 200,
        durationMs: 1500,
        totalTokens: 120,
        tokensPerSecond: 13,
        costUsd: 0.004,
    });
    const generation = {
        userId: "viewer",
        traceId: "turn",
        modelId: "model",
        input: [
            { role: "user", content: "Earlier prompt" },
            { role: "assistant", content: "Earlier answer" },
            { role: "user", content: "Follow-up" },
        ],
        answer: "Answer",
        latencyMs: 1500,
        ttftMs: 200,
        promptTokens: 100,
        completionTokens: 20,
        costUsd: 0.004,
        properties: { operation: "answer" },
    };
    await analytics.captureGeneration(generation);
    await analytics.captureGeneration({
        ...generation,
        traceId: "title",
        costUsd: 0,
        properties: { operation: "thread_title" },
    });
    await analytics.captureGeneration({
        ...generation,
        traceId: "failed",
        error: new Error("Provider failed"),
    });
    const generations = events().filter((event) => event.event === "$ai_generation");
    assert.equal(
        generations.length,
        3,
        "AI generations must arrive without a background flush",
    );
    const answer = generations.find((event) => event.properties.$ai_trace_id === "turn");
    assert.equal(
        answer.properties.$ai_total_cost_usd,
        0.004,
        "Total cost must not be multiplied by token counts",
    );
    assert.equal(answer.properties.$ai_input_tokens, 100);
    assert.equal(answer.properties.$ai_output_tokens, 20);
    assert.equal(answer.properties.$ai_latency, 1.5);
    assert.equal(answer.properties.$ai_time_to_first_token, 0.2);
    assert.deepEqual(answer.properties.$ai_input, generation.input);
    assert.equal(
        generations.find((event) => event.properties.$ai_trace_id === "failed").properties
            .$ai_is_error,
        true,
    );

    await analytics.withPostHogRequest(
        new Request("https://nexora.csfahad.in/app?private=value"),
        async () => {
            analytics.reportServerError(
                "[probe] application failed:",
                new Error("Test failure"),
            );
            analytics.captureServerRequest(
                new Request("https://nexora.csfahad.in/app?private=value"),
                503,
                35,
            );
            await analytics.flushPostHog();
        },
    );
    assert.ok(
        events().some((event) => event.event === "$exception"),
        "Caught errors must reach Error Tracking",
    );
    const logs = requests.flatMap(({ payload }) => payload.resourceLogs ?? []);
    assert.ok(logs.length > 0, "Server logs must use the OTLP Logs endpoint");
    const logText = JSON.stringify(logs);
    assert.ok(logText.includes("nexora-server"));
    assert.ok(logText.includes("Test failure"));
    assert.ok(logText.includes("http.response.status_code"));
    assert.ok(!logText.includes("private=value"), "Request logs must omit query strings");

    globalThis.nexoraProbeAnalytics = analytics;
    const startSource = (
        await readFile(new URL("../src/start.ts", import.meta.url), "utf8")
    ).replace(
        'await import("@/infrastructure/posthog")',
        "await Promise.resolve(globalThis.nexoraProbeAnalytics)",
    );
    const { startInstance } = await loadModule(startSource);
    const [observability, csrf] = startInstance.getOptions().requestMiddleware;
    assert.ok(csrf, "Custom middleware must preserve the framework's CSRF protection");
    const blocked = await csrf.options.server({
        request: new Request("https://nexora.csfahad.in/_serverFn/test", {
            method: "POST",
            headers: { Origin: "https://untrusted.test" },
        }),
        handlerType: "serverFn",
        next: () => {
            throw new Error("A cross-origin server function must not run");
        },
    });
    assert.equal(blocked.status, 403);
    const allowed = await csrf.options.server({
        request: new Request("https://nexora.csfahad.in/_serverFn/test", {
            method: "POST",
            headers: { Origin: "https://nexora.csfahad.in" },
        }),
        handlerType: "serverFn",
        next: () => "allowed",
    });
    assert.equal(allowed, "allowed");
    const deliveredBeforeMiddleware = requests.length;
    const result = await observability.options.server({
        request: new Request("https://nexora.csfahad.in/privacy"),
        next: async () => ({ response: new Response("ok") }),
    });
    assert.equal(result.response.status, 200);
    assert.ok(
        requests.length > deliveredBeforeMiddleware,
        "Middleware must flush Logs before returning",
    );
    const failure = new Error("Unhandled request failure");
    await assert.rejects(
        () =>
            observability.options.server({
                request: new Request("https://nexora.csfahad.in/privacy"),
                next: async () => {
                    throw failure;
                },
            }),
        (error) => error === failure,
    );
    assert.ok(
        events().some(
            (event) =>
                event.event === "$exception" &&
                JSON.stringify(event).includes(failure.message),
        ),
    );

    globalThis.fetch = async () => {
        throw new Error("Ingestion unavailable");
    };
    await assert.doesNotReject(() =>
        analytics.capturePromptSent({
            userId: "viewer",
            threadId: "thread",
            turnId: "offline",
            modelIds: ["model"],
            available: 1,
            followUp: false,
        }),
    );
    const unavailable = await loadModule(
        source.replace(
            '({ POSTHOG_KEY: "phc_analytics_test", POSTHOG_HOST: "https://posthog.test" })',
            '{ throw new Error("Invalid server environment"); }',
        ),
    );
    await assert.doesNotReject(() => unavailable.captureGeneration(generation));
    assert.equal(
        unavailable.withPostHogRequest(
            new Request("https://nexora.csfahad.in"),
            () => "request still works",
        ),
        "request still works",
    );
    console.log(
        "PostHog checks passed: build config, shared project, prod/dev delivery, AI cost/context, exceptions, OTLP logs, and failure isolation.",
    );
} finally {
    process.chdir(originalCwd);
    for (const [key, value] of Object.entries(savedEnv)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    if (originalProbeAnalytics === undefined) delete globalThis.nexoraProbeAnalytics;
    else globalThis.nexoraProbeAnalytics = originalProbeAnalytics;
}
