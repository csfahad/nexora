import type { ReactNode } from "react";

export const PageHeading = ({
    title,
    description,
    children,
}: {
    readonly title: string;
    readonly description: string;
    readonly children?: ReactNode;
}) => (
    <header className="page-heading">
        <div className="page-heading-copy">
            <h1>{title}</h1>
            <p>{description}</p>
        </div>
        {children}
    </header>
);
