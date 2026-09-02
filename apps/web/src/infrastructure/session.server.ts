import { auth } from "@/infrastructure/auth";
import type { SessionState } from "@/infrastructure/session";

export const readSessionState = async (headers: Headers): Promise<SessionState> => {
    try {
        const result = await auth().api.getSession({ headers });

        if (!result) return { status: "signed-out" };

        const { user } = result;

        return {
            status: "signed-in",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image ?? null,
            },
        };
    } catch (error) {
        console.error("[auth] session read failed:", error);

        return { status: "unavailable" };
    }
};
