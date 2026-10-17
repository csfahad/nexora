#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(HERE, "..");

const readEnv = (name) => {
    const file = (() => {
        try {
            return readFileSync(join(WEB_ROOT, ".env"), "utf8");
        } catch {
            return "";
        }
    })();

    const value = file.match(new RegExp(`^${name}=["']?([^"'\\n]+)["']?$`, "m"))?.[1];

    if (!value) {
        process.stderr.write(`Missing ${name} in apps/web/.env.\n`);
        process.exit(1);
    }

    return value;
};

const ALLOWANCE = { FREE: 0, PRO: 1200, MAX: 12000, PRO_PLUS: 6000 };
const DAILY_FREE = 60;

const money = (usd) =>
    `$${Number(usd).toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
const column = {
    FREE: "freeAnswers",
    STANDARD: "standard",
    ADVANCED: "advanced",
    FRONTIER: "frontier",
};

const { PrismaPg } = await import("@prisma/adapter-pg");
const { PrismaClient } = await import("../src/generated/prisma/client.ts");

const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: readEnv("DATABASE_URL") }),
});

const periods = await db.usagePeriod.findMany({
    orderBy: [{ userId: "asc" }, { scope: "asc" }, { periodStart: "asc" }],
});

if (periods.length === 0) {
    console.log("No usage periods exist yet. Nothing to reconcile.");
    process.exit(0);
}

const subscriptionByUser = new Map(
    (
        await db.subscription.findMany({
            select: { userId: true, plan: true },
        })
    ).map((row) => [row.userId, row.plan]),
);

const REFUNDABLE = ["PROVIDER", "MODEL_UNAVAILABLE", "FREE_TIER_EXHAUSTED"];
const failures = [];

for (const period of periods) {
    const range = { gte: period.periodStart, lt: period.periodEnd };
    const createdAt = { gte: period.periodStart, lt: period.periodEnd };

    const [spent, reservedRows, refunds] = await Promise.all([
        db.modelResponse.aggregate({
            where: { createdAt },
            _sum: { costUsd: true },
            _count: true,
        }),
        db.modelResponse.groupBy({
            by: ["tier"],
            where: { createdAt },
            _count: { _all: true },
        }),
        db.modelResponse.groupBy({
            by: ["tier"],
            where: { createdAt, failure: { in: REFUNDABLE } },
            _count: { _all: true },
        }),
    ]);

    const sumCost = Number(spent._sum.costUsd ?? 0);
    const diff = sumCost - Number(period.spentUsd);
    const costMatches = Math.abs(diff) < 0.000001;

    const plan = subscriptionByUser.get(period.userId) ?? "FREE";
    const implied =
        period.scope === "BILLING" ? (ALLOWANCE[plan] ?? Infinity) : DAILY_FREE;

    const parts = [];
    let countersOk = true;

    for (const [tier, col] of Object.entries(column)) {
        const reserved = reservedRows.find((row) => row.tier === tier)?._count._all ?? 0;
        const refunded = refunds.find((row) => row.tier === tier)?._count._all ?? 0;
        const expected = reserved - refunded;
        const actual = period[col];

        if (expected !== actual) {
            countersOk = false;
            failures.push(
                `${period.userId} ${period.scope} ${period.periodStart.toISOString()} ` +
                    `${tier}: counter ${actual} vs ${expected} settled (reserved ${reserved}, refunded ${refunded})`,
            );
        }

        if (period.scope === "BILLING" && tier !== "FREE" && actual > implied) {
            failures.push(
                `${period.userId} BILLING ${period.periodStart.toISOString()} ` +
                    `${tier}: ${actual} spent exceeds plan ${plan}'s ${implied}`,
            );
        }

        if (tier !== "FREE" || period.scope === "DAILY") {
            parts.push(`${tier.toLowerCase()} ${actual}/${expected}`);
        }
    }

    if (!costMatches) {
        failures.push(
            `${period.userId} ${period.scope} ${period.periodStart.toISOString()}: ` +
                `spentUsd ${money(period.spentUsd)} vs summed costUsd ${money(sumCost)}`,
        );
    }

    console.log(
        `${costMatches && countersOk ? "OK " : "MISMATCH"} ` +
            `${period.userId} ${period.scope} since ${period.periodStart.toISOString().slice(0, 10)} ` +
            `· ${money(period.spentUsd)} summed vs ${money(sumCost)} counted, ` +
            `${spent._count} rows · ${parts.join(", ")} · plan ${plan} (cap ${implied})`,
    );
}

if (failures.length > 0) {
    console.log(`\n${failures.length} finding(s):`);
    for (const line of failures) console.log(`  - ${line}`);
} else {
    console.log("\nAll periods reconcile.");
}

await db.$disconnect();
