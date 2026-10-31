---
name: Nexora
description: A precise workspace for independently measured model comparisons.
colors:
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
    display:
        fontFamily: '"Geist Variable", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "clamp(2.5rem, 4.4vw, 3.5rem)"
        fontWeight: 600
        lineHeight: 1.1
        letterSpacing: "-0.04em"
    headline:
        fontFamily: '"Geist Variable", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "clamp(2rem, 3.4vw, 2.75rem)"
        fontWeight: 600
        lineHeight: 1.12
        letterSpacing: "-0.035em"
    title:
        fontFamily: '"Geist Variable", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "1.125rem"
        fontWeight: 600
        lineHeight: 1.5
    body:
        fontFamily: '"Geist Variable", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "0.875rem"
        fontWeight: 400
        lineHeight: 1.7
    label:
        fontFamily: '"Geist Variable", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif'
        fontSize: "0.75rem"
        lineHeight: "1.25rem"
        letterSpacing: "0.015em"
rounded:
    sm: "10px"
    md: "12px"
    lg: "14px"
    content: "16px"
    xl: "18px"
    composer: "24px"
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
        backgroundColor: "{colors.primary-dark}"
        textColor: "{colors.primary-foreground-dark}"
        rounded: "{rounded.pill}"
        padding: "0 16px"
        height: "40px"
    button-primary-hover:
        backgroundColor: "{colors.primary-hover-dark}"
    button-secondary:
        backgroundColor: "{colors.secondary-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.pill}"
        padding: "0 16px"
        height: "40px"
    button-outline:
        backgroundColor: "{colors.card-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.pill}"
        padding: "0 16px"
        height: "40px"
    button-ghost:
        backgroundColor: "transparent"
        textColor: "{colors.muted-foreground-dark}"
        rounded: "{rounded.pill}"
        height: "40px"
        width: "40px"
    button-destructive:
        backgroundColor: "{colors.destructive-dark}"
        textColor: "{colors.destructive-foreground-dark}"
        rounded: "{rounded.pill}"
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
        rounded: "{rounded.pill}"
        padding: "6px 6px 6px 8px"
    prompt-composer:
        backgroundColor: "{colors.card-dark}"
        textColor: "{colors.foreground-dark}"
        rounded: "{rounded.composer}"
        padding: "20px"
---

# Design System: Nexora

<!-- nexora-design-record: 20261029 -->

## Overview

**Creative North Star: "The Comparison Workspace"**

Nexora is a calm, precise comparison workspace. The user-pinned references are Apple, [Vidyst](https://www.vidyst.com), and [Backdoor](https://backdoorai.app): cool silver surfaces, graphite text, blue controls, rounded forms, and restrained depth. The interface gives the prompt, independent answers, and their measured numbers room to read.

This record describes the shipped redesign identified by `nexora-ui-20261029`, preserved in the leading `/*!` comment of `apps/web/src/styles.css`. That stylesheet owns visual tokens; shared components own reusable behavior. Both themes are complete. The default appearance choice is **System**, which follows the OS; explicit Light or Dark choices persist. Dark tokens on `:root` are the fallback, not a newly imposed theme preference.

**Key Characteristics:**

- Prompt-first comparison with an understated branching mark.
- Cool tonal surfaces, blue operation, and readable graphite typography.
- Pill controls, 16px content cards, and soft floating depth.
- Shared components, full keyboard states, and reduced-motion alternatives.

The frontmatter preserves the source OKLCH values for both themes. Its component tokens
describe the dark fallback; live components bind to semantic CSS variables and therefore
resolve either theme. The schema-v2 sidecar at `.impeccable/design.json` adds shadows,
motion, breakpoints, and self-contained component previews. Its tonal ramps are derived
preview metadata, not additional application tokens.

Evidence boundary: the review screenshot batch covers arena, picker, models, leaderboard,
plans, sign-in, and signed-out billing on desktop/mobile, with selected dark states.
Authenticated chat, shared threads, and billing-ready states were source-reviewed rather
than visually captured. The current source includes the final navigation, radius, and
heading-semantic corrections and governs this record. Paid purchase and portal flows were not verified
by this visual documentation pass. Earlier feature evidence remains preserved below.

## Colors

The palette is cool and low-chroma around a single blue accent. Readable text and neutral
surfaces carry the screen; saturated colors identify operation or a semantic state.

### Primary

- **Control Blue** (`primary`, `primary-hover`, `primary-foreground`): primary actions,
  links, selection, caret, focus, activity indicators, and the branching comparison mark.
- **Soft Blue** (`primary-soft`, `surface-tint`): selected navigation, featured plans,
  prompt bubbles, and the subtle catalog spotlight. These are supporting tints rather
  than a second accent.

### Neutral

- **Cool Ground** (`background`, `sidebar`): silver page and rail in light mode;
  near-black graphite and a slightly raised rail in dark mode.
- **Reading Surface** (`card`, `popover`): content and floating layers. Popovers receive
  a distinct dark elevation tone; both are white in light mode.
- **Graphite / Pale Ink** (`foreground`): primary copy and measured values.
- **Quiet Ink** (`muted-foreground`): descriptions, labels, placeholders, and secondary
  icons. It remains readable; smaller metadata does not receive an extra opacity cut.
- **Tonal Steps** (`muted`, `secondary`, `accent`): chips, secondary controls, segmented
  tracks, and hover. These are separate values, not interchangeable aliases.
- **Seam / Control Edge** (`border`, `input`): seams divide already visible surfaces;
  the stronger input tone identifies text fields and supports control-edge emphasis.
  Outline buttons use a seam plus their card fill and pill silhouette.

Winner Green and Error Red are semantic exceptions, with their own foreground pairs.
Green marks chosen answers; blue marks copy confirmation. Red marks errors and destructive
actions. Neither green nor red is a provider identity or a price-tier scale. Provider avatars may carry
their small source-defined marks; price tiers use labels and neutral tonal differences.

**The Blue Operation Rule.** Use blue for controls, selection, links, focus, and the comparison signature. Keep large reading surfaces neutral; green and red retain their semantic roles.

## Typography

**Display Font:** Geist Variable, with the system sans-serif fallback in the frontmatter.
**Body Font:** the same Geist family. There is no second heading family. Code blocks use
the existing monospace treatment; comparison metrics remain in Geist with tabular figures.

The hierarchy is compact in working UI and spacious in introductory headings. Headings
balance wrapping; descriptive copy uses comfortable line heights and restrained measure.

### Hierarchy

- **Display:** the arena's two-line heading; its second line uses quiet ink. Plans uses
  the same size range with its own wider viewport scaling (`5vw`).
- **Headline:** Models, Leaderboard, and Billing page titles, paired with descriptive copy.
- **Title:** section and plan titles. Catalog model names use a smaller compact title
  (`0.9375rem`, weight `600`, line height `1.5`) and wrap rather than clipping.
- **Body:** answer copy uses the frontmatter body role; page descriptions sit one step
  above (`0.9375rem`) and the composer stays at (`1rem`) including mobile.
- **Label:** metadata remains sentence case. Buttons and measured footer values use
  (`0.8125rem`–`0.875rem`); compact hints use the retained `2xs` step (`0.6875rem`).

**The Numbers Stay Still Rule.** Apply tabular figures to measured values, counters, prices, and table arithmetic. Preserve missing values as an em dash and measured cost to four decimal places.

## Layout

The desktop shell has a left rail (`256px`) and top bar (`64px`). It can collapse to a
functional icon rail (`64px`) retaining primary routes, search, account, and appearance.
The top-bar toggle owns collapse. Below (`1024px`) navigation becomes a Radix drawer
(`272px`, at most `85vw`) with overlay, focus management, Escape, and dismissal on navigation.
The primary route remains selected when its search parameters change.

The arena centers a prompt-first workbench within (`58rem`): branching mark, two-line
heading, explanatory line, composer, visible selected-model pills, and prompt starters.
Ordinary pages use a centered (`75rem`) content container. Thread and shared content use
(`76rem`), Plans (`78rem`), and Billing (`64rem`). The body stays viewport-bound;
each screen owns its scroll region. Answer columns share the transcript scroll rather
than creating separate wheel traps; long code lines may scroll inside their block.

Spacing follows a (`4px`) rhythm, with (`16px`) card/grid gaps, (`24px`) card padding,
and (`32px`–`48px`) section breathing room. The catalog steps from three columns to two
at (`1200px`) and one below (`640px`). Answer comparisons become simultaneous columns
at (`1024px`) and stack below it. Plans uses four columns, two below (`1024px`), and one
below (`640px`); its shared bands use subgrid on wide screens. Billing allowances and dates
stack below (`640px`). The leaderboard preserves its real table in a horizontal scroller.

Below (`640px`) headers become (`56px`), page padding contracts to (`16px`), heading/toolbars
stack, and the arena lineup wraps from the left. Composer hint and visible send text drop
away while the accessible send label remains. Touch controls receive minimum (`44px`)
targets where specified, including model removal and plan actions. Bottom composer padding
respects the safe-area inset.

## Elevation & Depth

The system combines tonal layers and subtle seams with restrained soft shadows. Ordinary
catalog, answer, plan, and allowance containers stay flat at rest. The composer and auth
panel get a reading-surface lift; dialogs/popovers carry the strongest elevation over a
dimmed, blurred overlay. Theme and tab selection use only the smallest lift.

### Shadow Vocabulary

- **Small lift** (`--shadow-sm`): selected appearance and view controls.
- **Card lift** (`--shadow-card`): authentication panel.
- **Composer lift** (`--shadow-composer`): prompt entry.
- **Floating lift** (`--shadow-floating`): portalled menus, popovers, and dialogs.

Exact shadow values and both theme variants are preserved in the sidecar. Primary buttons
add a small inset highlight and base shadow; winner cards use their green edge and label,
without adding a heavy shadow.

**The Depth Has a Job Rule.** Use tonal separation and seams for ordinary content. Reserve stronger shadows for the composer, authentication panel, and floating overlays.

## Shapes

Content cards, answer cards, tables, empty states, auth, plans, and billing panels use the
shared gentle corner (`16px`). The base token is (`14px`), with derived (`10px`, `12px`,
`18px`) steps for marks, rows, inputs, and floating content. The composer intentionally has
a more generous (`24px`) shell. Buttons, model lineup, prompt starters, and status chips
use full pill rounding. Borders are thin (`1px`); avatars are compact rounded provider
marks, while lineup avatars are circular. Composer selector stacks use (`24px`) circular
avatars and (`1px`) separator rings, leaving space inside the selector pill
(`32px` desktop, `44px` touch target).
Logos resolve from the model publisher namespace,
including aliases, rather than guessing from model-family names. Official SVGs are local
monochrome marks; published author avatars cover community publishers. Raster marks retain
a white backing (dark for Recursive’s white mark) so they remain readable in either theme.
Preserve these role differences when adding a
surface rather than applying one radius everywhere.

## Components

### Buttons

Compact, confident pills. The shared `Button` provides primary, secondary, outline, ghost,
and destructive variants; router links reuse `buttonClasses`. Default height is (`40px`),
with (`32px`) small, (`48px`) large, and corresponding icon sizes. Hover uses the variant's
tonal change; active scales to (`0.98`). Disabled opacity is (`45%`), and loading overlays
a spinner on an invisible label to preserve width while exposing `aria-busy`.

Focus is a visible blue outline (`2px`, offset `2px`); pill buttons preserve their shape
on focus. Text fields use only a thin (`1px`) blue edge. Composite inputs suppress the
inner outline and use a thin wrapper edge for the composer and share-link field, or an
inset bottom line for palette search. A focused button inside a composite retains its
own keyboard outline; it does not draw a second outline around the whole wrapper.

### Chips

Selected-model pills name the lineup and provide labelled removal controls.
On mobile, the lineup stays centered on one row with smaller padding, 16px provider marks, and
24px removal targets. Names truncate within the available space; their full titles and
removal labels remain available.
Prompt starters populate and focus the actual composer. Tier chips are neutral and text-labelled, including
“Not in arena”; they do not borrow winner or error colors. Segmented tabs use a muted track
and raised card selection; the shared view control supports tabs and radio modes.

### Cards / Containers

Catalog cards group a provider mark/name/tier header and label-value details, with (`24px`)
padding and a thin seam. The adapted Aceternity **CardSpotlight** applies a soft pointer
highlight using Motion values rather than React renders. It skips touch pointer tracking
and hides the highlight for reduced motion. Empty states retain an honest title,
description, and relevant action instead of fabricated data.

### Inputs / Fields

Search and form fields use a stronger input edge, reading-surface fill, (`12px`) radius,
and at least (`44px`) height. The **PromptComposer** auto-grows to (`180px`), then scrolls;
Enter sends, Shift+Enter adds a line, and IME composition does not trigger submission.
It persists a session draft, focuses starter text, and enables sending only for a nonempty
prompt with an eligible selection and no pending send. A stop control replaces send while
answers are active.

The homepage composer keeps its generous two-row prompt area. Thread follow-ups start
with one text row above the controls, 12px vertical padding, and an 8px toolbar gap.
They grow with the draft up to the same 180px text limit, then scroll.

The adapted Aceternity **HoverBorderGradient** is a finite CSS border sweep triggered by
hover or focus (`1.6s`), with a thin blue edge on textarea focus. It has no idle timer. The
branching mark similarly enters once (`1.6s`). Shared state feedback uses (`180ms`) and
panel travel (`320ms`) on the established exponential ease. Reduced motion suppresses
these embellishments and collapses normal transitions; loading spinners retain a slower
functional cycle (`1.6s`). Thread-title reveal remains an overflow-only functional state.

### Navigation

The expanded rail carries brand, primary routes, thread search/history, account,
and appearance. The shell’s “Explore plans” action lives in the top bar. Rows use quiet ink at rest, a tonal hover, and soft blue plus heavier text
when selected. The compact rail retains labelled icon controls. Thread actions reveal on
hover/focus/open and remain available on touch. Portalled menus and dialogs prevent
clipping; keyboard navigation and focus restoration come from the shared Radix wrappers.
The sidebar footer puts the account control and an icon-only theme menu on one row.
The menu shows System, Dark, and Light as radio items with a checked selection; choices
persist and synchronize across mounted controls. Standalone headers retain the segmented
theme picker. A full-width seam follows Search threads, with a 10px gap above Recent
threads. Thread rows are 36px with 8px gaps between groups and no added row gap.

### Comparison, Standalone, and Account Surfaces

Answer cards keep a model/state header, readable body, vote strip, and always-visible
measured footer. State carries a word and dot; a winner carries a green edge, trophy,
and label. Missing measurements read `—`. Shared threads reuse the comparison in a
standalone frame with a thread-title `h1`, an explicit read-only badge, and no vote or send controls.

Plans, Billing, and shared threads use a full-width standalone header with consistent
edge padding, a vertically centered linked wordmark and page title, and the sidebar's
icon-only System/Dark/Light menu opening below the header.
The wordmark provides the route to the arena; there is no separate back button. Plans keeps interval selection and real price/allowance arithmetic within aligned
cards; plan names are `h2` beneath the page `h1`, and a featured card uses soft blue and its action. Billing groups current plan/actions,
UTC dates, exact remaining/used allowances, and the separate daily free allowance. Signed-out,
unavailable, attention, and portal-failure states use plain copy and relevant actions.
The sign-in panel carries Google/GitHub providers, stable loading buttons, and inline failure
copy. Their visual treatment must not change payment, entitlement, or authentication facts.

## Do's and Don'ts

### Do:

- **Do** extend the semantic tokens and existing shared components before introducing a new visual recipe.
- **Do** keep prompt entry, selected models, independent answer states, and measured figures easy to find.
- **Do** use 16px content cards, pill controls, and the established 4px spacing rhythm.
- **Do** preserve text or icons alongside winner, error, selected, and unavailable states.
- **Do** review desktop and mobile in both themes, keyboard focus, long names, empty data, and reduced motion after visual changes.
- **Do** run the contrast gate after changing colors and regenerate this record and its sidecar when shared tokens or component rules change.

### Don't:

- **Don't** restore the superseded warm-paper, rust-accent, blue-ban, or Montserrat/Noto Sans guidance from the historical record.
- **Don't** replace independently readable answers with decorative previews or hide their measured metrics.
- **Don't** add perpetual decorative motion, provider-color ranking scales, or a new display font.
- **Don't** treat a screenshot, a live catalog count, or a source review as proof of a paid purchase or an authenticated flow.

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
