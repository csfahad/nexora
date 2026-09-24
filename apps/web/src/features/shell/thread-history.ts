import { createServerFn } from "@tanstack/react-start";

export const THREAD_HISTORY_LIMIT = 50;

export type ThreadHistoryItem = Readonly<{
    id: string;
    title: string;
}>;

export type ThreadHistoryGroup = Readonly<{
    label: "Today" | "This week" | "Earlier";
    threads: readonly ThreadHistoryItem[];
}>;

type ThreadWithDate = ThreadHistoryItem & Readonly<{ updatedAt: Date }>;

export const groupDomId = (label: ThreadHistoryGroup["label"]): string =>
    `thread-group-${label.toLocaleLowerCase().replace(/\s+/g, "-")}`;

const startOfDay = (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
};

const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

export const groupThreadHistory = (
    threads: readonly ThreadWithDate[],
    now = new Date(),
): readonly ThreadHistoryGroup[] => {
    const today = startOfDay(now);
    const weekStart = addDays(today, -6);
    const groups: [ThreadHistoryGroup["label"], ThreadWithDate[]][] = [
        ["Today", []],
        ["This week", []],
        ["Earlier", []],
    ];

    for (const thread of threads) {
        const group =
            thread.updatedAt >= today
                ? groups[0]
                : thread.updatedAt >= weekStart
                  ? groups[1]
                  : groups[2];
        group[1].push(thread);
    }

    return groups
        .filter(([, entries]) => entries.length > 0)
        .map(([label, entries]) => ({
            label,
            threads: entries.map(({ id, title }) => ({ id, title })),
        }));
};

export const getThreadHistory = createServerFn({ method: "GET" }).handler(async () => {
    const [{ getRequest }, { runGetThreadHistory }] = await Promise.all([
        import("@tanstack/react-start/server"),
        import("./thread-history.server"),
    ]);

    return runGetThreadHistory(getRequest().headers);
});
