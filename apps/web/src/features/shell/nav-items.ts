import { IconStack2, IconSwords, IconTrophy } from "@tabler/icons-react";
import type { TablerIcon } from "@tabler/icons-react";

export type NavItem = Readonly<{
    to: string;
    label: string;
    icon: TablerIcon;
}>;

export const NAV_ITEMS: readonly NavItem[] = [
    { to: "/", label: "New Chat", icon: IconSwords },
    { to: "/leaderboard", label: "Leaderboard", icon: IconTrophy },
    { to: "/models", label: "Models", icon: IconStack2 },
];

/** What the top bar's breadcrumb says for a given path. */
export const breadcrumbFor = (pathname: string): readonly string[] => {
    const match = NAV_ITEMS.find(
        (item) =>
            item.to === pathname || (item.to !== "/" && pathname.startsWith(item.to)),
    );

    return match ? [match.label] : ["Nexora"];
};
