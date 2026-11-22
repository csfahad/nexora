import { useRef } from "react";

const SLIDE_PX_PER_SECOND = 55;
const MIN_SLIDE_MS = 400;

const overflowWidth = (track: HTMLElement, text: HTMLElement): number => {
    const range = document.createRange();
    range.selectNodeContents(text);

    return range.getBoundingClientRect().width - track.getBoundingClientRect().width;
};

export const ThreadTitle = ({ title }: Readonly<{ title: string }>) => {
    const trackRef = useRef<HTMLSpanElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    const measure = (): void => {
        const track = trackRef.current;
        const text = textRef.current;

        if (track === null || text === null) return;

        const overflow = overflowWidth(track, text);

        if (overflow <= 0) {
            track.style.setProperty("--slide-shift", "0px");
            track.style.removeProperty("--slide-dur");
            return;
        }

        // Keep the final characters clear of the existing right-edge fade.
        const endPadding = Number.parseFloat(getComputedStyle(text).paddingInlineEnd);
        const distance = Math.ceil(overflow + endPadding);
        const duration = Math.max(
            MIN_SLIDE_MS,
            Math.round((distance / SLIDE_PX_PER_SECOND) * 1000),
        );

        track.style.setProperty("--slide-shift", `-${distance}px`);
        track.style.setProperty("--slide-dur", `${duration}ms`);
    };

    return (
        <span
            ref={trackRef}
            className="thread-title"
            title={title}
            onPointerEnter={measure}
            onFocus={measure}
        >
            <span ref={textRef}>{title}</span>
        </span>
    );
};
