import { IconAlertTriangle, IconRefresh } from "@tabler/icons-react";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const RetryNotice = ({
    message,
    onRetry,
    retryLabel = "Try again",
}: {
    readonly message: string;
    readonly onRetry: () => void;
    readonly retryLabel?: string;
}) => (
    <div
        role="alert"
        className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 py-16 text-center"
    >
        <span className="border-input bg-muted grid size-10 place-items-center rounded-full border">
            <IconAlertTriangle
                aria-hidden
                stroke={1.75}
                className="text-muted-foreground size-5"
            />
        </span>

        <p className="text-foreground text-pretty">{message}</p>

        <Button variant="outline" size="sm" onClick={onRetry}>
            <IconRefresh aria-hidden stroke={1.75} />
            {retryLabel}
        </Button>
    </div>
);

export const LoaderErrorNotice = ({ message }: { readonly message: string }) => {
    const router = useRouter();

    return <RetryNotice message={message} onRetry={() => void router.invalidate()} />;
};
