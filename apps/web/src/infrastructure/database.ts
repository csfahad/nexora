import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { serverEnv } from "@/infrastructure/env";

let cached: PrismaClient | undefined;

export const database = (): PrismaClient => {
    if (cached) return cached;

    cached = new PrismaClient({
        adapter: new PrismaPg({ connectionString: serverEnv().DATABASE_URL }),
    });

    return cached;
};
