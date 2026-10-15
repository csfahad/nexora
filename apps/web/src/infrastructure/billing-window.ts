export type Window = Readonly<{ start: Date; end: Date }>;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const daysInMonth = (year: number, month: number): number =>
    new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const addMonths = (from: Date, months: number, anchorDay: number): Date => {
    const year = from.getUTCFullYear();
    const month = from.getUTCMonth() + months;

    const normalisedYear = year + Math.floor(month / 12);
    const normalisedMonth = ((month % 12) + 12) % 12;

    const day = Math.min(anchorDay, daysInMonth(normalisedYear, normalisedMonth));

    return new Date(
        Date.UTC(
            normalisedYear,
            normalisedMonth,
            day,
            from.getUTCHours(),
            from.getUTCMinutes(),
            from.getUTCSeconds(),
            from.getUTCMilliseconds(),
        ),
    );
};

export const allowanceWindow = (
    periodStart: Date,
    periodEnd: Date,
    now: Date,
): Window => {
    const anchorDay = periodStart.getUTCDate();

    let start = periodStart;

    for (let elapsed = 1; elapsed <= 12; elapsed += 1) {
        const next = addMonths(periodStart, elapsed, anchorDay);

        if (next > now || next >= periodEnd) {
            return { start, end: next > periodEnd ? periodEnd : next };
        }

        start = next;
    }

    return { start, end: periodEnd };
};

export const dailyWindow = (now: Date): Window => {
    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    return { start, end: new Date(start.getTime() + MS_PER_DAY) };
};
