export const ComparisonMark = () => (
    <div className="comparison-mark" aria-hidden>
        <svg viewBox="0 0 160 72" fill="none">
            <path
                d="M10 36h28c20 0 22-23 42-23h60M10 36h130M10 36h28c20 0 22 23 42 23h60"
                stroke="var(--border)"
                strokeWidth="1.5"
            />
            <path
                className="comparison-path"
                d="M10 36h28c20 0 22-23 42-23h60M10 36h130M10 36h28c20 0 22 23 42 23h60"
                stroke="var(--primary)"
                strokeWidth="1.5"
            />
            <circle cx="10" cy="36" r="5" fill="var(--primary)" />
            {[13, 36, 59].map((y) => (
                <circle
                    key={y}
                    cx="140"
                    cy={y}
                    r="5"
                    fill="var(--card)"
                    stroke="var(--primary)"
                    strokeWidth="1.5"
                />
            ))}
        </svg>
    </div>
);
