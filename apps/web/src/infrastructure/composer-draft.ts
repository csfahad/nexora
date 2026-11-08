export const draftStorageKey = (key: string): string => `nexora:draft:${key}`;
const DRAFT_RESET_EVENT = "nexora:draft-reset";

export const resetComposerDraft = (key: string): void => {
    try {
        window.sessionStorage.removeItem(draftStorageKey(key));
    } catch {}
    window.dispatchEvent(new CustomEvent<string>(DRAFT_RESET_EVENT, { detail: key }));
};

export const subscribeToDraftReset = (key: string, onReset: () => void): (() => void) => {
    const listener = (event: Event) => {
        if (event instanceof CustomEvent && event.detail === key) onReset();
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
