export type ExampleAnswer = Readonly<{
    title: string;
    text: string;
    detail: string;
    ttft: string;
    speed: string;
    tokens: string;
    cost: string;
}>;

export type ComparisonExample = Readonly<{
    id: string;
    label: string;
    prompt: string;
    answers: readonly ExampleAnswer[];
}>;

export const EXAMPLE_PROVIDERS = [
    { modelId: "openai/example", name: "OpenAI" },
    { modelId: "anthropic/example", name: "Anthropic" },
    { modelId: "google/example", name: "Google" },
] as const;

export const COMPARISON_EXAMPLES: readonly ComparisonExample[] = [
    {
        id: "code",
        label: "Debug some code",
        prompt: "My payment webhook sometimes runs twice. How do I prevent duplicate charges?",
        answers: [
            {
                title: "Make the handler idempotent.",
                text: "Store the event ID before processing. If that ID already exists, return a successful response without charging again.",
                detail: "Put a unique constraint on event_id.",
                ttft: "0.42 s",
                speed: "68 tok/s",
                tokens: "312",
                cost: "$0.0018",
            },
            {
                title: "Let the database settle the race.",
                text: "Two deliveries can arrive together. Insert the event ID and apply the payment in one transaction, with a unique constraint blocking the duplicate.",
                detail: "An in-memory check won’t survive a restart.",
                ttft: "0.61 s",
                speed: "52 tok/s",
                tokens: "428",
                cost: "$0.0032",
            },
            {
                title: "Use the payment’s idempotency key.",
                text: "Pass a stable key when you create the charge. Also deduplicate webhook events so retries don’t repeat your downstream work.",
                detail: "Keep the key stable across retries.",
                ttft: "0.35 s",
                speed: "81 tok/s",
                tokens: "286",
                cost: "$0.0011",
            },
        ],
    },
    {
        id: "write",
        label: "Find the right words",
        prompt: "Write a short, clear message telling a customer their delivery is two days late.",
        answers: [
            {
                title: "Lead with the new delivery date.",
                text: "Your order will arrive on Thursday, two days later than expected. We’re sorry for the delay. Your tracking link will update as it moves.",
                detail: "Clear timing, without a long explanation.",
                ttft: "0.38 s",
                speed: "73 tok/s",
                tokens: "124",
                cost: "$0.0007",
            },
            {
                title: "Give them a useful next step.",
                text: "Your delivery is delayed by two days and is now expected Thursday. We’re sorry. Track its progress using your order link, or reply here if you need help.",
                detail: "Makes it easy for the customer to respond.",
                ttft: "0.55 s",
                speed: "56 tok/s",
                tokens: "158",
                cost: "$0.0012",
            },
            {
                title: "Keep it brief and direct.",
                text: "A quick update: your order is running two days behind and should arrive Thursday. Sorry for the wait. We’ll send another update when it’s out for delivery.",
                detail: "A conversational version for a quick update.",
                ttft: "0.31 s",
                speed: "85 tok/s",
                tokens: "118",
                cost: "$0.0005",
            },
        ],
    },
    {
        id: "think",
        label: "Think through a decision",
        prompt: "For a small app, should I start with a monolith or microservices?",
        answers: [
            {
                title: "Start with a modular monolith.",
                text: "One deployment is easier to debug and operate. Keep clear boundaries between features, then extract services when a specific boundary needs to scale.",
                detail: "Let a real bottleneck drive the split.",
                ttft: "0.46 s",
                speed: "65 tok/s",
                tokens: "264",
                cost: "$0.0015",
            },
            {
                title: "Optimize for the team you have.",
                text: "If one small team owns the app, independent services add coordination and operational work. Start together, with interfaces that make a later split possible.",
                detail: "Team ownership matters as much as traffic.",
                ttft: "0.64 s",
                speed: "49 tok/s",
                tokens: "351",
                cost: "$0.0026",
            },
            {
                title: "Separate only what needs separating.",
                text: "Keep the core app in one service. A long-running worker or an independently scaling job can be separate without turning every feature into a network call.",
                detail: "A hybrid can solve a concrete need.",
                ttft: "0.37 s",
                speed: "78 tok/s",
                tokens: "241",
                cost: "$0.0010",
            },
        ],
    },
];
