import { PromptComposer } from "./prompt-composer";

export const ArenaScreen = () => (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col justify-center gap-8 px-4 py-10">
        <div className="flex flex-col gap-3 text-center">
            <h1 className="text-balance text-3xl font-semibold">
                Put three models to the test.
            </h1>
            <p className="text-muted-foreground text-pretty text-base">
                Send one prompt, watch them answer side by side, and vote for the best —
                with every answer&rsquo;s real speed and token count in view.
            </p>
        </div>

        <PromptComposer onAddModel={() => {}} onSubmit={() => {}} />
    </div>
);
