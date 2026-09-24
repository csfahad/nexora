export const SHARE_SLUG_BYTES = 16;

export const generateShareSlug = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(SHARE_SLUG_BYTES));

    return btoa(String.fromCharCode(...bytes))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
};

export const shareUrlFor = (origin: string, slug: string): string =>
    `${origin}/share/${slug}`;
