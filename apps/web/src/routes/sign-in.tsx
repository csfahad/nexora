import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignInScreen } from "@/features/auth/sign-in-screen";

const safePath = (raw: string): string =>
    raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

const searchSchema = z.object({
    next: z.string().catch("/").transform(safePath),
});

export const Route = createFileRoute("/sign-in")({
    validateSearch: (search: Record<string, unknown>) => searchSchema.parse(search),
    component: SignIn,
});

function SignIn() {
    const { next } = Route.useSearch();
    return <SignInScreen next={next} />;
}
