import { decodeStreamEvent } from "./chat-stream-protocol";
import type { ChatRequest, ChatStreamEvent } from "./chat-stream-protocol";

const refusalSentence = async (response: Response): Promise<string | null> => {
    const body: unknown = await response.json().catch(() => null);

    if (typeof body !== "object" || body === null) return null;

    const message = (body as Readonly<{ message?: unknown }>).message;

    return typeof message === "string" && message.length > 0 ? message : null;
};

export const readModelStream = async (
    request: ChatRequest,
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal,
): Promise<void> => {
    let response: Response;

    try {
        response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
            signal,
        });
    } catch (error) {
        if (signal?.aborted) return;
        console.error("[chat] request failed to reach the server", error);
        onEvent({
            type: "error",
            message: "We could not reach the server. Check your connection and retry.",
        });
        return;
    }

    if (!response.ok || !response.body) {
        console.error(`[chat] server replied ${response.status}`);
        onEvent({
            type: "error",
            message:
                (await refusalSentence(response)) ??
                "This model could not answer just now. You can retry it on its own.",
        });
        return;
    }

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";

    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += value;
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            lines.forEach((line) => {
                const event = decodeStreamEvent(line);
                if (event) onEvent(event);
            });
        }

        const trailing = decodeStreamEvent(buffer);
        if (trailing) onEvent(trailing);
    } catch (error) {
        if (signal?.aborted) return;
        console.error("[chat] stream broke mid-answer", error);
        onEvent({
            type: "error",
            message: "The answer stopped partway through. You can retry it on its own.",
        });
    } finally {
        reader.releaseLock();
    }
};
