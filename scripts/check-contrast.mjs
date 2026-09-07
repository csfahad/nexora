import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = join(HERE, "..", "apps", "web", "src", "styles.css");
const VERBOSE = process.argv.includes("--verbose");

/* -------------------------------------------------------------- colour maths */

const oklchToLinearSrgb = (L, C, hDeg) => {
    const h = (hDeg * Math.PI) / 180;
    const a = C * Math.cos(h);
    const b = C * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
};

const GAMUT_EPS = 1e-4;
const inGamut = (lin) => lin.every((v) => v >= -GAMUT_EPS && v <= 1 + GAMUT_EPS);
const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

const relativeLuminance = (lin) =>
    0.2126 * clamp01(lin[0]) + 0.7152 * clamp01(lin[1]) + 0.0722 * clamp01(lin[2]);

const toHex = (lin) =>
    "#" +
    lin
        .map((v) => {
            const c = clamp01(v);
            const srgb = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
            return Math.round(srgb * 255)
                .toString(16)
                .padStart(2, "0");
        })
        .join("");

const contrast = (a, b) => {
    const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

/* ------------------------------------------------------------------- parsing */

/** Body of the first top-level `selector { ... }` block, brace-counted so that
 *  nested blocks inside it do not end the match early. */
const blockBody = (css, selector) => {
    const start = css.indexOf(selector);
    if (start === -1) return null;
    const open = css.indexOf("{", start);
    if (open === -1) return null;
    let depth = 0;
    for (let i = open; i < css.length; i++) {
        if (css[i] === "{") depth++;
        else if (css[i] === "}" && --depth === 0) return css.slice(open + 1, i);
    }
    return null;
};

const OKLCH = /--([a-z0-9-]+)\s*:\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/gi;

const parseTokens = (body, label) => {
    const tokens = new Map();
    for (const [, name, L, C, H] of body.matchAll(OKLCH)) {
        const lin = oklchToLinearSrgb(Number(L), Number(C), Number(H));
        tokens.set(name, { name, lin, css: `oklch(${L} ${C} ${H})`, hex: toHex(lin) });
    }
    if (tokens.size === 0) throw new Error(`parsed no oklch tokens out of ${label}`);
    return tokens;
};

/* --------------------------------------------------------------- the pairings
 * [foreground token, background token, required ratio, what it is]
 * Only pairs that genuinely occur in the UI. A checker padded with combinations
 * nobody renders reports a bar the design does not actually have to clear.
 */
const PAIRS = [
    ["foreground", "background", 4.5, "body text on the page"],
    ["foreground", "card", 4.5, "body text inside a response column"],
    ["card-foreground", "card", 4.5, "card text"],
    ["popover-foreground", "popover", 4.5, "popover text"],
    ["muted-foreground", "background", 4.5, "metrics label on the page"],
    ["muted-foreground", "card", 4.5, "metrics label in a column"],
    ["muted-foreground", "muted", 4.5, "metrics label on a raised chip"],
    ["muted-foreground", "accent", 4.5, "placeholder / label on a hovered row"],
    ["secondary-foreground", "secondary", 4.5, "secondary button label"],
    ["accent-foreground", "accent", 4.5, "hovered nav row label"],
    ["primary", "background", 4.5, "rust as a link on the page"],
    ["primary", "card", 4.5, "rust as a link in a column"],
    ["primary", "muted", 4.5, "rust as a link on a raised chip"],
    ["primary-foreground", "primary", 4.5, "label on a filled rust button"],
    ["primary-foreground", "primary-hover", 4.5, "label on a hovered rust button"],
    ["win", "card", 4.5, "winner marker in a column"],
    ["win", "background", 4.5, "winner marker on the page"],
    ["win", "muted", 4.5, "leading model's win pill in the top bar"],
    ["win-foreground", "win", 4.5, "label on a filled winner badge"],

    /* A code block's background is --muted, so that is the only surface these
     * four are ever read against. Gated as text, because that is what they are. */
    ["code-keyword", "muted", 4.5, "keyword inside a code block"],
    ["code-string", "muted", 4.5, "string literal inside a code block"],
    ["code-number", "muted", 4.5, "numeric literal inside a code block"],
    ["code-function", "muted", 4.5, "function name inside a code block"],
    ["destructive", "card", 4.5, "error text in a column"],
    ["destructive", "background", 4.5, "error text on the page"],
    ["destructive-foreground", "destructive", 4.5, "label on a filled error chip"],
    ["sidebar-foreground", "sidebar", 4.5, "sidebar text"],
    ["sidebar-accent-foreground", "sidebar-accent", 4.5, "hovered sidebar row"],

    ["input", "background", 3.0, "control edge against the page"],
    ["input", "card", 3.0, "control edge against a column"],
    ["input", "muted", 3.0, "control edge against a raised chip"],
    ["ring", "background", 3.0, "focus ring against the page"],
    ["ring", "card", 3.0, "focus ring against a column"],
    ["ring", "muted", 3.0, "focus ring against a raised chip"],
    ["sidebar-ring", "sidebar", 3.0, "focus ring inside the sidebar"],
    ["sidebar-border", "sidebar", 1.0, "sidebar seam (decorative, ungated)"],
    ["border", "background", 1.0, "seam on the page (decorative, ungated)"],
    ["border", "card", 1.0, "seam on a column (decorative, ungated)"],
];

/* Colour can never be the only signal, so the app also has to know how close
 * these hues really are. Reported, not gated. */
const HAZARDS = [
    ["primary", "destructive", "rust vs error-red"],
    ["primary", "win", "rust vs winner-green"],
];

/* ------------------------------------------------------------------ the check */

const css = readFileSync(CSS_PATH, "utf8");

const THEMES = [
    { label: "dark  (default)", selector: ":root {" },
    { label: "light", selector: ".light {" },
];

let failures = 0;
let checked = 0;

for (const { label, selector } of THEMES) {
    const body = blockBody(css, selector);
    if (body === null) {
        console.error(`FATAL  could not find a \`${selector}\` block in ${CSS_PATH}`);
        process.exit(2);
    }
    const tokens = parseTokens(body, `${selector} (${label})`);

    console.log(`\n${"─".repeat(72)}\n  ${label}  ·  ${tokens.size} tokens parsed\n`);

    // A token the browser will clip makes every ratio below it meaningless,
    // so this is checked before any contrast is reported.
    const clipped = [...tokens.values()].filter((t) => !inGamut(t.lin));
    if (clipped.length > 0) {
        failures += clipped.length;
        for (const t of clipped) {
            console.log(
                `  FAIL  --${t.name} ${t.css} is outside sRGB and will be clipped`,
            );
        }
    }

    for (const [fgName, bgName, need, what] of PAIRS) {
        const fg = tokens.get(fgName);
        const bg = tokens.get(bgName);
        if (!fg || !bg) {
            failures++;
            console.log(
                `  FAIL  missing token: ${!fg ? `--${fgName}` : ""}${!fg && !bg ? " and " : ""}${!bg ? `--${bgName}` : ""}  (needed for ${what})`,
            );
            continue;
        }
        const ratio = contrast(fg.lin, bg.lin);
        const ok = ratio + 5e-3 >= need;
        checked++;
        if (!ok) failures++;
        if (!ok || VERBOSE) {
            const gate = need === 1 ? "  ---" : `>=${need.toFixed(1)}`;
            console.log(
                `  ${ok ? "pass" : "FAIL"}  ${ratio.toFixed(2).padStart(6)}:1 ${gate}  ` +
                    `--${fgName} on --${bgName}`.padEnd(46) +
                    what,
            );
        }
    }

    for (const [aName, bName, what] of HAZARDS) {
        const a = tokens.get(aName);
        const b = tokens.get(bName);
        if (!a || !b) continue;
        console.log(
            `  note  ${contrast(a.lin, b.lin).toFixed(2)}:1 between ${what} ` +
                `(${a.hex} / ${b.hex}) — never signal with colour alone`,
        );
    }
}

console.log(`\n${"─".repeat(72)}`);
if (failures > 0) {
    console.error(
        `\n  ✗ ${failures} contrast failure(s). This is a gate, not a warning: fix the\n` +
            `    token in apps/web/src/styles.css, do not lower the requirement here.\n`,
    );
    process.exit(1);
}
console.log(`\n  ✓ ${checked} pairs pass in both themes, nothing outside sRGB.\n`);
