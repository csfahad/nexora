import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const SLACK_PX = 96;
const TOP_BUTTON_AFTER_PX = 600;

const useLayoutEffectSafely = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const useThreadScroll = ({
    jumpOn,
    followOn,
}: Readonly<{ jumpOn: number; followOn: number }>): Readonly<{
    scrollerRef: RefObject<HTMLDivElement | null>;
    settled: boolean;
    scrolled: boolean;
    toTop: () => void;
}> => {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const pinned = useRef(true);
    const arrived = useRef(false);

    const [settled, setSettled] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const scroller = scrollerRef.current;

        if (scroller === null) return;

        const onScroll = () => {
            pinned.current =
                scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <
                SLACK_PX;

            setScrolled(scroller.scrollTop > TOP_BUTTON_AFTER_PX);
        };

        scroller.addEventListener("scroll", onScroll, { passive: true });

        return () => scroller.removeEventListener("scroll", onScroll);
    }, []);

    useLayoutEffectSafely(() => {
        const scroller = scrollerRef.current;

        if (scroller === null) return;

        pinned.current = true;

        if (!arrived.current) {
            arrived.current = true;
            scroller.scrollTop = scroller.scrollHeight;
            setSettled(true);

            return;
        }

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        scroller.scrollTo({
            top: scroller.scrollHeight,
            behavior: reduced ? "auto" : "smooth",
        });
    }, [jumpOn]);

    useEffect(() => {
        const scroller = scrollerRef.current;

        if (scroller === null || !pinned.current) return;

        scroller.scrollTop = scroller.scrollHeight;
    }, [followOn]);

    const toTop = useCallback(() => {
        const scroller = scrollerRef.current;

        if (scroller === null) return;

        pinned.current = false;

        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        scroller.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }, []);

    return { scrollerRef, settled, scrolled, toTop };
};
