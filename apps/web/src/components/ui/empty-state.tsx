import type { ReactNode } from "react";
import type { TablerIcon } from "@tabler/icons-react";

export const EmptyState = ({
    title,
    description,
    icon: Icon,
    children,
}: {
    readonly title: string;
    readonly description: string;
    readonly icon: TablerIcon;
    readonly children?: ReactNode;
}) => (
    <div className="empty-state">
        <Icon aria-hidden stroke={1.5} />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-muted-foreground mt-2 max-w-md text-pretty text-sm leading-relaxed">
            {description}
        </p>
        {children}
    </div>
);
