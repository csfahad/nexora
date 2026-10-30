import { cn } from "@/lib/utils";

const iconAssets = import.meta.glob<string>(
    "../../assets/provider-icons/*.{svg,png,jpeg,webp}",
    { eager: true, query: "?url", import: "default" },
);

const assetsByBrand = Object.fromEntries(
    Object.entries(iconAssets).map(([path, url]) => [
        path.split("/").at(-1)?.split(".")[0],
        { url, isSvg: path.endsWith(".svg") },
    ]),
);

const providerIcons: Readonly<Record<string, string | undefined>> = {
    "aion-labs": "aionlabs",
    ai21: "ai21",
    amazon: "aws",
    "anthracite-org": "anthracite-org",
    anthropic: "anthropic",
    arcee: "arcee",
    baichuan: "baichuan",
    baidu: "baidu",
    bytedance: "bytedance",
    "bytedance-seed": "bytedance",
    cognitivecomputations: "dolphin",
    cohere: "cohere",
    deepcogito: "deepcogito",
    deepseek: "deepseek",
    "dots-studio": "dotsstudio",
    elorian: "elorian",
    fireworks: "fireworks",
    google: "google",
    gryphe: "gryphe",
    "ibm-granite": "ibm",
    inception: "inception",
    inclusionai: "ling",
    "inference-net": "inference",
    liquid: "liquid",
    mancer: "mancer",
    meituan: "longcat",
    meta: "meta",
    "meta-llama": "meta",
    microsoft: "microsoft",
    minimax: "minimax",
    mistral: "mistral",
    mistralai: "mistral",
    moondream: "moondream",
    moonshotai: "moonshot",
    morph: "morph",
    "nex-agi": "nex-agi",
    nousresearch: "nousresearch",
    nvidia: "nvidia",
    openai: "openai",
    openrouter: "openrouter",
    "particle-ai": "particle-ai",
    perceptron: "perceptron",
    perplexity: "perplexity",
    poolside: "poolside",
    "prism-ml": "prism-ml",
    qwen: "qwen",
    recursive: "recursive",
    reflection: "reflection",
    rekaai: "reka",
    relace: "relace",
    sakana: "sakana",
    sao10k: "sao10k",
    scaledown: "scaledown",
    stepfun: "stepfun",
    tencent: "tencent",
    thedrummer: "thedrummer",
    thinkingmachines: "thinkingmachines",
    typesafe: "typesafeai",
    unbiased: "unbiased",
    undi95: "undi95",
    upstage: "upstage",
    writer: "writer",
    "x-ai": "xai",
    xai: "xai",
    xiaomi: "xiaomimimo",
    "xingchen-agi": "xingchen-agi",
    "z-ai": "zai",
    "01-ai": "yi",
};

const normalizeProvider = (identity: string) =>
    identity.trim().toLowerCase().replace(/^~/, "");

const identityFor = (modelId: string, provider?: string) => {
    const namespace = normalizeProvider(modelId.split("/")[0] ?? "");
    const brand =
        providerIcons[namespace] ??
        providerIcons[normalizeProvider(provider ?? "")] ??
        namespace;
    const asset = assetsByBrand[brand];
    return { brand, asset };
};

export const ModelAvatar = ({
    modelId,
    name,
    provider,
    size = "md",
    className,
}: {
    readonly modelId: string;
    readonly name: string;
    readonly provider?: string;
    readonly size?: "sm" | "md" | "lg";
    readonly className?: string;
}) => {
    const initial = (provider ?? name).trim().charAt(0).toUpperCase() || "?";
    const { brand, asset } = identityFor(modelId, provider);

    return (
        <span
            aria-hidden
            data-size={size}
            data-brand={brand}
            className={cn("model-avatar select-none", className)}
        >
            {asset === undefined ? (
                initial
            ) : asset.isSvg ? (
                <span
                    className="model-avatar-mark"
                    style={{ maskImage: `url("${asset.url}")` }}
                />
            ) : (
                <img src={asset.url} alt="" className="model-avatar-image" />
            )}
        </span>
    );
};
