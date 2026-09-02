import { getRouteApi } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { readSessionState } from "@/infrastructure/session.server";

export type SessionUser = Readonly<{
    id: string;
    name: string;
    email: string;
    image: string | null;
}>;

export type SessionState =
    | Readonly<{ status: "signed-in"; user: SessionUser }>
    | Readonly<{ status: "signed-out" }>
    | Readonly<{ status: "unavailable" }>;

export const SESSION_UNAVAILABLE =
    "We couldn't confirm your account just now. Reload the page and try again.";

const rootRoute = getRouteApi("__root__");

export const useSessionState = (): SessionState => rootRoute.useLoaderData().session;

export const getSessionState = createServerFn({ method: "GET" }).handler(
    async (): Promise<SessionState> => {
        const { getRequest } = await import("@tanstack/react-start/server");

        return readSessionState(getRequest().headers);
    },
);
