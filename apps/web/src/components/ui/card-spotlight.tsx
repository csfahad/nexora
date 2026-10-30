import type { ComponentProps, ReactNode } from "react";
import {
    motion,
    useMotionTemplate,
    useMotionValue,
    useReducedMotion,
} from "motion/react";
import { cn } from "@/lib/utils";

export const CardSpotlight = ({
    children,
    className,
    ...props
}: ComponentProps<"article"> & {
    readonly children: ReactNode;
}) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const reduced = useReducedMotion();
    const maskImage = useMotionTemplate`radial-gradient(280px circle at ${x}px ${y}px, white, transparent 80%)`;
    return (
        <article
            {...props}
            className={cn("card-spotlight", className)}
            onPointerMove={(event) => {
                if (reduced || event.pointerType === "touch") return;
                const { left, top } = event.currentTarget.getBoundingClientRect();
                x.set(event.clientX - left);
                y.set(event.clientY - top);
            }}
        >
            <motion.div
                aria-hidden
                className="card-spotlight-light"
                style={{ maskImage }}
            />
            <div className="card-spotlight-content">{children}</div>
        </article>
    );
};
