import { useEffect } from "react";
import posthog from "posthog-js";
import { publicEnv } from "@/infrastructure/public-env";
import { useSessionState } from "@/infrastructure/session";

let client: typeof posthog | null | undefined;

const browserPostHog = (): typeof posthog | null => {
    if (client !== undefined) return client;

    if (typeof window === "undefined") return null;

    try {
        const env = publicEnv();

        posthog.init(env.VITE_POSTHOG_KEY, {
            api_host: env.VITE_POSTHOG_HOST,
            defaults: "2026-08-30",
            person_profiles: "identified_only",
            autocapture: true,
            capture_pageview: "history_change",
            capture_pageleave: true,
            capture_exceptions: {
                capture_unhandled_errors: true,
                capture_unhandled_rejections: true,
                capture_console_errors: true,
            },
            disable_session_recording: false,
            enable_recording_console_log: true,
            capture_heatmaps: true,
            logs: { serviceName: "nexora-browser", captureConsoleLogs: true },
            loaded: (analytics) => analytics.startSessionRecording(true),
        });

        client = posthog;
    } catch (error) {
        console.warn("[posthog] analytics are off in the browser:", error);

        client = null;
    }

    return client;
};

let identifiedAs: string | null = null;

export const usePostHogViewer = (): void => {
    const session = useSessionState();

    const userId = session.status === "signed-in" ? session.user.id : null;
    const name = session.status === "signed-in" ? session.user.name : null;
    const email = session.status === "signed-in" ? session.user.email : null;

    useEffect(() => {
        const analytics = browserPostHog();

        if (analytics === null) return;

        if (userId !== null) {
            if (identifiedAs === userId) return;

            analytics.identify(userId, { name, email });
            identifiedAs = userId;

            return;
        }

        if (session.status === "signed-out" && identifiedAs !== null) {
            analytics.reset();
            identifiedAs = null;
        }
    }, [userId, name, email, session.status]);
};
