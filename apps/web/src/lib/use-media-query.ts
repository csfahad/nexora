import { useEffect, useState } from "react";

export const useMediaQuery = (query: string, defaultValue = false): boolean => {
    const [matches, setMatches] = useState(defaultValue);

    useEffect(() => {
        const mql = window.matchMedia(query);
        setMatches(mql.matches);

        const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
        mql.addEventListener("change", onChange);
        return () => mql.removeEventListener("change", onChange);
    }, [query]);

    return matches;
};
