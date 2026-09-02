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
            disable_session_recording: false,
            capture_heatmaps: true,
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
