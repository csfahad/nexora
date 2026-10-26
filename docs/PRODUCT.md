# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Practitioners choosing which language model to actually use — people who write software or
build with LLMs and want to know which one is worth wiring in, before committing to it.

The read on the audience is inferred from repository evidence rather than stated by the
user, and is written here so it can be corrected rather than quietly assumed. The evidence:
Google and GitHub are the only two sign-in providers and email/password was explicitly
rejected (`docs/scope.md`, Stack); the numbers the product measures and ranks by are
time-to-first-token, tokens per second and context window, which are practitioner metrics
and not consumer ones; and the `/models` page sorts the free catalog by context window and
the paid one by cost per answer, which is a buyer's ordering rather than a browser's.

An earlier version of this read also leaned on the product being scoped to the free tier.
That stopped being evidence in feature 10, when paid models entered the catalog, so it is
removed rather than quietly kept: the audience read now rests on the sign-in choice, the
metrics, and the sort orders alone.

Their situation: at a desk, in a browser tab beside the thing they are building, in a
session that lasts minutes rather than seconds. Their job: run one real prompt of their own
against several models at once and decide which answer, and which model, they trust.

## Product Purpose

Send one prompt, watch up to three models answer it at the same time, and vote for the best
answer. Every call is measured as it happens — time to first token, tokens per second,
total tokens, cost — and those measurements plus the accumulated votes build a leaderboard
of which model is actually worth using.

Success is a leaderboard nobody has to take on faith: every row on it traces back to real
votes on real answers and numbers measured off the actual calls that produced them.

## Positioning

The mechanism is simultaneous, measured, side-by-side comparison on the user's own prompt,
where the score and the numbers come from the same call the user just watched. A benchmark
site publishes numbers you cannot reproduce against prompts that are not yours. A single
chat app shows you one answer with nothing to compare it to. Nexora's claim is only
truthful because the measurement and the vote happen in front of the user, on their prompt,
in the same moment.

Two things make that claim hold, and both are constraints the product accepts rather than
features it added:

- Each model answers over its own independent HTTP request, so one model failing, stalling
  or being rate-limited cannot take the other two down with it. Independent failure is the
  premise, not an edge case.
- A failed call is recorded as a real row, not dropped. A model that dies often must not be
  able to outrank one that answers slowly but always finishes.

## Operating Context

- **The arena** is the working surface: a composer, up to three answers streaming in
  parallel, per-answer metrics, and a vote. Follow-ups continue each model's own separate
  conversation inside the same thread.
- **The leaderboard** has a global view and a personal one, each split into Free and Paid,
  ranking models by win rate, average time to first token, and average tokens per second.
  The split is partitioned on the tier recorded on each answer, not on live price, so a
  model that changes price cannot carry an old record into a tab it did not earn it in.
- **The models page** browses the live catalog on two tabs, Free and Paid: name, context
  window, both per-million prices, and the cost of one reference answer. Paid sorts
  cheapest first, because on a paid list price is the only differentiator that matters.
- **Billing** groups the current plan, payment-management actions, renewal dates, and
  exact monthly paid-tier and daily free-answer allowances. It is a standalone page
  like Plans, reached through the account menu on desktop and mobile. Its Nexora
  wordmark links to the arena. The composer retains its last-answer warning.
- Threads persist per signed-in user and are listed by recency, so the tool is usable
  across visits rather than in one sitting.
- The catalog is OpenRouter's live list and it churns: 337 models / 14 free on one
  reading, 464 / 17 free later, with named models disappearing between readings. Any
  model id written down is a snapshot, never a fact.

## Capabilities and Constraints

- **Cost is a real measured number, and it is usually not zero.** A free model reads
  $0.0000 and that is correct, not a bug, and still shown. What changed in feature 10 is
  that $0.0000 stopped being the only value the column can hold: paid models are priced,
  measured, and recorded at what OpenRouter actually charged. A cost we had to derive from
  list price rather than read off the provider is flagged as derived, not passed off as
  measured.
- **The arena's catalog boundary and its payment gate are two different things.**
  `arenaModels()` keeps out only the models above the price ceiling (feature 10); paid models
  inside it became sendable when feature 11 landed the allowance gate — reserved per answer,
  refunded when the call never reached a provider, metered by a monthly allowance in three
  price tiers that `/plans` prices in real arithmetic. Free readers get the free models plus a
  per-user daily share of the shared OpenRouter free pool; a blocked model says so at the
  point of choice in the picker rather than after the send.
- **Some models are in the catalog and not in the arena**, because they cost more per
  answer than the arena's price ceiling — 13 of them at last reading, led by `o1-pro` at
  about $0.66 an answer. A count, not a fact: it is re-derived from live price on every
  refresh. They are shown with both real prices and the words "Not in arena" rather than
  hidden, because `/models` exists to say what OpenRouter actually offers.
- **One prompt minimum, three models maximum.** At three, the add-model control is disabled
  with a plain sentence saying why rather than vanishing. The picker may temporarily have
  zero selected models while a person replaces the defaults, but sending stays disabled
  until at least one model is chosen.
- **A vote only exists once two or more models have answered**, and exactly one vote exists
  per turn, owned by the thread's owner. It is written through one code path
  (`features/voting/cast-vote.ts`) inside a transaction; nothing else may insert a vote.
- **The unit is a turn, not a flat message list.** `User → Thread → Turn → ModelResponse`,
  with `Vote` on the turn — because a vote attaches to the thing being compared.
- **Numbers are measured once and reused.** Timing and token counts ride inside the stream
  itself, so the number rendered on screen and the number written to the database are the
  same measured value, not two estimates that can drift.
- **Tokens per second is measured across the whole call**, not from the first visible
  token. Measuring the visible window reported 2277 tok/s for a reasoning model that
  actually runs at 30–54.
- **Never show a raw exception or provider error to the user.** A plain human sentence and a
  retry action, always. The real provider error is logged server-side.
- One origin: TanStack Start owns the server, there is no separate backend app.
- No test runner and no browser automation framework, by decision. Verification is a real
  dev server in a real browser, or something as light as `curl`.

Terminology, as the product uses it: a **thread** is a conversation; a **turn** is one
prompt and the fan-out of answers to it; a **response** is one model's answer within a
turn; a **vote** picks the winning response of a turn.

Decided in feature 8, recorded here because it is a product fact rather than an
implementation detail: a thread can be shared, by a revocable secret link at `/share/<slug>`
rather than by making its own URL public. A public viewer reads the whole comparison — every
prompt, answer, measured number, and the winner — and can operate nothing. Revoking kills the
link permanently; re-sharing mints a different one. Shared threads are never search-indexed.

## Brand Commitments

- The product is named **Nexora**. The sketches letter it "LLM Arena"; that is placeholder
  hand-lettering in a structural sketch, not a name.
- **Standing preference: the category standard, played straight.** Offered a choice between
  three metaphor-led visual worlds and the plain, well-built app-shell convention, the user
  chose the convention deliberately. So convention is the commitment on every surface, not
  a fallback: a left sidebar, a top bar with breadcrumbs, response cards, familiar
  affordances where a category-fluent user reaches for them, and no metaphor smuggled in
  as flavour. Later surfaces do not reopen this as a question.
- **The craft bar is Linear, the Stripe Dashboard, and LMArena/OpenRouter**, in that order
  of authority and for three different things. Linear sets interaction craft: keyboard-first
  operation, density held without clutter, and motion that only ever reports a state change.
  The Stripe Dashboard sets table and numeric typography, which is the bar the leaderboard
  has to clear. LMArena and OpenRouter set only where affordances sit, so a user who has
  used them is never surprised; their finish is visibly below the other two and was named
  for layout familiarity, so it is explicitly **not** the finish bar.
- One accent color, **rust**, used only for things you interact with — buttons, links,
  focus, the win-rate bar — never as decoration.
- **Blue, indigo and purple are never the accent**, under any circumstance.
- **Green is reserved for marking a winner. Red is reserved for errors.** Neither is reused
  for anything else.
- The background family and the accent are both warm, so the accent must stay clearly
  brighter and more saturated than the ground: a button may never blend into the page.
- Voice: plain and measured. Never sell the numbers, never apologize for them, never hide
  a zero.

## Evidence on Hand

- A working streaming slice verified against live models, with real recorded numbers:
  ttft 1914 ms, duration 2013 ms, 22 prompt / 62 completion tokens, 30.8 tok/s, cost 0.
- A verified independent-failure run: three concurrent requests where one named a bogus
  model; the bad one failed alone and a good one completed normally.
- A genuine upstream 429 from `google/gemma-4-31b-it:free` during that run, recorded as a
  real operating condition of the free tier.
- **188 real `model_response` rows** from feature 6's own development and verification, read
  back out of the database rather than off the screen: 118 complete, 63 failed at the
  provider, 5 cancelled, 2 left streaming by dev-server restarts. Cost is `0.000000` on every
  one of them. A third of all free-tier calls failed — that is the honest operating condition
  of this product, and it is measured, not estimated.
- **A confirmed three-way turn**: `nemotron-3-ultra` complete at 1,468 chars / 91.13 tok/s,
  `glm-5.2` failed alone, `minimax-m3` complete at 1,775 chars / 112.10 tok/s. Independent
  failure is not a design intention here; it is an observed fact.
- **A model that refuses every call**: `thinkingmachines/inkling-small:free` is listed in the
  free catalog and answers "only available on agentic harnesses" in about 150 ms. A live
  reminder that catalog presence is not availability.
- The live OpenRouter catalog, read directly, with real context windows (1,000,000 /
  512K / 262,144 / 128,000) and `pricing.prompt` and `pricing.completion` both the string
  `"0"` for every free model. 18 free models at last read.
- Three hand-drawn structural sketches at `docs/ui-sketch/` — arena, leaderboard, models.
  Structure only: where things sit and what exists on the page.
- **What does not exist and must not be fabricated:** no real users beyond the developer, no
  public traffic, no testimonials, **no subscribers and no revenue**, no deployment.
- The paid catalog is real and priced. Feature 12 wires authenticated Dodo checkout and
  billing management, with access granted only by verified subscription events. No real
  test-card purchase or revenue has been verified. The 7 votes and 37 threads
  in the database are one person testing the build, which is enough to prove the vote path and
  nowhere near enough to rank a model — so no leaderboard standing, win rate or ranking may be
  presented as real. Anything shown before real votes exist is demonstration data and must be
  labeled as such.
- **The live catalog as measured at feature 10, after the eligibility filters**: 464 rows
  returned, 75 of them `:batch` variants and 6 quoting a negative price, leaving 351
  comparable models — 17 free, 199 standard, 101 advanced, 21 frontier, 13 above the arena's
  price ceiling. Read off the live API, not estimated.

## Product Principles

- **Honest over flattering.** A zero cost, a failed call, and a model that lost all three
  times are all shown as they are. Nothing is rounded up into a better story.
- **One measured number, one place it came from.** The screen and the database read the
  same value off the same call.
- **Independent by construction.** One model's failure, slowness or rate limit never
  degrades another's answer.
- **The comparison is the product.** Anything that makes two answers harder to read against
  each other is a regression, whatever else it adds.
- **A snapshot is never a fact.** The free-tier catalog churns; the app derives from live
  data and pins nothing.

## Accessibility & Inclusion

A gate, not an aspiration, on every screen and in both light and dark mode:

- Body text at 4.5:1; borders that identify a component, and large text, at 3:1.
- A 2px rust focus ring with 2px offset, visible on every interactive element in both
  modes. `outline: none` never appears without a replacement ring in the same rule.
- Full keyboard operation of the theme toggle, the model picker, and the vote buttons.
- **Color is never the sole carrier of meaning.** Rust and error-red sit only ~26–30° of
  hue apart, and rust and winner-green ~102°, which is squarely in deuteranopia's blind
  spot. Winner, error and selected states each carry a second signal — text, icon, or
  shape — beyond their color.
