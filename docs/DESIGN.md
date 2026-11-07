---
name: Nexora
description: A precise workspace for independently measured model comparisons.
colors:
    action: "{colors.primary-dark}"
    action-foreground: "{colors.primary-foreground-dark}"
    background-dark: "oklch(0.1864945 0.0043594 264.46262)"
    foreground-dark: "oklch(0.9707138 0.0026505 286.35036)"
    card-dark: "oklch(0.2309377 0.005954 271.15289)"
    popover-dark: "oklch(0.2687858 0.0057258 271.20042)"
    sidebar-dark: "oklch(0.2179823 0.0060434 271.13191)"
    muted-dark: "oklch(0.2845927 0.0078516 264.4426)"
    muted-foreground-dark: "oklch(0.7604384 0.0118631 269.5155)"
    secondary-dark: "oklch(0.3011724 0.0094376 268.35582)"
    accent-dark: "oklch(0.3050671 0.0132943 267.11188)"
    border-dark: "oklch(0.3444203 0.0128821 267.16274)"
    input-dark: "oklch(0.5785176 0.0197524 264.40926)"
    primary-dark: "oklch(0.7781883 0.1130915 259.28309)"
    primary-foreground-dark: "oklch(0.2454775 0.0561043 260.2616)"
    primary-hover-dark: "oklch(0.8329731 0.0833801 259.14578)"
    primary-soft-dark: "oklch(0.3159438 0.0434274 260.652)"
    surface-tint-dark: "oklch(0.2457143 0.0258012 258.33104)"
    win-dark: "oklch(0.8110519 0.0954115 163.3289)"
    win-foreground-dark: "oklch(0.2597881 0.0408001 159.86781)"
    destructive-dark: "oklch(0.7732194 0.1340323 17.80403)"
    destructive-foreground-dark: "oklch(0.23822 0.0624185 20.1337)"
    background-light: "oklch(0.9876094 0.0017048 247.83885)"
    foreground-light: "oklch(0.2315763 0.0038052 286.09885)"
    card-light: "oklch(1 0 89.87556)"
    popover-light: "oklch(1 0 89.87556)"
    sidebar-light: "oklch(0.9691955 0.0034258 247.85826)"
    muted-light: "oklch(0.9604791 0.0045519 258.32476)"
    muted-foreground-light: "oklch(0.5136771 0.0199305 267.62332)"
    secondary-light: "oklch(0.953997 0.0062606 255.47552)"
    accent-light: "oklch(0.9417685 0.0091581 258.33618)"
    border-light: "oklch(0.9145036 0.0092262 258.33695)"
    input-light: "oklch(0.6354026 0.0178962 262.71978)"
    primary-light: "oklch(0.5026618 0.1878916 258.21767)"
    primary-foreground-light: "oklch(1 0 89.87556)"
    primary-hover-light: "oklch(0.4480996 0.1660032 258.01567)"
    primary-soft-light: "oklch(0.9499155 0.0195114 260.16972)"
    surface-tint-light: "oklch(0.972124 0.0102815 261.78914)"
    win-light: "oklch(0.5047107 0.1031119 158.56544)"
    win-foreground-light: "oklch(1 0 89.87556)"
    destructive-light: "oklch(0.5230109 0.1821467 22.03945)"
    destructive-foreground-light: "oklch(1 0 89.87556)"
typography:
    public-display:
        fontFamily: '"Apfel Grotezk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "clamp(2.75rem, 4.3vw, 3.75rem)"
        fontWeight: 500
        lineHeight: 1.18
        letterSpacing: "-0.04em"
    display:
        fontFamily: '"Apfel Grotezk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "clamp(2.5rem, 4.4vw, 3.5rem)"
        fontWeight: 500
        lineHeight: 1.1
        letterSpacing: "-0.04em"
    headline:
        fontFamily: '"Apfel Grotezk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "clamp(2rem, 3.4vw, 2.75rem)"
        fontWeight: 500
        lineHeight: 1.12
        letterSpacing: "-0.035em"
    title:
        fontFamily: '"Apfel Grotezk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "1.125rem"
        fontWeight: 500
        lineHeight: 1.5
    body:
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "0.875rem"
        fontWeight: 400
        lineHeight: 1.7
    label:
        fontFamily: '"Apfel Grotezk", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "0.75rem"
        lineHeight: "1.25rem"
        letterSpacing: "0.015em"
rounded:
    sm: "8px"
    md: "8px"
    lg: "10px"
    content: "12px"
    xl: "14px"
    composer: "12px"
    pill: "999px"
spacing:
    xs: "4px"
    sm: "8px"
    compact: "12px"
    md: "16px"
    field: "20px"
    lg: "24px"
    section: "32px"
    page: "48px"
components:
    button-primary:
        backgroundColor: "{colors.action}"
        textColor: "{colors.action-foreground}"
        rounded: "{rounded.md}"
        padding: "0 16px"
        height: "40px"
    button-primary-hover:
        backgroundColor: "{colors.primary-hover-dark}"
    button-secondary:
        backgroundColor: "{colors.secondary-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.md}"
        padding: "0 16px"
        height: "40px"
    button-outline:
        backgroundColor: "{colors.card-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.md}"
        padding: "0 16px"
        height: "40px"
    button-ghost:
        backgroundColor: "transparent"
        textColor: "{colors.muted-foreground-dark}"
        rounded: "{rounded.md}"
        height: "40px"
        width: "40px"
    button-destructive:
        backgroundColor: "{colors.destructive-dark}"
        textColor: "{colors.destructive-foreground-dark}"
        rounded: "{rounded.md}"
        padding: "0 16px"
        height: "40px"
    field-input:
        backgroundColor: "{colors.card-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.md}"
        padding: "7px 12px"
    model-card:
        backgroundColor: "{colors.card-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.content}"
        padding: "24px"
    nav-selected:
        backgroundColor: "{colors.primary-soft-dark}"
        textColor: "{colors.primary-dark}"
        rounded: "{rounded.md}"
        padding: "10px 12px"
    lineup-chip:
        backgroundColor: "{colors.muted-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.md}"
        padding: "6px 6px 6px 8px"
    prompt-composer:
        backgroundColor: "{colors.card-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.composer}"
        padding: "20px"
---

# Design System: Nexora

<!-- nexora-design-record: 20261107 -->

## Current direction

The user approved the [Dodo Payments](https://dodopayments.com/) typography,
layout, framing, dotted hero, grid-backed demo, and compact controls, then
explicitly requested Nexora’s previous color scheme. The current implementation
retains Apfel Grotezk headings, Inter body text, and the approved layouts while
restoring the original blue accents, cool silver surfaces, graphite text, and
complete dark theme. Dodo’s green/lime palette is superseded.

`apps/web/src/styles.css` owns shared tokens and working-screen styling.
`apps/web/src/public.css` owns the public layout and marketing page. The
frontmatter records the current tokens; `.impeccable/design.json` remains a
historical snapshot from the previous design. The approved layout review lives
in `.impeccable/review/dodo-20261107/`; the color-restoration review lives in
`.impeccable/review/palette-20261107/`.

## Color and controls

Both themes use the exact color tokens from the previous Nexora implementation.
Light mode uses cool silver ground, white cards, graphite text, and blue
(`#005dcc`) links, filled actions, and focus. Dark mode uses near-black graphite
ground, neutral reading surfaces, pale text, and light blue (`#8bb8ff`) accents.
Filled buttons and their hover states follow the matching primary tokens. Winner
and error states retain the original green/red semantic tokens, icons, and labels.

The public hero washes, dots, and demo grids use subtle mixtures of these same
tokens. The alternating pricing band uses the original dark-theme graphite
surfaces in either theme. Hairline framing and stronger input edges keep their
original neutral tokens.

The comparison showcase has the user-requested decorative exceptions: green,
blue, and pink tab icon tiles with white glyphs, and macOS red/yellow/green
window dots. Their colors remain consistent in both themes. Window dots use
the original 11px desktop size and 9px size below 640px.

Shared buttons use Apfel Grotezk, a medium weight, an 8px corner radius, and
150ms state changes. Content cards, pricing shells, the composer, and answer
cards use 12px corners. Existing model chips and compact metadata keep their
functional shapes. Keyboard outlines remain visible; reduced-motion preferences
remove decorative transitions. Both themes remain complete. The existing
System/Light/Dark choice persists and is shared across the app.

## Typography

Apfel Grotezk by Luigi Gorlero / Collletttivo supplies Regular and Mittel
heading and control faces. Inter by Rasmus Andersson supplies variable body
text. The three WOFF2 files and their SIL Open Font License files are served
from `public/fonts/`; no page fetches fonts from the reference site at runtime.
The root head preloads Mittel and Inter.

The canonical Nexora mark retains its three planes. Its original blue SVG,
blue/white favicons, Apple touch icon, and 512px brand icon are restored exactly.
Their geometry and dimensions match the approved redesign assets.

The desktop public hero uses 60px medium headings with a 1.18 line height and
-0.04em tracking. Section headings use 40px at the wide breakpoint. Mobile
headings scale to 34–48px, while body copy remains 15–16px. Working screens
retain their compact information hierarchy in the new heading family. Numeric
metrics remain tabular; measured costs retain four decimal places.

## Public layout

The home, Plans, and Billing pages share `PublicLayout`, including the centered
1300px frame, thin vertical edges, header, full footer, legal links, theme menu,
and back-to-top. The public width/gutter tokens belong to this shared wrapper.
Their main landmarks retain individual skip-link targets.

The desktop site sits in a 1300px frame with thin vertical edges. An 80px
sticky header contains the wordmark, four navigation links, and the account
action. Below 768px the 68px header exposes a Radix navigation dialog with
managed focus, Escape dismissal, and dismissal after navigation.

The hero uses Nexora's blue/silver wash, fine 22px dots,
small bordered eyebrow, centered two-line heading, supporting copy, and paired
44px actions. On mobile, its content aligns left.

Code/Writing/Decisions tabs sit immediately above a 14px square-grid surface.
Each tab changes the example and grid color, resets the illustrative vote, and
supports Left/Right/Home/End keys with one tab stop. Every tab controls the
same labelled panel. The demo presents three independent answers, per-call
metrics, and a clearly labelled illustrative vote. It never claims those
examples are live results or saved user votes.

A three-step workflow and provider row lead into a split editorial section,
a centered section introduction, four bordered product illustrations, a
deep graphite pricing band, expandable FAQ, closing action, and compact footer. The
footer retains legal and support links, appearance selection, and back-to-top.
The previous drifting backdrop and oversized decorative footer wordmark are
superseded by this reference.

## OAuth sign-in

The sign-in page follows the measured Dodo login layout: a centered 384px panel,
40px circular Nexora mark, 20px Inter heading, paired Google/GitHub buttons, legal
copy, and support link. It uses Nexora’s blue/silver/graphite theme tokens.
Buttons stack below 380px and keep 44px mobile touch targets. Google uses its
multicolor mark; GitHub follows the theme foreground. Theme selection sits in
the lower-left corner.

The supported methods are Google and GitHub only. No email, password, OTP,
separator, or separate signup page is presented. Pending requests disable both
provider buttons and expose a status message. Errors retain the plain retry
notice. An already signed-in user sees their account and a Continue action.
The validated `next` path is passed through the existing OAuth handler.

## Working screens

The arena, model picker, catalog, leaderboard, pricing, authentication, billing,
answer cards, and shared-thread surfaces inherit the same blue/silver/graphite palette,
font families, fine edges, and smaller control corners. Product-specific
layouts retain their real data hierarchy: the rail, composer, model lineup,
comparison columns, allowance details, and sortable/filterable catalog remain
functional. Model provider marks keep their local source assets.

Authentication, streaming, votes, sharing, and billing logic are unchanged by
this visual implementation. No live purchase or authenticated model call is
part of the design verification.

## Verification

The original layout and interaction review passed 151 production assertions
and 19 development assertions, recorded in `.impeccable/review/dodo-20261107/`.
The palette refinement passes all 90 token contrast pairs and 92 focused browser
assertions. All 72 original color tokens match exactly, and every non-color public
CSS declaration is retained. Typecheck, ESLint, formatting, and the Vercel build
pass. All 16 public files are copied byte-for-byte to the static output. The
latest captures and checks are in `.impeccable/review/palette-20261107/`;
`docs/scope.md` records both verification scopes.

<details>
<summary>Historical design record — features 4–12, superseded visually on 2026-10-29</summary>

This verbatim record preserves the earlier direction, feature rationale, and verification
evidence. Its warm palette, old fonts, default-theme description, older measurements, and
superseded component recipes are historical evidence, not current visual requirements.

```text
# Nexora — Design System

### Feature 12 — billing management

`/settings/billing` uses a standalone frame like `/plans` and is reached through the
account menu. Its full-width header carries the linked Nexora wordmark and the theme
toggle. Ready, signed-out and unavailable states share that frame and its scrollable
main region. It uses the incumbent fonts, theme tokens, tier chips, buttons and focus treatment.
A single raised plan summary groups current access, status, actions and upcoming dates.
Below it, three unboxed allowance columns show exact remaining and used/total counts
with neutral, semantic meters; the separate free-daily allowance follows a divider.
The detailed allowance is on Billing rather than in the sidebar. Columns stack on
narrow screens, and Free plans show their daily allowance without empty paid counters.
Dates explicitly say UTC. Monthly refill and subscription renewal are separate facts,
especially for annual plans. Past-due and suspended states use plain copy and a portal
action, and portal failures give a retry action without displaying provider errors.

The existing `/plans` composition stays intact. Its buttons now start authenticated
checkout or open the portal for an existing paid subscriber. Billing interval changes
price and saving, while answer allowances and included features stay identical. The
checkout return notice waits for authoritative access state and provides refresh; it
never announces a successful payment from a URL parameter. No new palette or decorative
motion was introduced. Contrast and source checks passed. The account menu uses the
shared Radix dropdown: a separated identity block, matching borderless icon rows,
arrow-key navigation, Escape / focus restoration and inline sign-out failure feedback.

_The durable visual record, generated from the built system (features 4–6), not ahead of it._
_Mode: **Operate** — the visitor completes a task; the interface recedes so the answers and
their numbers carry the surface. Seed key: `f4045e4b`._

The source of truth for tokens is `apps/web/src/styles.css`; this file explains the decisions
behind it. `pnpm check:contrast` parses that stylesheet and re-asserts the accessibility gate on
every run — do not hand-edit a colour without re-running it, because several pairs pass with very
little headroom by design.

---

## Direction contract

Carried verbatim as a source-header comment in `apps/web/src/routes/__root.tsx` (a JS/JSX comment
never emits to HTML, so this is the durable record rather than something grep-able in built
markup):

- **Thesis** — A measurement instrument, not a chat toy. The screen's job is to make three
  models' answers and their real numbers comparable at a glance and honest to the decimal.
- **Own-world** — Warm graphite and paper, one rust accent that only ever lands on something you
  operate. Green means winner, red means error, and neither is spent anywhere else. Montserrat
  sets the headings, Noto Sans carries body and every measured number in tabular figures.
- **Story** — Empty arena invites a prompt → three columns stream in parallel → their metrics
  settle → you vote → an honest leaderboard moves.
- **First view** — A calm rail, a single breadcrumb, and the prompt as the one clear thing to do.
  No fabricated cards pretending work already happened.
- **Form** — Linear's interaction restraint over Stripe's numeric/table typography over
  LMArena/OpenRouter's layout familiarity. Category standard, played straight.
- **Finish** — Seven states on every control, a real 3:1 / 4.5:1 contrast gate, visible focus,
  full keyboard operation, reduced motion respected.

---

## Colour

Dark is the default — all three sketches are drawn dark and the use scene is a browser tab open
beside an editor. Light is fully solved, not an afterthought. Dark tokens live on `:root`; `.light`
overrides them, so every token is declared exactly once and the contrast script has one source to
parse. Values are OKLCH.

### The three colours that carry meaning

Each of these appears **only** where its meaning applies, and none is ever the sole signal — it is
always paired with an icon, shape, position, or text label, because rust-vs-red and rust-vs-green
sit below 2:1 against each other (the contrast script flags them as reminders, not failures).

| Role                  | Meaning              | Where it is allowed                                                                              | Dark                    | Light                   |
| --------------------- | -------------------- | ------------------------------------------------------------------------------------------------ | ----------------------- | ----------------------- |
| `--primary` (rust)    | "you operate this"   | primary buttons, focus ring, caret, links, selected-nav marker, win-rate bar fill, `::selection` | `oklch(0.7 0.152 48)`   | `oklch(0.53 0.149 46)`  |
| `--win` (green)       | winner, nothing else | vote result / winner marker (feature 6)                                                          | `oklch(0.79 0.148 150)` | `oklch(0.44 0.121 150)` |
| `--destructive` (red) | error, nothing else  | failed responses, destructive actions                                                            | `oklch(0.68 0.196 18)`  | `oklch(0.485 0.194 20)` |

`--primary-hover` is the only lightening of rust (`oklch(0.775 0.14 50)` dark / `oklch(0.455 0.132 44)`
light). Each meaning colour ships a `-foreground` pair chosen to clear 4.5:1 on its own fill.

### Surfaces and text

| Token                                  | Dark                    | Light                   | Notes                                       |
| -------------------------------------- | ----------------------- | ----------------------- | ------------------------------------------- |
| `--background`                         | `oklch(0.168 0.011 44)` | `oklch(0.976 0.008 78)` | warm graphite / warm paper                  |
| `--foreground`                         | `oklch(0.955 0.008 72)` | `oklch(0.235 0.016 46)` | body text                                   |
| `--card` / `--popover`                 | `oklch(0.216 0.013 44)` | `oklch(0.995 0.004 78)` | raised surface                              |
| `--muted` / `--secondary` / `--accent` | `oklch(0.262 0.014 44)` | `oklch(0.945 0.01 74)`  | deliberately the **same** value (see below) |
| `--muted-foreground`                   | `oklch(0.745 0.016 56)` | `oklch(0.475 0.02 50)`  | metrics label tier; still clears 4.5:1      |
| `--sidebar`                            | `oklch(0.216 0.013 44)` | `oklch(0.995 0.004 78)` | rail one step off `--background`            |

`--muted`, `--secondary`, and `--accent` share a value on purpose. The consequence is enforced in
the button recipe: the pressed state is a **1px press** (`active:translate-y-px`), not a background
shift, because a background-only active state would be invisible on half the variants.

### Two-tier borders (WCAG 1.4.11)

- `--border` — a decorative seam between two already-distinct surfaces. No contrast ratio owed.
  Dark `oklch(0.3 0.012 44)`, light `oklch(0.88 0.01 62)`. This is the default `border-color` for
  every element via the base layer.
- `--input` — a **functional edge** that identifies a control (the composer box, outline buttons,
  the win-rate-bar track, avatars, scrollbar thumb). Held at a hard 3:1 on every surface it can sit
  on. Dark `oklch(0.537 0.015 44)`, light `oklch(0.628 0.015 58)`.

Reach for `--input` whenever the border is the only thing telling the user "this is a control";
reach for `--border` when it is merely separating two panels.

---

## Typography

Two variable faces, imported via `@fontsource-variable`. No mono is added — both faces ship real
`tnum` (verified against their GSUB tables), so tabular figures come from the body face itself.

- **Montserrat Variable** — `--font-heading`. `h1`–`h4` only, weight 600, `letter-spacing: -0.02em`,
  `text-wrap: balance`. Also the brand wordmark (`.font-heading`).
- **Noto Sans Variable** — `--font-sans`. Body, UI, labels, and every measured number.

### Shared type classes

- `.numeric` — `font-variant-numeric: tabular-nums` + `font-feature-settings: "tnum" 1`. On **every**
  metric, counter, and table figure. Real, not a no-op: without it a streaming counter's digits
  change width as it climbs and the row jitters.
- `.label-meta` — the metrics-label tier: `--text-2xs` (0.6875rem), uppercase, `letter-spacing: 0.08em`,
  `--muted-foreground`. It sits below the value through size, case, and tracking — **never** through
  a lighter colour that would drop under the 4.5:1 floor.

The type scale is a fixed rem scale, not fluid `clamp()`: product UI is read at consistent DPI and a
heading that shrinks inside a sidebar looks worse, not better. Custom step: `--text-2xs` = 0.6875rem / 1rem.

---

## Shape, spacing, motion

- **Radius** — `--radius: 0.625rem`, with `sm` (−4px), `md` (−2px), `lg` (=), `xl` (+4px) derived.
- **Motion** — three named roles, one curve. `--dur-state: 120ms` for state feedback, `--dur-panel: 260ms`
  for a panel that travels (the sidebar width), both on `--ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`).
  `.transition-state` is the single interactive transition, applied deliberately rather than to `*`.
  `--dur-reveal: 2.2s`, added in feature 7, is the third role: motion that hands back text the layout
  had to cut, and it is linear rather than eased because a reader tracks it as it moves instead of
  glancing at where it landed. Its one use is the hovered thread title (below), where it is now the
  **fallback** duration only — that reveal runs at a constant speed, so a measured per-row duration
  overrides it whenever the measurement lands. Outside these three,
  motion only ever reports a state change — nothing in this app animates for atmosphere.
- **Reduced motion** — `prefers-reduced-motion: reduce` collapses all animation/transition to 0.01ms,
  with **one functional exemption**: `[data-spinner]` is slowed to 1.6s rather than stopped, because a
  frozen loading spinner would report nothing and cost the user the "still working" signal.

---

## Components

_Feature 4 built the primitives below; feature 6 added the answer card and the surfaces around it, and
feature 7 the thread-list controls, each marked where it lands._

### `Button` — `components/ui/button.tsx`

The one button in the app. No `asChild` / Radix `Slot`; for a router `Link` that looks like a button,
import the `buttonClasses` recipe instead of the component. The focus ring and the transition are
**not** restated here — `styles.css` owns both, to avoid two sources of truth for the same pixel.

- **Variants** — `primary` (rust, interactive-only), `secondary` (default; hover brightens),
  `outline` (`--input` edge, 3:1), `ghost` (muted → foreground on hover), `destructive` (errors only).
- **Sizes** — `sm`, `md` (default), `lg`, `icon`, `icon-sm`. Icon sizes are always paired with an
  `aria-label`, never a bare glyph.
- **Seven states** — default; hover (per-variant); focus (the global ring); active (1px press);
  disabled (`opacity-45`, shape preserved so nothing shifts when it becomes usable); loading (spinner
  overlaid on an invisible label so width never changes, `aria-busy` announces it); error (the
  `destructive` variant + `--destructive`). The live inline-error surface those styles dress arrived
  with feature 6's streaming failures — see the answer card below.

### Other built primitives

- **`ThemeToggle`** (`components/theme/`) — a real 3-way `radiogroup` (System / Dark / Light), one tab
  stop, arrow-key roving, selected state marked with `--accent` fill + icon, never colour alone. Backed
  by the no-flash inline script in `__root.tsx` (resolves localStorage → `prefers-color-scheme` → dark
  before first paint).
- **`ViewToggle<T>`** (`features/leaderboard/`) — a real `role="tablist"` (Global / Personal): roving
  tabindex, arrow + Home/End with automatic activation, each tab `aria-controls` its panel. Selection
  carries a raised, bordered surface + weight, never colour alone.
- **`PromptComposer`** (`features/arena/`) — the input proof surface. `--input` box that takes the
  global rust ring on `focus-within` (the textarea's own outline is suppressed and this is its
  documented replacement). Auto-grows to 240px then scrolls; Enter sends, Shift+Enter newlines, with an
  IME-composition guard; submit is disabled until the draft is non-empty.
- **`ModelAvatar`** — neutral circular initial on an `--input` edge; no per-provider colour.
- **`VoteVolumeNotice`** (`features/leaderboard/`) — the `.evidence-note` panel that states what the
  standings above it are worth: an info icon, the vote count at full `--foreground` strength, and the
  reason in the metadata tier. Muted panel, never rust / green / red — it is not an alert, it is a
  caption on real arithmetic, and it disappears on its own at 100 votes. It replaced `DemoBadge` in
  feature 9: the table now reads the votes table, so there is no demonstration data left to label.

### Shell

Sidebar (brand, Arena / Leaderboard / Models nav, thread list, user, theme toggle) + top bar (sidebar
toggle, breadcrumb, a `trailing` chrome slot, filled in feature 6 by the win-rate pills), collapsing to a
drawer on narrow widths. `.side-row` is the shared sidebar-row pattern; the selected row is marked by
weight + a 2px rust `::before` bar, never colour alone. Collapsed, the sidebar is a real icon rail with
the same nav plus search — not a hidden sidebar, so nothing is only reachable by expanding it first. Its
footer is the same two controls stacked: the theme toggle turned vertical, and the account row reduced to
its avatar. **The top bar's toggle is the only collapse control.** The sidebar briefly carried its own
arrow as well, which meant two controls for one job and a header row that read as two competing actions.

**Standalone routes supply their own frame.** `/share/$slug` uses the public frame
below; `/plans` uses its pricing frame; `/settings/billing` uses the billing frame with
the linked Nexora wordmark and a theme toggle. The shell wraps the remaining routes.

### The answer card (built in feature 6)

The surface the whole product exists to show: up to three of these side by side in `.turn-columns`, each
one model's answer to one prompt. All of it lives in `styles.css` as named classes rather than repeated
Tailwind, because the same card renders live and on reload.

- **`.answer-card`** — `--card` on a 1px `--border`, four stacked strips: `.answer-head` (model name +
  state), `.answer-vote`, `.answer-body` (the answer), `.answer-foot` (the numbers).
- **State is a dot plus a word, never a colour alone.** `.answer-dot` is `--input` at rest, `--primary`
  pulsing while streaming, `--destructive` on failure. The pulse is the accent's one non-interactive
  use in the app, taking the same exemption as `.thinking-dots`: it reports work in flight, which is
  information rather than decoration.
- **No inner scroll.** The transcript is the app's single scroll container. A column that scrolled on
  its own trapped the wheel over two thirds of the screen and hid its own growth from the
  follow-the-bottom behaviour. A long code line still scrolls inside its own block.
- **The winner is marked twice, deliberately** — `border-color: var(--win)` _and_ an inset 1px ring,
  because a scan across three columns should find the winner before a word is read and one pixel of
  green at card scale does not carry that far. Plus a trophy icon and the word "Winner".
- **`--win` green is spent on exactly one thing in this app**: an answer a person chose. Nothing else
  may claim it.

### Other feature 6 primitives

- **`ResponseMetrics`** (`features/chat/`) — the six measured numbers under every answer, in one
  `.metrics-row`: TTFT, total time, speed, input tokens, output tokens, cost. A `<dl>` with each label
  `sr-only` and an icon standing in for it visually. Six stacked label-above-value columns spent more
  height on the words than the numbers and still wrapped to two rows in a three-way turn, and a
  disclosure to collapse that cost another row to hide one — so the row is always visible and there is
  no control on it. A measurement that genuinely did not happen reads `—`; zero would be a lie. Cost
  reads `$0.0000` to four places precisely because it is measured.
- **`VoteControl`** (`features/voting/`) — an `outline` Button ("Vote for this answer") that becomes
  `.winner-mark` once the vote lands. It gets its own strip below the model header, because
  a button wrapping into the middle of six figures is not where a person looks for one. When the button
  is replaced, focus moves to the mark that replaced it — otherwise a keyboard user is dropped back to
  the top of a long transcript, and a screen reader never hears that the vote saved. The visible label
  stays short while `aria-label` carries the model name, so three columns are not three identical
  announcements.
- **`CopyButton`** (`components/ui/`) — a ghost icon button for a fenced code block and for the prompt
  that produced it. Swaps to a `--win` check for 1.6 s and announces "Copied to clipboard" through an
  `aria-live` region. A clipboard the browser refuses is silently ignored: the text is already on screen
  to select by hand, so an error there would be noise rather than help.
- **`.win-pills`** — the same tally in the top bar, tabular-nums on a `--muted` pill, the leader
  outlined in `--win`. Visible on all screen sizes, with smaller avatars and counts on mobile.
  Each pill's title identifies the model and its win count.
- **`.md-answer` / `.code-block`** — the markdown and Shiki type treatment for streamed answers, with
  the plain `<pre>` serving as both the SSR output and the highlighting-failed state.
- **`ModelStack`** (`components/ui/`) — the models in play as one control instead of three: overlapped
  `ModelAvatar` initials plus a count. Named capsules cost a whole row of the composer and grew with the
  model names, which on this catalog run to "Dots3-Note Preview"; the initials say the same thing in a
  fixed width and the popover behind them carries the names. The avatars are `aria-hidden`, so the count
  is what gets announced.

### Other feature 7 primitives

- **`Dialog`** (`components/ui/dialog.tsx`) — the Radix dialog wrapper, one elevation rule (shadow, no
  border) and two alignments: `center` for a decision, `top` for the command palette. The panel is
  centred by a full-screen flex layer rather than a translate on the panel itself, because the enter
  animation writes `transform` and a centring translate there would be overwritten mid-frame. That layer
  is `pointer-events-none` so a click still reaches the overlay, which is what dismisses.
- **`DropdownMenu`** (`components/ui/dropdown-menu.tsx`) — portalled, so a menu opened from a thread row
  is never clipped by the thread list's own scroll box. `DropdownMenuItem` takes `variant="danger"` and
  emits `data-variant`, which is how Delete gets `--destructive`.
- **`.menu-row`** — the menu-item pattern, deliberately **not** `.side-row` reused. Tailwind utilities
  live in a cascade layer, so a plain `.side-row` class outranks a `text-destructive` utility on the same
  element and Delete would silently render in foreground colour. Owning the danger colour in the class
  itself (`.menu-row[data-variant="danger"]`) is the only version of this that cannot quietly break.
- **The thread row** — `.thread-row` reserves the action button's slot permanently (`padding-right` on
  the link) rather than making room on hover, so nothing reflows under the pointer and the sliding title
  can never run beneath the button. The vertical-dots button reveals on `:hover`, `:focus-visible`, and
  while its menu is open, and is **always** visible under `@media (hover: none)` — an invisible but
  tappable control is worse than a visible one.
- **The title marquee** — a long thread title truncates with an ellipsis at rest and slides its tail into
  view on hover, at a **constant speed** of roughly 55px/s rather than a fixed duration. Fixed duration was
  the first version and it was wrong: it crossed a 40-character overflow and a 400-character one in the
  same 2.2s, so the long titles — the only ones that need the reveal — moved far too fast to read.
  Constant speed cannot be expressed in CSS alone, because CSS cannot divide a length by a length, so
  `ThreadTitle` measures the overflow once on pointer enter and writes `--slide-shift` and `--slide-dur`
  inline; the transition reads them. Both have fallbacks (`min(0px, calc(100cqw - 100%))` and
  `--dur-reveal`), so a row without the measurement still reveals — `.thread-title` remains a container
  (`container-type: inline-size`), `100cqw` is the track, and the percentage resolves against the text's
  own width, so a title that fits provably does not move. The measurement uses a `Range` over the text
  node rather than `scrollWidth`: hovering is what removes the clip, so `scrollWidth` would read the
  already-expanded box and report no overflow. There is no
  right-edge fade, because CSS cannot tell an overflowing title from a fitting one and the fade would
  wash out the titles that were never cut. Reduced motion takes the global rule: the tail simply appears
  — the information is kept, the travel is dropped.
- **`.palette-hit` / `.palette-snippet`** — the search result row and its context line. The matched
  substring is marked by **weight and full-strength foreground**, not a highlight fill: rust means "you
  operate this" everywhere else in the app and a search match is not a control.
- **`.kbd`** — the shortcut chip, used for the `⌘K` hint in the sidebar and the palette's own
  `↑ ↓ / ↵ / esc` footer. Rendered only after mount, because the right glyph depends on the platform and
  guessing it server-side would ship the wrong one to half of readers.

### Feature 8 primitives — the public read

- **The public frame** (`features/chat/shared-thread-screen.tsx`) — a shared thread does **not** render
  the app shell. A reader who followed a link owns none of it, so a sidebar of someone else's threads, an
  account row and a composer that writes would each be a lie about what the page can do. `RootLayout`
  short-circuits on `/share/` and the screen supplies its own frame: the same 14-unit header height as the
  shell so the two do not feel like different products, carrying the wordmark linking to `/`, a hairline
  divider, the thread title as the page's `<h1>`, the read-only badge, and the theme toggle. The turns
  render through the owner's own `TurnBlock`, because a public viewer being shown a _different_ rendering
  of the same answers would undermine the one thing the page is for.
- **No scroller.** The thread screen's jump-to-newest control is deliberately absent. It exists because
  an owner's transcript grows under them while models stream; nothing on this page moves, so the control
  would be an affordance pointing at an event that cannot happen.
- **`.share-badge`** — the "Read-only" pill, eye icon plus word. A `--muted` ground with a `--border`
  hairline and `--muted-foreground` text at `--text-2xs`, uppercase on 0.08em tracking, so it sits in the
  established metadata tier rather than inventing a fourth voice. It is **not** rust, green or red:
  the accent means "you operate this", which is the exact opposite of what this badge says, and the two
  reserved colours mean won and failed. Read-only is a fact about the page, not a state of a result.
- **`WinnerMark`** (`features/voting/winner-mark.tsx`) — the won state of `VoteControl` and nothing else,
  provided to the public page through the same `VoteSlotProvider` the thread route uses for the real
  control. This exists for an accessibility reason rather than a structural one: the trophy-and-word
  `.winner-mark` is a _branch of `VoteControl`_, so simply omitting the vote slot — the obvious way to
  make a page read-only — would have left `data-winner`'s green border as the only signal that a model
  won, breaking the "never signal with colour alone" rule this project has held since feature 4. The
  public page therefore has a vote slot that cannot vote. `sealVotes` drops any still-open vote to closed
  first, so a turn the owner never voted on renders no strip at all rather than an empty one.
- **The footer** — one `--muted-foreground` sentence naming the page for what it is ("a snapshot of
  someone else's comparison") and a single `outline` Button link to `/`. One exit, stated plainly: the
  page is an invitation to try the product, and a row of competing calls to action would make it an ad.
- **`ShareThreadDialog`** (`features/shell/share-dialog.tsx`) — the owner's side, on the same `Dialog`
  primitive as `DeleteThreadDialog`. Before a link exists: one primary "Create link". After: a read-only
  input holding the URL with a `CopyButton`, and "Revoke link" in `--destructive` beside "Done". The copy
  says revocation is permanent, because it is — the slug is set to `NULL`, so the link cannot be turned
  back on and re-sharing mints a different one. Sharing is a deliberate act whose only real risk is
  forgetting it is on, so the undo sits next to it rather than a screen away.

### Feature 10 primitives — price enters the system

Paid models arrive in the catalog, which means the system has to express price for the first time. The
constraint is tight and it is the useful kind: rust means "you operate this", green means won, red means
failed, and blue/indigo/purple are banned outright, so **no hue was available for a four-step price
ladder.**

That turned out to be the right answer rather than a limitation worked around. **A brightness or
saturation ramp rising with price would imply dearer is better, which is the single claim this product
exists to test** — a free model beating a paid one is the most useful thing the leaderboard can report,
and the chip must not quietly contradict it before a reader reaches the numbers.

- **`TierChip`** (`components/ui/tier-chip.tsx`) + **`.tier-chip`** — a model's price tier, in the same
  metadata voice as `.share-badge` (`--text-2xs`, uppercase, 0.08em tracking) because it is the same kind
  of thing: a fact about the model, not a state of a result and not something you operate. The four tiers
  are a **neutral ladder** — Free on a transparent ground, Standard in full-strength text, Advanced
  outlined at the functional `--input` 3:1 edge, Frontier inverted (`--foreground` ground, `--background`
  text). Inversion was free to spend: selection in this app is marked by a raised card surface and a rust
  bar, so nothing else claims it. The word is always present, so the ladder is never the only signal.
- **Above the ceiling reads "Not in arena" on a dashed edge.** `tier` is `null` for a model that costs
  more per answer than the arena allows; it stays on `/models` with both real prices, because a browsing
  page that hid the dearest rows to simplify our own pricing would be exactly the flattering omission
  this project refuses. The dashed border is the second non-colour signal beside the words.
- **`.field-input`** — the shared text input, introduced by the models filter. Only the surface and the
  functional `--input` edge: the base layer already owns the focus ring, the caret colour and the
  placeholder tier, so restating any of them here would be a second source of truth for the same pixel.
- **`.price-pair` / `.price-value`** — both per-million prices on one line, under the per-answer figure
  that is the number a reader can actually reason about. The values own their colour through
  `.price-value` rather than a bare `.price-pair span` selector: Tailwind utilities live in a cascade
  layer, so the element selector would have outranked a `text-muted-foreground` utility and the metadata
  tier would have silently stopped applying. The same trap `.menu-row` documents.
- **`ViewToggle` gained a `radio` mode** and moved to `components/ui/`. The leaderboard now has two
  toggles over one panel, and that is **not** two tablists: Global/Personal swaps panels and stays a
  `tablist`, while Free/Paid filters what is inside the panel, so its `aria-controls` would have pointed
  at an element that does not exist. It is a `radiogroup`, the same distinction `ThemeToggle` already
  makes, and both modes share one keyboard implementation — a single tab stop, roving focus, arrows and
  Home/End — rather than two that can drift apart.
- **The tier rides in the leaderboard's Model cell, not a sixth column.** `PRODUCT.md` names exactly
  three leaderboard metrics and feature 9 refused a sixth column; inside the Paid tab the price spread is
  31×, so a table with no cost signal at all would be worse than the merged table the split replaced. As
  a chip inside an existing cell it costs no column, and the Free tab carries no chip because every row
  on it is free.
- **Each tab states what the split costs it.** A prompt can be sent to free and paid models together, so
  a battle counted on one tab may have been decided by a model on the other. The note sits in the
  metadata tier beside `VoteVolumeNotice` — same job, a caption on real arithmetic — and says it plainly
  rather than letting a reader infer a winner that is not on the page.

---

## Accessibility floor

Non-negotiable, and partly automated:

- **Contrast** — every text pair clears 4.5:1 (3:1 for large/functional edges), enforced by
  `scripts/check-contrast.mjs` against `styles.css` in both themes. Placeholder text is real text and
  carries the full 4.5:1 floor (it is told from an entered value by lightness, not by dropping under
  the gate).
- **Focus** — one rule for everything focusable: `outline: 2px solid var(--ring); outline-offset: 2px`.
  `outline: none` never appears in this codebase without a replacement ring in the same rule.
- **Keyboard** — full operation. Composite controls (theme toggle, view toggle) are single tab stops
  with arrow-key navigation, not N tab stops.
- **Colour is never the only signal** — meaning colours are always joined by icon, shape, position, or
  text. This is why rust/green/red being mutually low-contrast is a note, not a failure.
- **Reduced motion** — respected, with the single functional spinner exemption above.

---

## Honesty rules that shape the UI

`docs/PRODUCT.md` records that no real votes, users, or win rates exist yet, and the product is honest
about measurement. That drives visible design decisions:

- **No surface shows demonstration data any more.** `DemoBadge` is deleted, because nothing is left to
  wear it: the models catalog graduated in feature 5 (live OpenRouter free-tier models) and the
  leaderboard graduated in feature 9 (real aggregates over the votes table). The badge coming off was
  always the signal that a surface graduated; feature 9 took the last one off.
- **Thin real data is labelled, not hidden, and not rounded up into confidence.** The leaderboard ranks
  every model it has evidence for and states the volume in the same breath (`VoteVolumeNotice`), because
  the alternative — withholding the table until some threshold — hides real votes, and showing a bare
  "100%" invites a reader to trust five votes as a verdict. A model nobody has voted on reads `—` and
  sorts last with `rank: null`; it is never given a rank the votes did not express. Models genuinely
  tied on the same record share a rank (standard competition ranking) rather than being ordered by
  something the reader cannot see.
- The arena's first view is an **honest empty state** — a calm heading and the composer — never a wall
  of fake response cards implying a comparison already happened.
- **Cost is measured, and $0.0000 is no longer the only value it can hold.** A free model still reads
  `$0.0000` to four places and that is still correct, still shown, and still not a bug — it is a real
  measured number. From feature 10 a paid answer reads what OpenRouter actually charged, taken off the
  provider's own usage metadata rather than computed by us. When the provider reports no cost we derive
  one from catalog list price and **record that it was derived**, because a derived number and a measured
  one being indistinguishable is the one thing this product cannot allow.
- A user never sees a raw exception or provider error — a plain human sentence and a retry, always.
  `RetryNotice` / `LoaderErrorNotice` (`components/ui/retry-notice.tsx`) are that surface: an alert
  icon, one sentence, one **Try again**. They take a message and never an `Error`, so nothing raw can
  reach the screen through them. The matching in-column surface landed with feature 6: a single model's
  answer failing mid-stream shows its own sentence and its own retry inside its own card, while the other
  two keep streaming untouched. Measured across 188 real rows, a third of free-tier calls fail — that
  surface is load-bearing, not a garnish.
- **Cancelling is never counted against a model.** A stopped answer keeps whatever text arrived and is
  stored as cancelled rather than failed, because stopping is the reader's choice. Its tokens-per-second
  reads `—`: the provider never sent usage, and inventing a number there would be the one thing this
  product cannot do.
- **A failed answer is a loss, and reliability is therefore part of the ranking.** A model in a voted
  turn counts as having been in that battle whether or not it finished, so a model that dies nine times
  in ten cannot read 100% off its one good answer and outrank a model that always finishes. The
  exceptions are the ones that are not the model's fault: a cancelled answer (the reader's choice), a
  model that was never asked, and — from feature 11 — a blocked answer, where our billing said no
  rather than the model. All four live in one predicate, `notTheModelsFault()`, so no second list of
  codes can drift from the first. The leaderboard's speed columns go the other way — they average only
  completed answers, so a model with battles and no completed answer shows a real record next to `—`
  for speed rather than a fabricated zero.
```

</details>
