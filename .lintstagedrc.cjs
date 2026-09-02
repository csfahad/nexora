const path = require("node:path");

const quote = (files) => files.map((file) => `"${file}"`).join(" ");

module.exports = {
    "apps/web/**/*.{ts,tsx,mjs}": (files) => {
        const relative = files.map((file) =>
            path.relative(path.join(__dirname, "apps/web"), file),
        );

        return [
            `pnpm --dir apps/web exec eslint --fix --max-warnings=0 ${quote(relative)}`,
            `prettier --write ${quote(files)}`,
        ];
    },
    "apps/web/prisma/*.prisma": () => ["pnpm --dir apps/web exec prisma format"],
    "*.{json,css,md,yaml,yml}": ["prettier --write"],
    "scripts/**/*.mjs": ["prettier --write"],
};
