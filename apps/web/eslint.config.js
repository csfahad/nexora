//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config";

export default [
    {
        ignores: [
            "eslint.config.js",
            "prettier.config.js",
            "src/routeTree.gen.ts",
            "src/generated/**",
            ".output/**",
            ".nitro/**",
            ".tanstack/**",
        ],
    },
    ...tanstackConfig,
    {
        rules: {
            "import/no-cycle": "off",
            "import/order": "off",
            "sort-imports": "off",
            "pnpm/json-enforce-catalog": "off",

            // Immutable data.
            "prefer-const": "error",
            "no-var": "error",
            "no-param-reassign": ["error", { props: true }],

            // A real provider error survives server-side; debug logging does not.
            "no-console": ["warn", { allow: ["error", "warn"] }],

            // Configuration is read through infrastructure/env.ts, never directly.
            "no-restricted-properties": [
                "error",
                {
                    object: "process",
                    property: "env",
                    message:
                        "Read config through serverEnv() in infrastructure/env.ts or publicEnv in infrastructure/public-env.ts.",
                },
            ],
        },
    },
    {
        files: ["**/*.{ts,tsx}"],
        rules: {
            "@typescript-eslint/array-type": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/no-explicit-any": "error",
        },
    },
    {
        files: ["scripts/**/*.mjs"],
        rules: {
            "no-console": "off",
        },
    },
    {
        /**
         * Feature folders have real walls: a feature may not import another
         * feature, by alias or by climbing out. Scoped to features/ on purpose,
         * because a route composing features is what a route is for.
         */
        files: ["src/features/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "@/features/*",
                                "#/features/*",
                                "../features/*",
                                "../../features/*",
                                "../*/",
                            ],
                            message:
                                "A feature may not import another feature. Shared code belongs in infrastructure/.",
                        },
                        {
                            group: ["@/routes/*", "#/routes/*", "../routes/*"],
                            message:
                                "Routes compose features; features never reach back up into routes.",
                        },
                    ],
                },
            ],
        },
    },
    {
        // infrastructure/ is the bottom layer: no feature, no route.
        files: ["src/infrastructure/**/*.{ts,tsx}"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: [
                                "@/features/*",
                                "#/features/*",
                                "../features/*",
                                "@/routes/*",
                                "#/routes/*",
                                "../routes/*",
                            ],
                            message:
                                "infrastructure/ is the bottom layer: it imports no feature and no route.",
                        },
                    ],
                },
            ],
        },
    },
    {
        // The only two modules allowed to read process.env directly.
        files: ["src/infrastructure/env.ts", "src/infrastructure/public-env.ts"],
        rules: {
            "no-restricted-properties": "off",
        },
    },
];
