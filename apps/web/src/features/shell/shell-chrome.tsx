import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type ShellChromeValue = Readonly<{
    trailing: ReactNode;
    setTrailing: (node: ReactNode) => void;
}>;

const ShellChromeContext = createContext<ShellChromeValue | null>(null);

export const ShellChromeProvider = ({ children }: { readonly children: ReactNode }) => {
    const [trailing, setTrailing] = useState<ReactNode>(null);
    const value = useMemo(() => ({ trailing, setTrailing }), [trailing]);

    return (
        <ShellChromeContext.Provider value={value}>
            {children}
        </ShellChromeContext.Provider>
    );
};

/** Read by the top bar. Null outside the provider, which renders nothing. */
export const useShellChrome = (): ShellChromeValue | null =>
    useContext(ShellChromeContext);

/**
 * Called by a screen to publish its top-bar content, and to take it back down on
 * the way out so it cannot outlive the screen that owns it.
 */
export const useTopBarTrailing = (node: ReactNode) => {
    const chrome = useShellChrome();
    const setTrailing = chrome?.setTrailing;

    useEffect(() => {
        if (!setTrailing) return;

        setTrailing(node);
        return () => setTrailing(null);
    }, [node, setTrailing]);
};
