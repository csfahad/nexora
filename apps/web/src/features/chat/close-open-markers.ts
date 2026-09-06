const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const LIST_ITEM = /^ {0,3}(?:[*+-]|\d{1,9}[.)])[ \t]+/;
const MARKERS = /\\.|`+|\*\*|\*|__|_|~~/gu;

type Balance = Readonly<{
    fence: string | null;
    open: readonly string[];
}>;

const isWordChar = (char: string | undefined): boolean =>
    char !== undefined && /[\p{L}\p{N}]/u.test(char);

const inCodeSpan = (open: readonly string[]): boolean =>
    open.at(-1)?.startsWith("`") ?? false;

const scanInline = (line: string, open: readonly string[]): readonly string[] => {
    const body = line.slice(LIST_ITEM.exec(line)?.[0].length ?? 0);

    return [...body.matchAll(MARKERS)].reduce<readonly string[]>((state, match) => {
        const token = match[0];

        if (token.startsWith("\\")) return state;

        const top = state.at(-1);

        if (token.startsWith("`")) {
            if (top === token) return state.slice(0, -1);

            return inCodeSpan(state) ? state : [...state, token];
        }

        if (inCodeSpan(state)) return state;

        if (token.startsWith("_")) {
            const after = body[match.index + token.length];

            if (top === token && !isWordChar(after)) return state.slice(0, -1);

            return isWordChar(body[match.index - 1]) ? state : [...state, token];
        }

        return top === token ? state.slice(0, -1) : [...state, token];
    }, open);
};

const closesFence = (fence: string, run: string): boolean =>
    run.startsWith(fence[0]) && run.length >= fence.length;

const balanceOf = (text: string): Balance =>
    text.split("\n").reduce<Balance>(
        (state, line) => {
            const opening = FENCE.exec(line)?.[1];

            if (state.fence !== null) {
                return opening !== undefined && closesFence(state.fence, opening)
                    ? { ...state, fence: null }
                    : state;
            }

            if (opening !== undefined && !inCodeSpan(state.open)) {
                return { ...state, fence: opening };
            }

            return { ...state, open: scanInline(line, state.open) };
        },
        { fence: null, open: [] },
    );

export const closeOpenMarkers = (text: string): string => {
    if (text.length === 0) return text;

    const { fence, open } = balanceOf(text);

    const closers = [...open].reverse().join("");

    return fence === null ? `${text}${closers}` : `${text}\n${fence}`;
};
