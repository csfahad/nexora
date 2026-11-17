export const draftStorageKey = (key: string): string => `nexora:draft:${key}`;
const DRAFT_RESET_EVENT = "nexora:draft-reset";
const ALL_DRAFTS = "*";

export const resetComposerDraft = (key: string): void => {
    try {
        window.sessionStorage.removeItem(draftStorageKey(key));
    } catch {}
    window.dispatchEvent(new CustomEvent<string>(DRAFT_RESET_EVENT, { detail: key }));
};

export const subscribeToDraftReset = (key: string, onReset: () => void): (() => void) => {
    const listener = (event: Event) => {
        if (
            event instanceof CustomEvent &&
            (event.detail === key || event.detail === ALL_DRAFTS)
        )
            onReset();
    };
    window.addEventListener(DRAFT_RESET_EVENT, listener);
    return () => window.removeEventListener(DRAFT_RESET_EVENT, listener);
};

export const clearSubmittedDraft = (key: string, prompt: string): void => {
    try {
        const storageKey = draftStorageKey(key);
        if (window.sessionStorage.getItem(storageKey)?.trim() === prompt.trim()) {
            window.sessionStorage.removeItem(storageKey);
        }
    } catch {}
};

export const restoreSubmittedDraft = (key: string, prompt: string): void => {
    try {
        const storageKey = draftStorageKey(key);
        if (!(window.sessionStorage.getItem(storageKey) ?? "").trim()) {
            window.sessionStorage.setItem(storageKey, prompt);
        }
    } catch {}
};

export const resetAllComposerDrafts = (): void => {
    try {
        const storage = window.sessionStorage;
        const keys = Array.from({ length: storage.length }, (_, index) =>
            storage.key(index),
        );
        keys.filter(
            (key): key is string => key?.startsWith("nexora:draft:") ?? false,
        ).forEach((key) => storage.removeItem(key));
    } catch {}
    window.dispatchEvent(
        new CustomEvent<string>(DRAFT_RESET_EVENT, { detail: ALL_DRAFTS }),
    );
};
