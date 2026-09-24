import { useRef } from "react";

const SLIDE_PX_PER_SECOND = 55;
const MIN_SLIDE_MS = 400;

const overflowWidth = (track: HTMLElement, text: HTMLElement): number => {
    const range = document.createRange();
    range.selectNodeContents(text);

    const textWidth = range.getBoundingClientRect().width;

    return textWidth - track.getBoundingClientRect().width;
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
            track.style.removeProperty("--slide-shift");
            track.style.removeProperty("--slide-dur");
            return;
        }

        const distance = Math.ceil(overflow);
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
            onPointerEnter={measure}
            onFocus={measure}
        >
            <span ref={textRef}>{title}</span>
        </span>
    );
};
