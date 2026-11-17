export const createStore = <T>(initial: T) => {
    let snapshot = initial;
    const listeners = new Set<() => void>();

    return {
        getSnapshot: () => snapshot,
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        update: (change: (current: T) => T) => {
            snapshot = change(snapshot);
            listeners.forEach((listener) => listener());
        },
    };
};
