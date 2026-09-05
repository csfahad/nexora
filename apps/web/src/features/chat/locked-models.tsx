import { IconChevronDown } from "@tabler/icons-react";
import { buttonClasses } from "@/components/ui/button";
import { ModelAvatar } from "@/components/ui/model-avatar";
import { ModelStack } from "@/components/ui/model-stack";
import {
    Popover,
    PopoverContent,
    PopoverDescription,
    PopoverHeader,
    PopoverTitle,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type LockedModel = Readonly<{ modelId: string; modelName: string }>;

export const LockedModels = ({ models }: { readonly models: readonly LockedModel[] }) => (
    <Popover>
        <PopoverTrigger
            className={cn(
                buttonClasses({ variant: "outline", size: "sm" }),
                "group/trigger min-w-0 max-w-full pl-1.5",
            )}
        >
            <ModelStack
                models={models.map((model) => ({
                    id: model.modelId,
                    name: model.modelName,
                }))}
            />
            <IconChevronDown
                aria-hidden
                stroke={1.75}
                className="transition-state group-data-[state=open]/trigger:rotate-180"
            />
        </PopoverTrigger>

        <PopoverContent
            align="start"
            className="w-[min(20rem,calc(100vw-2rem))] gap-0 overflow-hidden p-0"
        >
            <PopoverHeader className="border-border border-b px-4 py-3">
                <PopoverTitle>Models in this thread</PopoverTitle>
                <PopoverDescription>
                    Fixed when the thread started, so every turn is compared on the same
                    models.
                </PopoverDescription>
            </PopoverHeader>

            <ul className="list-none p-1.5">
                {models.map((model) => (
                    <li
                        key={model.modelId}
                        className="flex items-center gap-3 px-2.5 py-2 text-sm"
                    >
                        <ModelAvatar name={model.modelName} size="sm" />

                        <span className="text-foreground min-w-0 flex-1 truncate">
                            {model.modelName}
                        </span>

                        <span className="text-muted-foreground shrink-0 truncate text-xs">
                            {model.modelId}
                        </span>
                    </li>
                ))}
            </ul>
        </PopoverContent>
    </Popover>
);
