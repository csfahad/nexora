import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

type ShellChromeValue = Readonly<{
    trailing: ReactNode;
    setTrailing: (node: ReactNode) => void;
    crumbs: readonly string[] | null;
    setCrumbs: (crumbs: readonly string[] | null) => void;
}>;

const ShellChromeContext = createContext<ShellChromeValue | null>(null);

export const ShellChromeProvider = ({ children }: { readonly children: ReactNode }) => {
    const [trailing, setTrailing] = useState<ReactNode>(null);
    const [crumbs, setCrumbs] = useState<readonly string[] | null>(null);
    const value = useMemo(
        () => ({ trailing, setTrailing, crumbs, setCrumbs }),
        [trailing, crumbs],
    );

    return (
        <ShellChromeContext.Provider value={value}>
            {children}
        </ShellChromeContext.Provider>
    );
};

export const useShellChrome = (): ShellChromeValue | null =>
    useContext(ShellChromeContext);

export const useTopBarTrailing = (node: ReactNode) => {
    const chrome = useShellChrome();
    const setTrailing = chrome?.setTrailing;

    useEffect(() => {
        if (!setTrailing) return;

        setTrailing(node);
        return () => setTrailing(null);
    }, [node, setTrailing]);
};

const UNIT_SEPARATOR = "\u001f";

export const useTopBarCrumbs = (crumbs: readonly string[]) => {
    const chrome = useShellChrome();
    const setCrumbs = chrome?.setCrumbs;
    const joined = crumbs.join(UNIT_SEPARATOR);

    useEffect(() => {
        if (!setCrumbs) return;

        setCrumbs(joined === "" ? null : joined.split(UNIT_SEPARATOR));
        return () => setCrumbs(null);
    }, [joined, setCrumbs]);
};
