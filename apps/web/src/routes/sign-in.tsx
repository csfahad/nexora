import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignInScreen } from "@/features/auth/sign-in-screen";

const safePath = (raw: string): string =>
    raw.startsWith("/") && !raw.startsWith("//") ? raw : "/app";

const searchSchema = z.object({
    next: z.string().catch("/app").transform(safePath),
});

export const Route = createFileRoute("/sign-in")({
    head: () => ({ meta: [{ title: "Sign in — Nexora" }] }),
    validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
    component: SignIn,
});

function SignIn() {
    const { next } = Route.useSearch();
    return <SignInScreen next={next} />;
}
