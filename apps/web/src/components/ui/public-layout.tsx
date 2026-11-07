import type { ReactNode } from "react";
import { PublicHeader } from "./public-header";
import { PublicFooter } from "./public-footer";

export const PublicLayout = ({
    children,
    mainId = "public-main",
}: {
    readonly children: ReactNode;
    readonly mainId?: string;
}) => (
    <div className="public-page" data-scroll-restoration-id="public-page">
        <PublicHeader />
        <main id={mainId} className="public-main" tabIndex={-1}>
            {children}
        </main>
        <PublicFooter />
    </div>
);
