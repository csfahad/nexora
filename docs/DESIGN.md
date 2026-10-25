# Nexora — Design System

### Feature 12 — billing management

`/settings/billing` lives in the existing app shell and is reached through the account
menu. It uses the incumbent fonts, theme tokens, tier chips, buttons and focus treatment.
Neutral dividers separate current access, three used/total counters and upcoming dates;
dates explicitly say UTC. Monthly refill and subscription renewal are separate facts,
especially for annual plans. Past-due and suspended states use plain copy and a portal
action, and portal failures give a retry action without displaying provider errors.

The existing `/plans` composition stays intact. Its buttons now start authenticated
checkout or open the portal for an existing paid subscriber. Billing interval changes
price and saving, while answer allowances and included features stay identical. The
checkout return notice waits for authoritative access state and provides refresh; it
never announces a successful payment from a URL parameter. No new palette or decorative
motion was introduced. Contrast and source checks passed; a real visual and keyboard
pass remains outstanding.

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

**The shell is the owner's app, and one route is outside it.** `/share/$slug` renders its own frame
instead — see the feature 8 primitives below. The shell wraps every other route.

### The answer card (built in feature 6)

The surface the whole product exists to show: up to three of these side by side in `.turn-columns`, each
one model's answer to one prompt. All of it lives in `styles.css` as named classes rather than repeated
Tailwind, because the same card renders live and on reload.

- **`.answer-card`** — `--card` on a 1px `--border`, four stacked strips: `.answer-head` (model name +
  state), `.answer-body` (the answer), `.answer-vote`, `.answer-foot` (the numbers).
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
- **`VoteControl`** (`features/voting/`) — an `outline` Button ("Pick this one") that becomes
  `.winner-mark` once the vote lands. It gets its own strip between the answer and its numbers, because
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
  outlined in `--win`. Hidden below 48rem rather than shrunk: it summarises what every card already
  says, so a small screen loses the convenience and none of the information.
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
