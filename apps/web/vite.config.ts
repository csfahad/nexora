import { defineConfig, loadEnv } from "vite";
import { z } from "zod";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const posthog = z
        .object({
            key: z.string().startsWith("phc_").min(5),
            host: z.url(),
        })
        .safeParse({
            key: env.VITE_POSTHOG_KEY || env.POSTHOG_KEY,
            host: env.VITE_POSTHOG_HOST || env.POSTHOG_HOST,
        });

    if (!posthog.success) {
        throw new Error(
            "PostHog requires a public project token (phc_...) and ingestion URL at build time. Set POSTHOG_KEY and POSTHOG_HOST, or their VITE_ equivalents.",
        );
    }
    if (
        (env.POSTHOG_KEY && env.POSTHOG_KEY !== posthog.data.key) ||
        (env.POSTHOG_HOST &&
            env.POSTHOG_HOST.replace(/\/$/, "") !== posthog.data.host.replace(/\/$/, ""))
    ) {
        throw new Error(
            "Browser and server PostHog must use the same project token and ingestion URL.",
        );
    }

    return {
        define: {
            "import.meta.env.VITE_POSTHOG_KEY": JSON.stringify(posthog.data.key),
            "import.meta.env.VITE_POSTHOG_HOST": JSON.stringify(posthog.data.host),
        },
        resolve: { tsconfigPaths: true },
        optimizeDeps: {
            include: [
                "use-sync-external-store/shim/with-selector",
                "use-sync-external-store/shim",
            ],
        },
        plugins: [
            devtools(),
            nitro({ rollupConfig: { external: [/^@sentry\//] } }),
            tailwindcss(),
            tanstackStart(),
            viteReact(),
        ],
    };
});

export default config;
