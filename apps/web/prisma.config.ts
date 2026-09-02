import { existsSync } from "node:fs";
import { defineConfig, env } from "prisma/config";

if (existsSync(".env")) {
    process.loadEnvFile(".env");
}

const optionalEnv = (name: string): string | undefined => {
    try {
        return env(name);
    } catch {
        return undefined;
    }
};

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: optionalEnv("DATABASE_URL"),
    },
});
