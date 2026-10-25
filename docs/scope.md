# Scope: Nexora

Send one prompt, watch up to three AI models answer it at the same time, and vote for the best one. Over time those votes and the real per-call numbers, speed, tokens, cost, build an honest leaderboard of which model is actually worth using.

Build it in a thin, working slice first, one prompt actually reaching a model and coming back, before making any single part of it fuller. Then thicken it piece by piece. Before building anything, decide what you're doing and why in a few plain sentences, then build it, and if the plan turns out wrong once it's actually built, say so and fix the plan too, not just the code.

Whenever a "build it" style step actually gets underway, break it into its own short list of what's genuinely being done, and check each part off as it's finished, right in this file. That way this file can be opened fresh, in a brand new conversation, and it's obvious what's already done and what's still left, without anyone re-explaining the feature from scratch.

## Stack

TanStack Start (React), TypeScript, Tailwind v4, shadcn for components (card, button, popover, loading skeleton, and whatever else the UI actually needs as it gets built), Prisma as ORM, Neon Postgres as the database, Better Auth for auth (only Google and GitHub OAuth, no email-password), Arcjet in front of the endpoint, PostHog for analytics and observability.

**TanStack Start owns the server; there is no separate backend app.** This replaces an earlier line that put Express at `apps/api` and called it closed, nothing open. It was reopened deliberately, because every feature-level decision written below already assumed one origin: `/api/chat` as a route in the web app, `infrastructure/` living inside it, a layout reading the database server-side. Keeping Express would have meant rewriting features 5 through 9.

The reasoning is kept here in full, because "isn't it unsafe to put everything in the frontend?" is a fair question that will come up again. TanStack Start is not a frontend framework with a server bolted on. `vite build` emits `.output/public` (static assets, downloadable) and `.output/server` (a Node/Nitro server, private). Two trees, one codebase. The server/client boundary is enforced by the compiler rather than by a network hop, and that was measured rather than assumed:

- A secret read inside `createServerFn` stayed in `.output/server` only. The client chunk for that very same file contained the component with the secret-reading body removed and the call replaced by a `POST /_serverFn/<hash>` fetch. Grepping `.output/public` for the marker string, the value, and even the variable name returned nothing.
- Deliberately importing a config-reading module straight into a component leaked the variable _name_ but not the value: Vite compiles `process.env` to `{}` in client code, so the worst case is `undefined`, not an exposed key.
- Adding `serverOnly()` to that module turned the same mistake into a hard `RolldownError` at build time. Since `CLAUDE.md` already requires a real build after every change, that mistake cannot reach a deploy.

This is the same model as Next.js server actions, Remix loaders and SvelteKit's `+page.server.ts`. The practical wins over a split Express app are same-origin auth cookies (no `SameSite=None`, no CORS, no ITP grief on the very first login), direct streaming with no proxy in the middle, and one deploy target instead of two. `apps/api` was deleted and its thirteen environment variables moved to `apps/web/.env`.

## Sketches

There are rough hand-drawn sketches for the arena screen, the leaderboard, and the models page. Treat them as structure only, where things sit, what exists on the page, not as the final design or the actual colors, all of that is already decided elsewhere in this file. If something in a sketch genuinely contradicts what's written here, stop and ask which one actually wins rather than guessing.

## At a glance

Status here means what is actually in the repository, verified by running it. An earlier version of this table claimed features 2 through 9 were built; none of them were, and `git ls-files` on both branches confirmed nothing had ever been committed beyond the starter. That is corrected below, and the rule going forward is that a row only advances when the thing actually runs.

| #   | Feature                                     | Phase      | Status                                                                                                                                                                                                                                                                                                                                                   |
| --- | ------------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Connecting to a model                       | Foundation | thin slice done, verified against a live model; DB/auth/Arcjet/PostHog all done in features 3 and 6                                                                                                                                                                                                                                                      |
| 2   | Coding standards & tooling                  | Foundation | done, enforcement probed and failing correctly                                                                                                                                                                                                                                                                                                           |
| 3   | Data model                                  | Foundation | built and verified; automated gate green, migrated against Neon and checked by hand                                                                                                                                                                                                                                                                      |
| 4   | Design & look                               | Foundation | built and verified; automated gate green, manual browser + keyboard pass confirmed                                                                                                                                                                                                                                                                       |
| 5   | Model picker                                | Slice 1    | built and verified; automated gate green, live smoke test and manual pass confirmed                                                                                                                                                                                                                                                                      |
| 6   | Send a prompt, parallel streams, and voting | Slice 1    | built and verified; all six stages done, automated gate green, live multi-model pass and rows read by hand                                                                                                                                                                                                                                               |
| 7   | Thread history                              | Slice 2    | built and verified in a real browser; authenticated history query, recency grouping, sidebar links, invalidation after new/follow-up turns, model-generated titles, rename/delete/⌘K search                                                                                                                                                              |
| 8   | Public thread visibility & sharing          | Slice 3    | built and verified in a real browser; automated gate green, write paths probed by `curl`, private-window pass confirmed including revocation                                                                                                                                                                                                             |
| 9   | Leaderboard: global & personal              | Slice 4    | built and verified in a real browser; real aggregates over the votes table, thin volume labelled by `VoteVolumeNotice` rather than hidden; automated gate green, global scope checked against the real 7 votes by `curl`                                                                                                                                 |
| 10  | Paid models in the catalog and the arena    | Slice 5    | built; catalog is tiered and cost is measured, `/models` has Free/Paid tabs and the leaderboard a second toggle, migration applied; automated gate green except the Impeccable detector, browser pass outstanding                                                                                                                                        |
| 11  | Plans, allowances, and the quota gate       | Slice 5    | **feature complete**: gate (reserve/refund/plan-aware Arcjet/leaderboard exclusion), composer chip, billing allowance meters, `/plans` cards, reconciliation script (end-to-end probed against the real DB), reference shape re-measured and holding; gate + detector green, SSR verified by `curl`. Remaining: a person's real paid turn + browser pass |
| 12  | Dodo Payments: checkout, portal, webhooks   | Slice 5    | implemented and verified: auth checkout/portal, signed transactional webhooks, billing screen, stable reservation periods; six Dodo products verified, Neon migrated; gates and PostgreSQL/SSR probes green; real test-card checkout and browser pass pending                                                                                            |

**Features 5, 6 and 7 were written against Next.js and Clerk, which this project does not use.** They refer to `revalidate`, `app/(shell)/layout.tsx`, `router.refresh()`, `usePathname` and a Clerk `userId`. The decisions underneath them are mostly still sound; the mechanisms are not. Each is flagged inline below and gets rewritten when its turn comes, not speculatively now.

## Foundation

### 1. How the app actually connects to a model

Two real decisions were open here: how the app calls OpenRouter to get a model's answer, and how streaming three models back to the browser at once should actually work. The second was worth real thought: routing all three through one shared connection looks simpler, but if that one connection drops, all three answers die together, which breaks the whole point of one model failing never affecting the others. Both are decided below and wired.

PostHog should be wired in here too, session replay and heatmaps turned on, and tied to the signed-in user once Better Auth resolves, so events are attached to a real person, not left anonymous. Built in feature 6, stage 5 — `infrastructure/posthog-browser.ts` holds the browser half and the decisions are recorded there rather than repeated here.

**The TanStack Start project already exists.** `pnpm dlx @tanstack/cli@latest create` was run before any of this started (`apps/web`), React 19, Tailwind 4, TypeScript strict. That part of this feature was already satisfied on arrival.

**The Express backend at `apps/api` was deleted, not extended.** It held only a `package.json` and an empty `src/`, so nothing was lost. See the Stack section for why the server moved into the web app.

**Calling OpenRouter: Vercel AI SDK v7 with `@openrouter/ai-sdk-provider` v3.** Server-side `streamText` per model. Installed and verified as `ai@7.0.66` with `@openrouter/ai-sdk-provider@3.0.0`, whose peer range is `ai@^7`, so the pairing is current rather than assumed. Raw `fetch` with hand-parsed SSE was the real alternative and it would have worked, but feature 6 requires PostHog's own per-call LLM analytics, and `@posthog/ai` wraps AI SDK providers directly. Choosing raw fetch here means hand-rolling that tracing later, plus cancellation and usage parsing, to save two dependencies. Not worth it.

**PostHog records AI SDK v7 calls with `captureAiGeneration`, rather than the provider wrapper.** The current OpenRouter provider exposes the SDK's V4 model interface while `@posthog/ai`'s `withTracing` wrapper is typed for V2/V3, so wrapping it would require an unsafe cast. `captureAiGeneration` is PostHog's supported generic LLM-analytics entry point and receives the same real usage, latency, and time-to-first-token when the stream ends. This keeps the analytics honest and the API strictly typed; move back to the wrapper only when its supported model interface catches up. Built in feature 6, stage 5, where the finding was re-verified against the installed versions rather than trusted — it still holds.

#### What the thin slice actually built, and what it measured

One prompt reaching one real model and streaming back, per the instruction to build the thinnest working slice before thickening any part of it. Deliberately excluded: Prisma, Better Auth, Arcjet, PostHog. There is no user to attach analytics to and nothing to persist until features 3 and 6 exist, and bundling five integrations into a first slice is how a first slice stops working.

- [x] Workspace repaired: the second lockfile inside `apps/web` removed (it made the app its own pnpm root), `turbo.json` outputs pointed at `.output` instead of `.next`, real `typecheck` / `lint` / `format:check` scripts wired at the root, unused Next-flavoured `packages/*` deleted. **This line also claimed the nested `apps/web/pnpm-workspace.yaml` was removed; it was not — see feature 3, which actually removed it.**
- [x] `infrastructure/env.ts`: zod-validated, memoised, fails fast listing every missing variable by name at once.
- [x] `infrastructure/openrouter.ts`: lazy memoised client, so `pnpm build` never demands a real key.
- [x] `features/chat/model-response-metrics.ts`: pure, no side effects, the shape feature 3's columns mirror.
- [x] `features/chat/chat-stream-protocol.ts`: zod request schema plus the ndjson event contract, encode and decode in one file so the two halves cannot drift.
- [x] `features/chat/stream-model-response.ts`: the effectful edge, one model per call.
- [x] `features/chat/read-model-stream.ts`: the browser side, with a transport failure reported in the same shape the server uses so callers have one failure path, not two.
- [x] `routes/api.chat.ts`: `POST` returning that stream.
- [ ] ~~`routes/dev-stream.tsx`: a temporary harness, explicitly not a designed screen.~~ **This line was false.** `git log --all` has no record of that file and it is not in the working tree, so the harness was never committed — the slice was verified with `curl` against `/api/chat` instead. Feature 6 used to carry an instruction to delete it; there was nothing to delete.
- [x] Typecheck, lint, format and a real production build all pass from the root.

**The transport is newline-delimited JSON rather than the AI SDK's own stream format**, precisely because the metrics have to ride alongside the text: the number rendered on the card and the number stored must be one measured value, not two estimates.

**Tokens per second is measured across the whole call, not from the first visible token.** This is a correction, caught by looking at a real number rather than by re-reading the code. The first implementation divided completion tokens by the span between first and last token, on the reasonable theory that queue time is not generation time. Against `nvidia/nemotron-3-nano-30b-a3b:free` that reported **2277 tokens/second**, which is impossible. The cause: a reasoning model spends seconds emitting reasoning tokens before any visible text, then flushes the text at once; those reasoning tokens are still counted in `completionTokens`, so they were being divided by a 36 ms visible window. Any provider that buffers would score the same way, and this number is a leaderboard comparison key, so a 100x inflation is not cosmetic. Measuring across the full call gives 30 to 54 tok/s for the same model, which is believable. It slightly understates a model stuck behind a queue, but that queue is a real cost of using that model, and `ttftMs` is reported separately so the wait stays visible instead of hidden inside the speed figure.

**A provider error is read off `fullStream`, not `textStream`.** Also a correction found by running it. `textStream` swallows the underlying cause and rethrows a generic `AI_NoOutputGeneratedError` at flush, which made an upstream 429 and a nonexistent model id produce byte-identical server logs. Since "a model failing should be logged properly on the server" is a requirement of feature 6, that was a real defect, not a style preference. Iterating `fullStream` and rethrowing the `error` part now logs `AI_APICallError: <model> is not a valid model ID`, while the browser still receives only the plain sentence.

**Verified against live models, not just typechecked:**

- A real streaming answer with honest numbers: `ttftMs` 1914, `durationMs` 2013, 22 prompt and 62 completion tokens, 30.8 tok/s, `costUsd` 0.
- Three concurrent requests where one names a bogus model: the bad one failed alone and a good one completed normally, which is the independent-failure premise holding under the exact condition it exists for.
- A malformed request body returns a plain 400 sentence, not a stack trace.
- The built client bundle contains no trace of `OPENROUTER_API_KEY`, its value, or the OpenRouter SDK; all of it sits in `.output/server`.
- `google/gemma-4-31b-it:free` returned a genuine upstream 429 during that concurrent test. Recorded as a real operating condition of the free tier rather than a bug: free models rate-limit, so feature 6's per-model retry is load-bearing, not a nicety.

**`.env` now lives at `apps/web/.env`**, copied from the deleted `apps/api/.env`, all thirteen values already present.

**A `tsconfig.json` detail worth writing down, because it looks like nothing and is not.** The `server` key on `createFileRoute` is a declaration merge shipped inside `@tanstack/start-client-core`. With `"types": ["vite/client"]` pinned, that augmentation never loads: `server: { handlers: { POST } }` fails to typecheck and `request` silently degrades to `any`. The fix is adding `@tanstack/react-start` to `types`. The wrong fix, tried first and reverted, was importing `createMiddleware` purely to drag the types in, which leaves a no-op middleware in the code as a disguised workaround.

**Streaming to the browser: one HTTP request per model, never one shared connection.** Three independent `POST /api/chat` calls, each naming a single model, each returning its own stream. This is the decision the feature description flagged as worth real thought, and it resolves clearly:

- Independent failure is the entire premise of the product. A multiplexed stream means one dropped connection kills all three answers together, and one server handler that must never throw for any model.
- Independent retry falls out for free. A failed model retries on its own while the other two keep streaming, untouched.
- Per-model time-to-first-token and tokens per second get measured on that model's own request, honestly, instead of being inferred from interleaved frames inside a shared envelope.
- Three concurrent requests sits well under the browser's per-origin connection cap, so the simplicity argument for multiplexing buys nothing real.

Timing and token counts travel in the stream itself, so the number on the response card and the number written to the database are the same measured value, not two independent estimates that can drift.

**Nothing is open inside this feature any more:** ~~Prisma and the Neon connection~~ (done, feature 3), ~~Better Auth~~ (done, feature 6 stage 1), ~~Arcjet~~ (done, feature 6 stage 4), ~~PostHog~~ (done, feature 6 stage 5) — **all of which moved into feature 6**, because that is the feature whose work actually needs them: persistence and voting need a signed-in user, `/api/chat` is what Arcjet has to sit in front of, and there is no funnel to measure until there is a prompt-to-answer-to-vote flow to measure. Arcjet was the one to do before any public deploy, since `/api/chat` spent our OpenRouter key with no rate limit in front of it; every path that can spend that key now has one.

### 2. Coding standards & tooling

Write down the real conventions for this project once it actually exists, then install linting, formatting, and a pre-commit hook that actually enforces them.

**The conventions live in `docs/coding-standards.md`, split into what a machine enforces and what a person enforces.** That split is the whole point. Every rule listed as enforced has a config line behind it and was probed to confirm it actually fires; every rule that cannot be honestly linted is written down as a review rule instead of being approximated by a rule that would produce false confidence. "If the same Tailwind classes appear in three places that's a component" and "never show a raw provider error" are both real rules with no honest lint rule behind them, so neither got a fake one.

**Prettier owns formatting, ESLint owns correctness, and they never overlap.** No `eslint-plugin-prettier`, so lint output stays entirely about things that are actually wrong rather than about spacing. `printWidth: 90` was chosen to match the code feature 1 already wrote, so adopting Prettier was a near-no-op diff instead of a repo-wide rewrap. `prettier-plugin-tailwindcss` sorts class lists into one canonical order, which stops class churn from showing up in diffs.

**The pre-commit hook is fast on purpose: `husky` runs `lint-staged` over staged files only.** `eslint --fix --max-warnings=0`, then Prettier. Typecheck and build are deliberately _not_ in the hook. A full `tsc` on every commit grows with the codebase and becomes the thing people skip with `--no-verify`, and a bypassed hook enforces nothing. `CLAUDE.md` already requires typecheck, lint and a real build after every change, which is the right place for them: once, when the change is finished.

**One correction to this feature, found while wiring it.** `.husky` was listed in `.gitignore`, which means the hook was never shared with anybody who cloned the repository, so the enforcement described above did not actually exist for a second machine. It is now tracked. Husky installs via a root `prepare` script and points `core.hooksPath` at `.husky/_`.

**A second correction: the type-import rule stated here was the opposite of what the linter enforces.** This feature originally wrote down "type imports are inline" (`import { type Foo, bar }`), while `@tanstack/eslint-config` ships `import/consistent-type-specifier-style` demanding a separate top-level `import type` line, and it failed on the starter's own `src/lib/utils.ts` from the very first run. The config won, because it is mechanically enforced and pairs with `verbatimModuleSyntax`, and `docs/coding-standards.md` was corrected to match. A written rule that contradicts the linter is worse than no rule at all.

**A third correction, and a trap worth knowing about.** A probe commit was used to confirm the hook actually rejects bad code (it does: staging a file containing `any` fails on `@typescript-eslint/no-explicit-any`). Cleaning that probe up with `git reset` plus `git stash drop` silently reverted **every tracked file** to its committed state, which at that moment meant losing the restored `turbo.json`, both `package.json` files, `tsconfig.json`, `pnpm-workspace.yaml` and the whole ESLint config, while untracked source files survived untouched. Worse, it was nearly invisible: `pnpm typecheck` reported success because the _script no longer existed_, not because the code was sound. The lesson is that a missing script and a passing gate look identical from the outside, so after any `git reset` or `stash` the gates have to be re-confirmed by checking the scripts are still present, not just that the command exited zero. Everything was restored and re-verified.

**`.output` must be ignored by ESLint in its own top-level object.** An `ignores` key sitting in the same config object as `rules` is scoped to that block only, so build output still reached the parser and produced `"parserOptions.project" ... file was not found` errors from minified bundles. Global ignores need a config object containing nothing but `ignores`.

**One lockfile, at the root.** `apps/web` shipped its own `pnpm-lock.yaml` and `pnpm-workspace.yaml`, which made it a second, independent pnpm root; installs there would resolve separately from the monorepo. Both are deleted, and the lockfile is gitignored because pnpm regenerates it if a command is ever run with `apps/web` as the working directory.

**Lint warnings fail.** `pnpm lint` runs with `--max-warnings=0` and so does the hook. A warning nobody has to fix is a rule that does not exist.

**The rules that mechanise this project's actual law**, beyond the defaults:

- `no-explicit-any` raised from warning to error.
- `prefer-const`, `no-var`, `no-param-reassign` with props, for the immutable-data rule.
- **`process.env` banned everywhere except `infrastructure/env.ts` and `infrastructure/public-env.ts`**, via `no-restricted-properties`. `NODE_ENV` is exempt because it describes the runtime rather than configures the app. (`NEXT_RUNTIME` was in the original list and is gone with Next.) This is the rule that earns its keep: a stray Prisma client that bypasses fail-fast validation with `process.env.DATABASE_URL!` becomes a lint error rather than something caught by luck. Config files that run outside the app are exempt, since they are evaluated by the bundler before any of this exists.
- The layering rules, scoped correctly. **`src/features/**`may not import another feature or reach up into`src/routes/`; `src/infrastructure/**` may import neither.** Routes are deliberately _not_ restricted, because a route composing features is the entire point of a route. The first draft of this config banned it everywhere and immediately failed on `routes/api.chat.ts` importing `features/chat`, which was the config being wrong rather than the code.
- The `jsx-a11y` rules worth having as errors, as a floor under the accessibility baseline. These arrive with `@tanstack/eslint-config` rather than being configured by hand.
- `no-console` allowing `error` and `warn`, because that is exactly how a real provider error survives server-side while the user sees a plain sentence.

### 3. Data model

> **Built.** `apps/web/prisma/schema.prisma` exists, validates, and generates a typed client; the automated gate (typecheck, lint, real build, format, `check:auth-schema`) is green. **No migration has been applied yet** — that needs the real Neon `DATABASE_URL` and is the one manual step. An earlier version of this file claimed this was "verified against the real database"; it was not, and it still is not until that migration runs.

The core things every feature depends on: users tied to Auth, threads, each model's own messages inside a thread, and votes. A vote should only ever be possible on a turn where two or more models actually answered.

**The unit is a _turn_, not a flat list of messages.** `User → Thread → Turn → ModelResponse`, with `Vote` hanging off the turn. One turn holds the user's prompt once and fans out to one `ModelResponse` per model. This is what makes "a vote only exists once two or more models answered" expressible at all: a vote attaches to the thing being compared, which is a turn, not to any individual message. A follow-up is simply the next turn, and one model's own separate conversation, which feature 6 requires, is the thread's turns with that model's response taken from each. The alternative, a flat message table with a role column, would store the same prompt three times and give a vote nothing coherent to point at.

**A failed model call is a real row, not an absent one.** `ModelResponse.status` is `STREAMING`, `COMPLETE` or `FAILED`. Dropping failures would quietly let a model that dies often outrank one that answers slowly but always finishes, which is the opposite of the honest leaderboard this product exists to produce.

**`ModelResponse.failure` carries a short internal code, never a provider message.** Added while building, because a `FAILED` row with nothing on it gives the UI no way to choose between "this model is rate-limited" and "the stream dropped". It is a code the app owns so the screen can pick a plain human sentence from it, which is what the never-show-a-raw-provider-error rule actually requires. `NULL` on every other status.

**`Thread.title` was added, and it is written once.** Not in the plan, but the sidebar thread list needs a label and deriving one from the first turn on every read is a join for a value that never changes. It is a trimmed snapshot of the first prompt, written in the same call that creates the thread and its first turn, so it is never empty.

**The metric columns mirror `ModelResponseMetrics` field for field, but every one of them is nullable.** Same names, so the number rendered on a response card and the number stored are the same measured value rather than two estimates that drift. The nullability deliberately does _not_ match: `ModelResponseMetrics` describes a **finished** call, while the row exists from the moment the call starts, so even `durationMs` — non-null in the TypeScript type — is `Int?` in the table. `NULL` means "not measured yet" and never zero; writing a placeholder `0` for a call still in flight would be exactly the kind of invented number this product exists not to show. `costUsd` is the one exception, non-null with `@default(0)`, because `$0.0000` is the true measured value for a free-tier model rather than a stand-in. It is `Decimal(10,6)` and `tokensPerSecond` is `Decimal(10,2)`, not floats, because one is money and the other is a comparison key on the leaderboard.

**No `Model` table.** `modelId` is a string column and the leaderboard groups by it. The catalog is OpenRouter's live free-tier list, which feature 5 reads directly; mirroring 14 rows into Postgres buys a sync problem and nothing else. A `modelName` snapshot rides on each response so an old thread still renders after a model leaves the catalog.

**One vote per turn, owner only, enforced by a plain unique on `turnId`.** Feature 8 says a public viewer sees everything but only the real owner actually uses the thread, so there is no per-user vote on someone else's turn to leave room for.

**The "two or more answers" rule is enforced in application code, inside a transaction, not by the database.** This was the one genuine fork and it was asked rather than assumed. A database-level guarantee would need a denormalized `answeredCount` on the turn, maintained on every response finish, plus hand-written SQL in the migration that the schema file cannot see. That trades a counter which can drift for a guarantee that a single write path already gives. So `features/voting/cast-vote.ts` is that write path and nothing else may insert into `votes`, which is now also written down in `docs/coding-standards.md` as a review rule. The count and the insert share one transaction so two simultaneous clicks cannot both read "two answers", and the unique index on `turnId` is the backstop underneath that.

**Ordering is by `createdAt`, with no position column.** Turns are appended one at a time by a single owner. There is no reordering and no concurrent insert for a position column to protect against.

**No `visibility` column yet.** ~~Public sharing is feature 8's decision; adding a column now would bake in a rule nobody has made.~~ Feature 8 has now made it, and the answer is not a `visibility` enum: it is a nullable `Thread.shareSlug @unique`, because the product need was a link that can be taken back rather than a state a thread sits in. ~~The column lands with feature 8's own migration.~~ It landed in `20260912084446_thread_share_slug`.

**No `@@unique([turnId, modelId])` on `ModelResponse`, for the same reason.** It reads as an obvious constraint, but it silently decides that a retry overwrites the failed attempt rather than sitting beside it, and nobody has made that call. Feature 6 owns retry behaviour; the constraint is one line of migration away once it does.

#### Who owns the identity table

**Better Auth owns it, and it was set up now rather than deferred to feature 7.** This was the genuine fork: `Thread.userId` and `Vote.userId` need a real `User` row to point at, so either Better Auth's four tables land now, or a placeholder `User` lands now and gets migrated away later. A placeholder would mean writing a migration whose only job is to undo an earlier migration. So `infrastructure/auth.ts` exists as **configuration only** — no routes, no client, no UI, no session helpers. ~~Those are still feature 7's.~~ **They are feature 6's**, decided when feature 6 was planned: threads and votes need a real signed-in user, so the sign-in path lands with the flow that first needs it. It is here because the shape of the tables is a function of the options set there, and the two have to agree from the first migration.

**The four auth tables are hand-written, and a script re-asserts they are right.** `@better-auth/cli` is the official generator and it was deliberately not installed: it is pinned at `1.4.21` while this project runs `better-auth@1.6.26`, and it hard-depends on its own bundled `better-auth@1.4.21` plus `@prisma/client@^5`. Running it would emit a schema for a version we do not use and drag two duplicate major versions into the tree. So the tables were written from `getAuthTables()` in the **installed** `@better-auth/core@1.6.26`, read from its source rather than from memory.

That is correct today and silently wrong the day someone bumps `better-auth`, which is what `apps/web/scripts/check-auth-schema.mjs` exists to notice. Like `check-contrast.mjs`, it carries no copy of the truth: it asks the installed package for its tables and parses `schema.prisma` for what was actually declared, then compares types, nullability, uniqueness, cascade behaviour, indexes, and undeclared extra columns. **It was negative-tested rather than trusted** — making `image` required, dropping `@unique` from `Session.token`, and removing `@@index([identifier])` produced exactly three correct errors, after which the schema was restored and the check went green again (4 tables, 30 fields). Run it with `pnpm check:auth-schema`.

Two details worth writing down. `account.password` is a column nothing will ever write, because Nexora is OAuth-only — it exists because Better Auth's core schema says it does, and removing it would make the parity check fail for the right reason. And the Prisma adapter's `transaction` option **defaults to `false`**, which would let a multi-step auth write half-succeed on a database that has transactions; it is set to `true` explicitly.

#### What Prisma 7 forced that the plan did not anticipate

Prisma 7.9 is a real break from 6.x and two of its changes rewrote parts of this feature:

- **`datasource { url = env(...) }` is rejected outright** (`P1012`). The migration URL moves to a new `apps/web/prisma.config.ts`. Prisma 7 also stopped loading `.env` on its own — confirmed in `@prisma/config`'s own source, which sets `dotenv: false` next to the comment `// do not load .env files` — so that config loads it with Node's built-in `process.loadEnvFile()` rather than adding a `dotenv` dependency, which also sidesteps the `process.env` ban.
- **There is no Rust query engine**, so `PrismaClient` takes a **driver adapter** instead of a `url`. `@prisma/adapter-pg` (node-postgres over TCP) was chosen over `@prisma/adapter-neon` because this runs as a long-lived Nitro server process where a TCP pool is reused across requests. `infrastructure/database.ts` is the one file that would change if Nexora ever moved to a per-request runtime.

`prisma.config.ts` reads `DATABASE_URL` **without failing fast**, which is the single deliberate exception to this project's fail-fast rule and is commented as such in the file. `prisma generate` runs during `postinstall` and inside `pnpm build`, and generating a typed client does not touch a database — so a build must not demand a real secret. The commands that genuinely need a connection are `migrate` and `studio`, and Prisma reports the missing URL itself when they run. Verified by moving `.env` aside: `prisma generate` succeeded with no environment at all, and `prisma migrate status` failed with Prisma's own clear message.

The generator is `prisma-client`, not the legacy `prisma-client-js`, so the client is plain TypeScript emitted to `src/generated/prisma` — no binaries. It is gitignored and rebuilt by `postinstall`, `pnpm build`, and `pnpm db:generate`, and `src/generated/**` is in eslint's global ignores.

#### Two things that were broken and are now fixed

**`apps/web/pnpm-workspace.yaml` was still there.** Feature 1's checklist above claims the nested workspace file was removed; `git log` shows it never was, only the second lockfile was (via `.gitignore`). Running `pnpm --dir apps/web add` then rewrote it with literal placeholder strings — `'@prisma/engines': set this to true or false` — because with `--dir` pnpm treats `apps/web` as its own root, which is precisely the hazard. It is deleted now. Build approvals live in the **root** `pnpm-workspace.yaml`'s `onlyBuiltDependencies`, checked in and reproducible, rather than in an interactive `pnpm approve-builds` run.

**`BETTER_AUTH_URL` pointed at `http://localhost:4000`**, the deleted Express app's port. On a single-origin app that is a login-breaking bug, not cosmetic. `.env` and `.env.example` were both corrected to `:3000`, and `API_PORT` / `WEB_ORIGIN` — residue of the deleted backend, declared nowhere in `env.ts` — were dropped from both. No new environment variables were needed: `env.ts` already declared everything this feature reads.

**Also fixed, found by the gate:** the untargeted `rules` block in `apps/web/eslint.config.js` enabled `@typescript-eslint/no-explicit-any` for _every_ file, which is a hard ESLint config error the moment a non-TS file enters the lint surface — and `scripts/check-auth-schema.mjs` was the first one. The type-aware rules are now scoped to `**/*.{ts,tsx}`, and a `scripts/**/*.mjs` block turns off `no-console` there because a CLI reporter's stdout is its product. Both were re-verified by probe: the `.mjs` lints clean, and a throwaway `.ts` file with an `any` and a `console.log` still trips both rules.

#### Checklist

- [x] `prisma/schema.prisma`: four Better Auth tables plus `Thread`, `Turn`, `ModelResponse`, `Vote`, `ResponseStatus`. Snake_case `@@map` on every model, `prisma validate` clean, formatted by `prisma format` (Prettier does not handle `.prisma`).
- [x] `prisma.config.ts`: migration URL, `.env` loading, optional-read so a build never demands a secret.
- [x] `infrastructure/database.ts`: lazy memoised `PrismaClient` on the `pg` driver adapter, same shape as `openrouter.ts`.
- [x] `infrastructure/auth.ts`: Better Auth config only, Google and GitHub, `emailAndPassword` off, `transaction: true`. Memoised via a separate `createAuth()` builder because `betterAuth` is generic over its options object and `ReturnType<typeof betterAuth>` is the default instantiation, which the real instance is not assignable to.
- [x] `scripts/check-auth-schema.mjs` plus `pnpm check:auth-schema`, negative-tested.
- [x] Scripts wired at both levels: `db:generate`, `db:migrate`, `db:deploy`, `db:studio`, `postinstall`, and `build` now running `prisma generate && vite build`.
- [x] Typecheck, lint, real production build, `format:check`, `check:contrast` and `check:auth-schema` all green from the root.
- [x] **`pnpm db:migrate` against the real Neon database.** Run with the live `DATABASE_URL`, and the resulting tables inspected in the database by hand. This feature is now verified against a real database, not just against `prisma validate`.

`features/voting/cast-vote.ts`, the single write path into `votes`, lands with feature 6. Until then nothing can insert a vote, which is the correct state — the table exists, the unique index on `turnId` is the backstop, and the "two or more answered" check has no half-built version sitting around.

### 4. Design & look

> **Built and verified.** The direction is chosen, the token set is solved and passes its
> own gate in both modes, and the app shell plus the Arena / Leaderboard / Models screens are
> built and running. The automated gate is green (typecheck, lint, production build,
> `check:contrast`, `detect.mjs` → `[]`, and a `curl` SSR smoke test of all three routes); the
> one remaining item is a manual browser pass in both themes, keyboard-only, handed to a person.
> Two governing documents sit alongside this file: `docs/PRODUCT.md` (durable product truth)
> and `docs/DESIGN.md` (the built visual system, written from the build rather than ahead of it).

ShadCN theme already defined in `apps/web/src/styles.css`. One accent color, rust, used only
for things you interact with, buttons, links, focus states, the win-rate bar, never as
decoration. Because the background and the accent are both warm tones from the same family,
the accent has to stay clearly brighter and more saturated than the background, enough that
a button never blends into the page behind it, that's a real risk with two warm colors this
close and worth checking by eye, not just by the numbers. Blue, indigo, and purple are never
the accent, under any circumstance. Green is reserved only for marking a winner, red only
for errors, never reused for anything else. Contrast should genuinely hold up in both light
and dark mode, not just look fine at a glance.

**The accessibility floor, which is a gate and not an aspiration:** body text at 4.5:1;
borders that identify a component, and large text, at 3:1, in both modes; a 2px rust focus
ring with a 2px offset visible on every interactive element in both modes, and `outline:
none` never appears without a replacement ring in the same rule; full keyboard operation of
the toggle, the picker, and the vote buttons; color never the sole carrier of meaning, per
the rust-versus-red hazard above.

#### Four corrections to what this feature previously claimed

**1. The starter palette is not "a teal palette instead of rust". It is both, unconnected.**
This feature said the inherited palette "is _not_ the rust accent this feature specifies."
Measured rather than eyeballed: `--primary: oklch(0.555 0.163 48.998)` renders **`#bb4d00`**
at hue 49, which is already rust. The shadcn half of the file was always rust. What is teal
is the separate bespoke layer (`--sea-ink`, `--lagoon`, `--lagoon-deep`, `--palm`, `--sand`,
`--foam`, `--bg-base`) that the starter template shipped alongside it. So the file holds two
complete, unrelated design systems, and the contradiction is between the two halves, not
between the file and this feature.

**2. `body` is styled twice, contradictorily, and the shadcn half loses.** There is an
unlayered `body` rule setting `--sea-ink` and a teal gradient, and a `@layer base` rule doing
`@apply bg-background text-foreground`. The obvious reading is that the unlayered rule wins
on cascade-layer precedence. That reading is wrong, and it was checked rather than asserted:
parsing the built CSS in `.output/public/assets/` shows Tailwind v4 **flattens** `@layer`, so
all three `body` rules emit unlayered and plain document order decides. The `@apply` rule
emits first and the teal rule second, so teal wins and `--background` / `--foreground` are
dead on `body`. The lesson is specific and worth keeping: in Tailwind v4, reasoning about
`@layer` precedence in the source file predicts the wrong outcome.

**3. "Borders at 3:1" has to become two tokens, and this amends the floor above.** Holding
_every_ border to a literal 3:1 turns the interface into a wireframe: a divider between two
already-distinguishable surfaces rendered at 3:1 reads as a drawn line, not a seam. WCAG
1.4.11 only requires 3:1 for a boundary that _identifies a component_, and explicitly
exempts purely decorative dividers. So the floor splits:

- `--border` — decorative seams between surfaces that are already distinct. No ratio
  requirement. Solved for a visible-but-quiet seam.
- `--input` — functional edges: text inputs, button outlines, the response-column separator,
  the win-rate bar's track. **3:1 against every surface it can sit on**, non-negotiable.

Those are shadcn's own two token names used with shadcn's own semantics, which is a happy
accident worth noting: `--input` already means "an input's edge" there, and an input's edge
is exactly the functional case.

**4. Dark mode is currently unreachable, so the toggle is in scope here.** The `.dark {}`
block is dead code: nothing in the application ever sets that class. `__root.tsx` is still
the unmodified starter, there is no `color-scheme`, and there is no no-flash script. Auditing
dark tokens was therefore auditing something no user could see. The sketches show a theme
toggle in the sidebar, so the toggle is real UI and it lands in this feature.

#### The direction: the category standard, played straight

Anthropic's `frontend-design` and `impeccable` were both invoked, as `CLAUDE.md` requires.
`impeccable`'s direction roll dealt four worlds against the plain app-shell convention: a
swim-meet heat sheet and lane timing board (the roll's own assignment), a strip-chart
recorder trace (the highest-ranked candidate derived here), a boxed-software acetate tab
manual (a dealt challenger, judged competitive), and the standing exit.

**The standing exit was chosen, deliberately, over all three metaphor-led worlds.** That
makes convention the commitment rather than a fallback, and it is recorded in
`docs/PRODUCT.md` as a standing brand commitment so later surfaces do not reopen it: a left
sidebar, a top bar with breadcrumbs, response cards, familiar affordances exactly where a
category-fluent user reaches for them, and no metaphor smuggled back in as flavour. This is
also the right call for the mode. `impeccable` classes application UI as **Operate**, where
the bar is earned familiarity and the tool should disappear into the task — a user comparing
three model outputs under time pressure is not served by having to learn a metaphor first.

**The craft bar is Linear, the Stripe Dashboard, and LMArena/OpenRouter**, named in that
order of authority and each for a different thing, because "play the convention straight"
without a named bar just means "average":

- **Linear** sets interaction craft: keyboard-first operation, density held without clutter,
  state feedback fast enough to feel instant, and motion that only ever reports a state
  change. No decorative animation anywhere.
- **Stripe Dashboard** sets table and numeric typography, which is the bar feature 9's
  leaderboard has to clear: right-aligned tabular figures, deliberate row rhythm, a win-rate
  bar legible without a legend.
- **LMArena / OpenRouter** set _only_ where affordances sit, so nobody arriving from them is
  surprised. Their finish is visibly below the other two and they were named for layout
  familiarity. They are explicitly **not** the finish bar, and that distinction is written
  down here so it cannot quietly become one.

**Build path is code-led, by contract rather than by drift.** No image generator is available
on this machine, so `impeccable`'s comp round does not apply; the ambition it would have
carried lives in the written direction contract instead, and the finish reviewer audits the
built behaviour against it.

#### The token set, solved against the gate rather than audited after the fact

The existing tokens were audited first, and found **six real failures**, which is why they
are being replaced rather than nudged:

| token pair (mode)                                 | measured   | needed | consequence                                                              |
| ------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------ |
| `--destructive-foreground` / `--destructive` (lt) | **1.00:1** | 4.5    | identical values; invisible text                                         |
| `--destructive-foreground` / `--destructive` (dk) | **1.32:1** | 4.5    | effectively invisible                                                    |
| `--border` / `--background` (lt)                  | **1.25:1** | 3.0    | component edges undetectable                                             |
| `--ring` / `--background` (lt)                    | **2.44:1** | 3.0    | focus ring fails, and it is gray-teal (`#9ca8ab`), not the mandated rust |
| `--primary` as text / `--background` (dk)         | **2.76:1** | 4.5    | accent unusable as a link                                                |
| `--lagoon-deep` link / `--bg-base` (lt)           | **3.34:1** | 4.5    | every link in the bespoke layer                                          |

The replacement was **solved rather than picked-then-checked**, which caught two classes of
error that eyeballing would not have:

- **Out-of-gamut values produce meaningless ratios.** A first candidate palette had light-mode
  rust, green and red sitting outside sRGB, so their contrast ratios were being computed on
  colors the browser would clip to something else entirely. Every value is now clamped by
  binary-searching the largest chroma that still fits sRGB at that lightness and hue.
- **The stricter reference is not always the obvious one.** Functional edges were first solved
  against the card surface alone and came out at 2.83–2.99:1 against a 3:1 requirement,
  because in light mode the _page_ (L 0.976) is darker than the _card_ (L 0.995). Edges are
  now solved against every surface they can sit on simultaneously, and the solver steps until
  the published 3-decimal value verifiably passes rather than trusting the bisection midpoint.

Filled chips take the conventional near-white or near-black label tinted with the fill's own
hue, and that is then _verified_, rather than solving for the minimum passing lightness —
the minimum lands on values like `#342727` on red, which clears 4.51:1 and looks like mud.
The chosen labels clear 5.46:1 to 9.85:1.

**Dark is the default**, which follows from the physical scene rather than from taste: all
three sketches are drawn dark, and the scene is a developer with this open in a tab beside an
editor. Light mode is fully solved, not an afterthought.

Values below are the final set. All 33 pairs pass in each mode, 66 in total, with nothing
clipped. Two rows below were corrected _after_ the gate script was written and run, which is
the whole argument for having written it — see "The contrast gate becomes a real script".

| shadcn token                           | dark                             | light                            |
| -------------------------------------- | -------------------------------- | -------------------------------- |
| `--background`                         | `#130e0b` `oklch(.168 .011 44)`  | `#faf7f1` `oklch(.976 .008 78)`  |
| `--card` / `--popover`                 | `#1f1815` `oklch(.216 .013 44)`  | `#fffdfa` `oklch(.995 .004 78)`  |
| `--muted` / `--secondary` / `--accent` | `#2b221f` `oklch(.262 .014 44)`  | `#f1ece6` `oklch(.945 .010 74)`  |
| `--border` (decorative seam)           | `#332c29` `oklch(.300 .012 44)`  | `#dcd6d1` `oklch(.880 .010 62)`  |
| `--input` (functional edge, ≥3:1)      | `#766b67` `oklch(.537 .015 44)`  | `#908780` `oklch(.628 .015 58)`  |
| `--foreground`                         | `#f4efea` `oklch(.955 .008 72)`  | `#251c18` `oklch(.235 .016 46)`  |
| `--muted-foreground`                   | `#b5aaa3` `oklch(.745 .016 56)`  | `#665952` `oklch(.475 .020 50)`  |
| `--primary` (rust) / `--ring`          | `#e87d40` `oklch(.700 .152 48)`  | `#ae4800` `oklch(.530 .149 46)`  |
| `--primary-foreground`                 | `#190d08` `oklch(.175 .022 46)`  | `#fffbf4` `oklch(.990 .010 84)`  |
| rust hover                             | `#fc995f` `oklch(.775 .140 50)`  | `#8f3701` `oklch(.455 .132 44)`  |
| `--win` (new, winner only)             | `#6cd586` `oklch(.790 .148 150)` | `#00642b` `oklch(.440 .121 150)` |
| `--win-foreground` (new)               | `#101911` `oklch(.200 .020 150)` | `#f6fcf7` `oklch(.985 .008 150)` |
| `--destructive` (errors only)          | `#f95869` `oklch(.680 .196 18)`  | `#b3022d` `oklch(.485 .194 20)`  |
| `--destructive-foreground`             | `#1a0e0e` `oklch(.180 .020 20)`  | `#fff8f8` `oklch(.985 .007 20)`  |

**The audited values map onto shadcn's canonical token names; they do not get a parallel
naming scheme.** This matters more than it looks. Feature 5 pulls in shadcn's popover and
more components follow, and every one of them is generated against `--background`,
`--muted-foreground`, `--input`, `--ring` and the rest. A second, prettier set of names
(`--bg`, `--surface`, `--edge`) would mean either hand-editing every generated component
forever or maintaining two token vocabularies that drift — the exact failure this repository
keeps writing down. Only **two** genuinely new tokens are added, each because shadcn has no
slot for it: `--win` and `--win-foreground` (a winner is not a "success toast" and must not
borrow `--destructive`'s structure). `--primary-hover` is a third addition but not a new
_concept_ — it is the rust hover row of the table above, given a name so the hover value is
declared once rather than re-derived per component. `--chart-1` through `--chart-5` are
**deleted**: nothing uses them, no chart component is planned, and five unused color slots
are five chances to introduce a second hue against the one-accent rule.

**A third text tier was planned as a token and turned out to be unshippable, so there is no
`--foreground-faint`.** The plan added it as "a third text tier the metrics labels need" and
solved it at 3:1, reasoning about it as large text. It is not: the metrics labels are 11px
uppercase, which is small text, and small text carries 4.5:1 with no exemption. Solved
honestly at 4.5:1 it lands so close to `--muted-foreground` that it is a duplicate with a
second name. The same reasoning killed the other planned use, a sub-threshold `::placeholder`:
placeholder text is text. So the token is gone, `::placeholder` and `.label-meta` both point
at `--muted-foreground`, and the third tier comes from **size, case, tracking and weight**
instead of a lighter gray — which is where a legible hierarchy comes from anyway. Two tiers of
color, three tiers of hierarchy.

**The rust-versus-red hazard was measured, and it is worse than "worth checking by eye".**
Rust and error-red sit **26–30° of hue apart**, with only **1.12:1** (dark) and **1.27:1**
(light) of contrast between them. Rust and winner-green sit ~102–104° apart, squarely in
deuteranopia's blind spot. Both confirm the rule this feature already wrote down, so it is
now unconditional: winner, error, and selected states each carry a second, non-color signal —
a word, an icon, or a shape — and never color alone.

#### The contrast gate becomes a real script, not a throwaway

The audit above ran from a scratch file that **hardcoded** the token values. That is a second
source of truth which can silently drift from `styles.css`, which is the precise failure mode
this project keeps naming — and the a11y floor is "a gate and not an aspiration," so the gate
has to be re-runnable by anyone, not a claim made once in a conversation.

So `scripts/check-contrast.mjs` **parses `apps/web/src/styles.css`** and asserts the pairs,
wired to a root `package.json` script. It lives at the repository root rather than inside
`apps/web` for a specific reason: `apps/web/tsconfig.json` has `include: ["**/*.ts"]`, so a
script placed there would be dragged into the app's own typecheck.

**It caught a real shippable bug on its first run, which is the argument for it in one
sentence.** `--input` was solved against `--background` and `--card` and measured **2.66:1**
(dark) / **2.74:1** (light) against `--muted` — under the 3:1 floor it was supposedly designed
to. `--muted` is the binding surface in _both_ modes, because it is the lightest surface in
dark and the darkest in light, and it is exactly where an input sits inside a card. Re-solved
against all three surfaces the values are `oklch(.537 .015 44)` and `oklch(.628 .015 58)`, both
landing at 3.01:1 on muted. This is the same class of error as the Tailwind-v4 layer mistake
above — reasoning about the wrong reference — and it is why the gate is a script and not a
paragraph.

#### Typefaces: Noto Sans and Montserrat, already chosen

**These two faces are a standing user decision, not an open question.** They are already
installed and already imported at the top of `styles.css`, and a proposal to replace them with
Geist Sans plus Geist Mono was raised and **rejected**. Recorded here so no later pass reopens
it: **Noto Sans carries body, UI, labels and data; Montserrat carries headings.**

The proposal's one substantive argument was functional rather than aesthetic, so it had to be
answered rather than dropped: **every streaming counter needs `font-variant-numeric:
tabular-nums`**, or the digits change width as the number climbs and the whole metrics row
jitters on every update. The claim behind reaching for a mono was that a UI sans might not
ship the `tnum` OpenType feature, in which case `tabular-nums` silently does nothing.

**Checked directly against the installed font binaries rather than assumed.** Both woff2 files
were brotli-decompressed and their GSUB feature lists read. Both faces ship **`tnum`**, and
also `pnum`, `zero`, `frac`, `kern` and `liga`:

| face                                      | `tnum` | also available                     |
| ----------------------------------------- | ------ | ---------------------------------- |
| `@fontsource-variable/noto-sans` (latin)  | ✅ yes | `pnum` `zero` `frac` `kern` `liga` |
| `@fontsource-variable/montserrat` (latin) | ✅ yes | `pnum` `zero` `frac` `kern` `liga` |

So `tabular-nums` works on both and **no mono font is needed**. The metrics row, the token
counters and the leaderboard's figures all set `font-variant-numeric: tabular-nums` on Noto
Sans directly. `zero` is available as a slashed zero if a `0` ever reads ambiguously in the
metrics row, which is worth knowing about given `$0.0000` appears on every single response.

**Three defects this section previously recorded do not exist in the file.** They were noted
from an earlier state of `styles.css` and are corrected rather than left to send someone
hunting: there is **no** Google Fonts CDN `@import` (the file's only imports are Tailwind,
the typography plugin, `tw-animate-css`, `shadcn/tailwind.css`, and the two fontsource
families), `tw-animate-css` is imported **once**, not twice, and **Manrope is not present at
all.**

The one real font defect is small: `.display-title` sets `font-family: "Fraunces", Georgia,
serif` and **Fraunces is never loaded**, so that rule has always silently rendered Georgia.
It resolves itself, because `.display-title` is part of the bespoke teal layer being deleted.

A fixed rem type scale at a 1.125–1.2 ratio, not fluid `clamp()`: users view product UI at
consistent DPI, and a heading that shrinks inside a sidebar looks worse, not better.

#### Two smaller things

**The `@/` alias wins and `#/` is deleted.** `apps/web/tsconfig.json` declares both `"#/*"`
and `"@/*"` pointing at the same directory, `apps/web/package.json` declares `"#/*"` again as
a Node subpath import, and `components.json` references `#/` while
`docs/coding-standards.md` prescribes `@/`. Checked before deciding: `#/` is imported **zero**
times and `@/` is used throughout the real code. So `#/*` comes out of both `tsconfig.json`
and `package.json`, `components.json` is corrected to `@/`, and there is no migration to do.

**`@tabler/icons-react` is the icon library, and `lucide-react` is removed.** This is a
standing user decision — tabler was added deliberately, and `lucide-react` arrived with the
TanStack Start starter. A proposal to switch to lucide was raised and **rejected**, and the
reasoning that proposal rested on was simply **wrong**, which is worth recording so it is not
re-derived later: the claim was that shadcn generates components importing from `lucide-react`,
making tabler a permanent hand-editing tax. It does not. shadcn v4 has a first-class icon
library registry, confirmed by reading `node_modules/shadcn/dist/icons/index.d.ts`:

```
readonly tabler: {
    readonly packages: readonly ["@tabler/icons-react"];
    readonly import: "import { ICON } from '@tabler/icons-react'";
}
```

`components.json` already declares `"iconLibrary": "tabler"`, so the CLI rewrites generated
components to import from `@tabler/icons-react` on its own. **The correct action on
`components.json` was therefore no action at all**, and the planned change to `lucide` would
have introduced the very inconsistency it claimed to remove. `lucide-react` is dropped from
`package.json` because nothing imports it and an installed second icon set is how a stray
import gets in later.

**`src/components/` and `src/hooks/` do not exist**, meaning no shadcn component has ever
actually been installed here. `components.json` has been pointing at a directory tree that
was never created.

**`overflow-x: hidden` on `body` comes off.** It does not fix horizontal overflow, it hides
it, which means a layout bug in the response columns would be invisible during development
and then show up as content clipped off-screen.

#### The proof surface: the real app shell, not a token page

This was the one genuine fork here and it was asked rather than assumed. A throwaway
`/dev-tokens` page is the cheap way to prove a palette, but it proves the wrong thing: tokens
only fail in composition, and a swatch grid never puts `--muted-foreground` at 12px next to a
streaming number inside a bordered column. So **feature 4 builds the real app shell** — the
sidebar, top bar, breadcrumb, nav, and theme toggle from the sketches — as its proof surface.

**This moves the shell frame out of feature 7 and into feature 4**, and feature 7's row and
heading are updated to match: it becomes thread history wired to the real database, which was
always the substantive half of it. The frame has to exist before any screen can be designed
inside it, and building it twice would be the waste.

The shell is built with **placeholder thread groups and demonstration standings, labeled as
such**, since `docs/PRODUCT.md` records that no real votes, users or win rates exist yet and
must not be fabricated.

#### Build checklist

- [x] Keep Noto Sans + Montserrat exactly as imported; remove only the unused `lucide-react`. Both faces verified to ship `tnum`, so no mono is added.
- [x] Rewrite `apps/web/src/styles.css`: delete the entire bespoke teal layer and its `body::before` / `body::after` decoration, drop `overflow-x: hidden`, remove the contradictory second `body` rule, apply the token table above, delete `--chart-1..5`, add `--win` / `--win-foreground` / `--primary-hover`. (No `--foreground-faint`, per the correction above.)
- [x] Focus ring as one rule: 2px rust, 2px offset, on every interactive element, both modes.
- [x] `tabular-nums` on every metric, counter, and table figure — as one `.numeric` class, not pasted per file.
- [x] `scripts/check-contrast.mjs` parsing `styles.css`, wired to a root `package.json` script, failing loudly on any regression.
- [x] Theme toggle: `prefers-color-scheme` default, persisted choice, `color-scheme` set, and an inline no-flash script in `__root.tsx` so a dark user never sees a white frame.
- [x] `@/` alias only: drop `#/*` from `tsconfig.json` and `package.json`, correct `components.json` aliases. **Leave `iconLibrary: "tabler"` alone.**
- [x] Build the app shell: sidebar (brand, Arena / Leaderboard / Models, thread list, user, theme toggle), top bar (sidebar toggle, breadcrumb, and a `trailing` chrome slot), collapsing to a drawer on narrow widths. The per-model win-rate pills are a thread-scoped surface, so the top bar exposes the slot but feature 6 fills it — building empty pills now would fabricate a comparison that has not happened.
- [x] Replace `__root.tsx`'s starter title and `index.tsx`'s starter page with the real frame. Also built the two other shell screens the nav points at: `/leaderboard` (Global demo standings table + honest-empty Personal) and `/models` (demo catalog grid), both labeled `<DemoBadge />`.
- [x] Every interactive element gets all seven states. The cva `Button` implements default, hover, focus, active, disabled, and loading; the error state is a signalled variant (`destructive` + the `--destructive` token at 4.5:1), and the live inline-error surface it styles arrives with the streaming failures in feature 6.
- [x] Direction contract anchored as a source-header comment in `__root.tsx` (seed `f4045e4b`) plus `docs/DESIGN.md`. The earlier plan — an HTML comment grep-able in the built output — was wrong and is dropped: a JS/JSX comment never emits to HTML, there is no build-surviving hook for one, and `detect.mjs` does not check for it. The source header is the durable, reviewable record instead.
- [x] Ran `node .claude/skills/impeccable/scripts/detect.mjs --json` over the changed files once the UI was finished — returned `[]`, zero findings.
- [x] Automated gate green: typecheck (0), lint (0), real production build (+ nitro), `check:contrast` (66 pairs pass both themes; only the intentional rust-vs-green / rust-vs-red notes), and a `curl` SSR smoke test of all three routes (200 + correct content, Tabler-only icons, correct titles).
- [x] Manual pass done by a person: a real browser in **both** themes, keyboard-only. No automation framework was added for this, per the rules.
- [x] Write `docs/DESIGN.md` from the built system at finish, not ahead of it.

## Slice 1: Core Nexora loop

### 5. Model picker

An "Add model" popover pulling OpenRouter's live free-tier list, sorted by context window, capped at three models, defaulting to all three selected, with removable chips next to the prompt box. Also render that same catalog as a simple `/models` page, name, context window, and pricing for each one, so anyone can browse the full list without opening the picker.

> **The Next.js note is resolved.** This feature was written against `revalidate`, which does not exist here. The caching mechanism is recorded below as what was actually built.

**The catalog was re-measured immediately before building, and it moved again.** `GET https://openrouter.ai/api/v1/models` now returns **420 models, 21 free**, against 413/16 the reading before and 337/14 the one before that. Every number in this section is a snapshot with a shelf life of weeks, which is the whole reason nothing is pinned in code. Sorted by context window the free tier now tops out at 1,048,576 rather than 1,000,000.

#### The free tier grew three entries that are not models this app can honestly compare

This is the correction that mattered, and it invalidates a decision this feature previously recorded. The old line read **"Nothing is filtered out of the list,"** and its justification was that "every one of them is a real free text-generating model this app can call." That justification is no longer true:

- `google/lyria-3-pro-preview` and `google/lyria-3-clip-preview`, both at 1,048,576 — Lyria is Google's **music** model. `architecture.modality` is `text+image->text+audio`. They do emit text, so no shape check catches them, but a written answer is not what they exist to produce.
- `openrouter/free` — "Free Models Router", `architecture.tokenizer: "Router"`, `top_provider.context_length: null`. Not a model at all. A vote cast on it cannot be attributed to anything, which is precisely what the leaderboard exists to do.

Left unfiltered, the default-trio rule below would have opened a brand-new user's **first ever arena** with Ox Alpha, **Lyria 3 Pro**, and Nemotron 3.5 Lightning — a music model in a text comparison. That is the same failure the provider-distinctness rule was invented to prevent, arriving through a different door.

**So the catalog filters, and it filters in one place.** `infrastructure/model-catalog.ts` returns arena-eligible models only — **18 of the 21** on this reading. The picker and `/models` render the same list, because a second list would mean two definitions of "a model Nexora compares" and one of them would go stale. This was the one genuine fork in the feature and it was asked rather than assumed; the alternative on the table was carrying an `arenaEligible` flag so `/models` could still show all 21 with the ineligible ones labelled. That was rejected for a simpler type and one list everywhere. The accepted cost, stated plainly: the three excluded entries are absent from `/models` with no on-screen explanation. The explanation lives here.

`/models`' existing header copy — "Every model Nexora can put in the arena" — is exactly true under this rule rather than aspirational, which is a small sign the rule fits what was already built.

**Eligibility fails open, deliberately.** A model is excluded only when the response **positively identifies** it as ineligible: `output_modalities` containing something other than `text`, or `tokenizer === "Router"`. A missing, empty, or unrecognised `architecture` block means eligible, not excluded. This direction is chosen because the standing rule is that OpenRouter adding a field or shipping one odd row must never be able to empty the picker — and a strict check that requires `output_modalities === ["text"]` would empty it completely the day that field is renamed. Same reasoning for `context_length`: a null sorts last, it does not drop the row.

**The default trio is unchanged in rule and different in output.** Sort eligible models by context descending, tie-break by id so SSR and the client agree and the trio is deterministic, then walk taking a model only if its provider has not been taken. On this reading that is **Ox Alpha (Stealth, 1M) · Nemotron 3.5 Lightning (NVIDIA, 1M) · Dots3-Note Preview (Dots Studio, 512K)**. The rule still earns its keep: 7 of the 18 eligible models are NVIDIA, so plain top-three-by-context would hand somebody two Nemotrons as their first comparison.

**Provider and display name are parsed from OpenRouter's own `name`, not a hardcoded map.** `"NVIDIA: Nemotron 3.5 Lightning (free)"` yields provider `NVIDIA` and name `Nemotron 3.5 Lightning`; the `(free)` suffix and the `:free` id suffix are cosmetic and stripped. A name with no colon falls back to title-casing the id's provider segment (`stealth/ox-alpha` → `Stealth`). A hardcoded provider table is exactly the kind of thing that goes stale silently as the free tier churns, which this feature has now watched happen twice.

**Context windows floor rather than round.** `1M`, `262K`, decimally — never divide-by-1024, which renders a one-million-token window as "977K". Where rounding is ambiguous it floors: 65,536 reads `65K`, not `66K`. A context window is a capacity, and overstating a capacity is the dishonest direction, so the rounding goes the safe way.

**Caching: a memoised server-side fetch with a one-hour TTL, plus `staleTime` on the routes.** This is the TanStack Start answer to the `revalidate` the old plan named. `freeModelCatalog()` memoises in module scope with a timestamp, lazily, like every other client in `infrastructure/`. On a failed refresh with a warm-but-expired cache it **serves the stale list** rather than failing the page, because a slightly old catalog is worth more than an error screen. Only with nothing at all to serve does it throw, and it throws a plain human sentence — the real provider error goes to `console.error` server-side, never to the user.

**Route data arrives through one `createServerFn`.** Both `/` and `/models` need the catalog, so the fetch must not be duplicated per route, and it must not run in the browser: a loader in TanStack Router runs on the client during client-side navigation, which would put a third-party cross-origin request in a user's browser on every visit and defeat the server-side memo. `getModelCatalog` is a `GET` server fn in `infrastructure/model-catalog.ts`, called from both loaders, with `staleTime` on each route so a client navigation between them does not re-hit the server. `/api/chat` calls `freeModelCatalog()` directly instead — it is already on the server, and going through the server fn would make the process fetch itself.

No `server-only` marker is added, matching `env.ts`, `openrouter.ts` and `database.ts`, none of which carry one. It would be harmless here and buys nothing: this endpoint takes no key, so the worst case of a stray client import is a wasted request rather than a leak.

**`defaultTrio` lives in `features/arena/`, not in `infrastructure/`.** The catalog module's job is "what OpenRouter offers, cleaned and eligible." Which three of them a fresh arena opens with is a product taste call, and this feature's own words are that the default-trio rule is where taste gets applied. Only the arena needs it.

**The picker is a popover in `features/arena/`; `/models` renders the browse grid.** Unchanged, and the honest split: they share data, not markup, and the data is in `infrastructure/`. shadcn's popover was already vendored in feature 4. No `command`/`cmdk` search — eighteen rows is a list you read.

**Selection is client state in the arena, not persisted.** No localStorage, no URL param. Feature 6 stores the models with the thread when a prompt is actually sent, which is the durable record.

**One model minimum, three maximum, and the cap explains itself.** At three the "Add model" trigger is disabled with a plain sentence saying why rather than vanishing, and an already-selected model shows as selected in the popover instead of disappearing from it. The last chip cannot be removed, because a composer with nothing to send to is a dead end, not a state.

**`/api/chat` now rejects a model that is not on the free list.** Previously the route validated shape and length only, which meant a caller could name a paid model and spend real money against our key. It now checks membership against the eligible catalog and returns a plain sentence with a 400. Recorded here rather than in feature 6 because this feature is what made it possible.

**`PromptComposer` stopped knowing about models.** It previously took `onAddModel` and `canAddModel`, which put model logic inside the text-input component. It now takes a single `controls` slot and the arena injects the picker into it. `DESIGN.md` calls the composer "the input proof surface"; keeping it about input is what that means, and it means feature 6 can put a stop button in the same slot without touching the textarea.

#### Three things the plan got wrong, found by building it

**The picker trigger is not disabled at the cap.** The plan said "a real `disabled` at the three-model cap plus a visible plain sentence". Built, that is a worse product: with three models chosen the trigger is the only way into the list, so disabling it locks you out of the list exactly when you want to swap. You would have to remove a chip first, then reopen — two steps for one intent, and the "visible plain sentence" had nowhere to live but a cramped row already holding three chips and a send button. The trigger is now always live, labelled `Models` with a chevron that rotates on open, and the cap is explained in the popover's own description ("Three is the maximum. Remove one to swap."), which is where you actually meet it. Same for the one-model floor: the description says "At least one stays in the thread." rather than leaving a dead `✕` unexplained.

**Capped-out rows carry `aria-disabled`, not `disabled`.** A real `disabled` button is not focusable, which would have punched holes in the roving tabindex — arrow-key navigation would skip rows, and at the cap the fifteen unselected rows would have become unreachable and unannounced. `aria-disabled` keeps every row in the focus order and audible to a screen reader while the click stays a no-op. This is the one place where the ARIA attribute is correct and the DOM attribute is the bug, and it is worth remembering that they are not interchangeable.

**`popover.tsx`'s `data-open:` classes are not broken.** They look like they should be — Radix emits `data-state="open"`, not `data-open` — and they nearly got "fixed". `shadcn/tailwind.css`, which `styles.css` imports, defines `@custom-variant data-open` as `[data-state="open"], [data-open]:not([data-open="false"])`. It works. `app-shell.tsx` writes the long `data-[state=open]:` form, so the two spellings coexist for good reasons; neither is wrong. The one real constraint: the custom variant does not compose with `group-`, so the picker's chevron uses `group-data-[state=open]/trigger:`.

#### Two things added that the plan did not name

**`components/ui/retry-notice.tsx`.** Both new loaders need the same thing, and the rule "never show a raw exception or provider error to the user, a plain sentence and a retry, always" deserves one implementation rather than two copies. `RetryNotice` takes a `message` and an `onRetry` — deliberately not an `Error`, because a component that cannot be handed an exception cannot leak one. `LoaderErrorNotice` wraps it with `router.invalidate()` so retrying is one thing everywhere. Two callers today, the leaderboard in feature 8 is the third; extracting at two was still right, because the alternative was two copies of a rule the project treats as law.

**`CATALOG_STALE_TIME_MS`, five minutes, deliberately shorter than the one-hour server memo.** They answer different questions. The server memo decides how often this app talks to OpenRouter; the route `staleTime` decides how long a browser tab trusts its copy. Matching them at an hour would pin a stale list in a tab left open all day, while a refetch after five minutes is a memo hit that costs nothing.

#### Build checklist

- [x] `infrastructure/model-catalog.ts`: zod-per-row, fail-open eligibility, free check, provider/name parsing, flooring context labels, 1h memo with stale-on-failure, plus the `getModelCatalog` server fn.
- [x] `features/arena/default-trio.ts`: pure, distinct-provider walk, deterministic tie-break.
- [x] `features/arena/model-picker.tsx`: popover + chips, 1 min / 3 max, keyboard-operable, selected state carrying an icon and not colour alone.
- [x] `PromptComposer` reworked to a `controls` slot; `ArenaScreen` owns selection state.
- [x] `/models` on live data; `features/models/demo-catalog.ts` deleted and the page's `<DemoBadge />` removed, since it is no longer demonstration data. `DESIGN.md`'s demo-data list updated to match. (`DemoBadge` itself stays — the leaderboard is still standing on demonstration data until feature 8.)
- [x] Loader + `staleTime` + a plain-sentence error state with a retry on both `/` and `/models`.
- [x] `/api/chat` free-list membership check.
- [x] Gate: typecheck, lint, `format:check`, real build, `check:contrast` (66 pairs, both themes), `check:auth-schema`, `detect.mjs` over the five changed UI files (clean), and a `curl` smoke test.
- [x] Manual pass by a person: both themes, keyboard-only through the picker. The popover list cannot be reached by `curl` — Radix mounts it on open — so this was the only way the eighteen rows, the roving arrow keys, and the focus ring inside a scroll container got checked at all. Confirmed working: the popover opens on the first chosen model, the eighteen rows are one tab stop, the cap and floor states read correctly, and focus stays visible in both themes.

#### What the smoke test actually showed

Worth writing down, because two of these are evidence about the decisions above rather than just a pass.

- **`/models` server-renders eighteen cards** and the header count reads `18 available now` from `models.length`, not from a constant.
- **Every price reads `$0.0000`**, and nothing else. Derived from OpenRouter's reported per-token price, as required.
- **The flooring rule holds on real data**: `65536 → 65K`, `131072 → 131K`, `1048576 → 1M`. Not one label overstates a window.
- **The default trio came back Ox Alpha / Nemotron 3 Ultra / Dots3-Note Preview**, three distinct providers, server-rendered as chips. The middle seat was Nemotron 3.5 Lightning when this feature was planned days ago; it moved because Nemotron 3 Ultra now reports a larger window. The rule is unchanged, the output changed by itself, and that is precisely the argument for never pinning an id.
- **The fail-closed check rejects all three excluded classes.** `openai/gpt-5` (not free) → 400. `openrouter/free` (free but a router) → 400. `google/lyria-3-fast` (free but music) → 400. All with the same plain sentence. The router case is the one that matters most: it is genuinely free, so only the eligibility filter stops it, and this proves the filter reaches the spend path and not just the UI.
- **A model that is on the list streams normally**: `nvidia/nemotron-3-ultra-550b-a55b:free` returned a `delta` and a `done` with `ttftMs: 1938`, `totalTokens: 48`, `costUsd: 0`. The new check gates the endpoint without breaking it.

One thing consciously left out: the picker has no search field. Eighteen rows in a scrolling list are scannable, and a filter input would add a second tab stop and a second focus concern for no gain. If the free tier grows past roughly thirty, that judgement flips.

### 6. Send a prompt, parallel streams, and voting

> **Planned, not yet built.** The decisions below are settled and the build checklist at the
> end is the running record; nothing is checked off until it actually runs. Feature 1's thin
> slice supersedes part of this — one model streaming with honest numbers exists and is
> verified — but the streaming _contract_ changes here, for the reason in "Who measures, who
> writes" below, so the existing half is reshaped rather than merely extended.

The heart of the product. One prompt goes to every selected model at once, each streaming and failing independently, so one being slow or down never blocks the others. Each answer shows its own real time-to-first-token, tokens per second, and total tokens. A vote only exists once two or more models have answered, and picking one writes exactly one vote and marks that answer as the winner, while every answer stays visible the whole time. A follow-up continues each model's own separate conversation.

Arcjet sits in front of this endpoint before any model is ever called: rate limiting, bot protection, and a shield against prompt injection, plus a real limit on how much one person can use across all three models at once, not just a limit on the endpoint overall.

Every prompt sent, every answer finishing, and every vote cast should be tracked as a real PostHog event, so there's an honest funnel from prompt to answer to vote. A model failing should also be logged properly on the server, not just shown to the user and forgotten. Separately from that funnel, every actual model call should also be wrapped so PostHog captures its own real tokens, cost, and latency per call, that's PostHog's own LLM analytics, not the same thing as the funnel events or the numbers already shown on the response card.

#### Three corrections to what this feature previously said

**1. Cost is shown, reading `$0.0000`.** The paragraph above used to end "No cost shown, every
model here is free tier, so it would always read zero," and that contradicted three other
documents at once: `CLAUDE.md`'s rules ("Cost will always read $0.0000 … show it anyway since
it's still a real, honestly measured number"), `docs/PRODUCT.md` ("it is shown, not hidden") and
`docs/DESIGN.md` (same). Two of those are the standing law and one is durable product truth, so
the feature line was the stale one and it is deleted rather than worked around. `costUsd` is
already measured in `computeMetrics` and already non-null in the `model_response` row; hiding it
on the card would have been the only place in the stack that flinched.

**2. `routes/dev-stream.tsx` never existed, so there is nothing to delete.** Feature 1's
checklist claims it was built and this feature's header used to instruct deleting it.
`git log --all -- 'apps/web/src/routes/dev-stream.tsx'` returns nothing and the file is not in
the working tree, so the harness was either never committed or never written. Feature 1's
checklist line is corrected in place; this feature drops the instruction.

**3. Better Auth's routes, client and sign-in UI land here, not in feature 7.** This was the one
genuine fork in the feature and it was asked rather than assumed. `Thread.userId` and
`Vote.userId` both point at a real `User` row, so persistence and voting cannot exist without a
way to sign in — and `infrastructure/auth.ts` is configuration only by feature 3's deliberate
decision. The alternatives were both worse: shipping feature 6 with turns and votes in client
state means building the whole flow twice and contradicts feature 3, which already says
`features/voting/cast-vote.ts` lands with feature 6; and persisting against a placeholder user
means a migration whose only job is undoing itself, against `PRODUCT.md`'s rule that no users
exist and must not be fabricated. All eleven variables in `apps/web/.env` are populated,
including both OAuth pairs, so this is verifiable by hand today rather than a promise. Feature 1's
"still open" list and the note inside `infrastructure/auth.ts` are both corrected to match.

#### Who measures, who writes, and why the request body changes

**`/api/chat`'s contract changes from `{modelId, prompt}` to `{responseId}`.** This is the
structural decision of the feature and everything else follows from it. Feature 1's slice let
the browser name a model and a prompt, which is correct for a harness and wrong the moment the
numbers feed a leaderboard:

- The browser must never be the source of a stored metric. If the client posted its measurements
  back after the stream ended, anyone could `POST` a fabricated 900 tok/s into a public ranking.
  The server already measures every number in `computeMetrics`; it is the only party that should
  write them.
- The prompt and the model id must come from a row the server owns. Otherwise a caller can spend
  our OpenRouter key on arbitrary text, and feature 5's free-list membership check is the only
  thing standing between us and a bill.

So the flow is three steps, and the model call is the third:

1. **`startTurn`** (a `createServerFn`, one transaction) resolves the signed-in user, then
   creates the `Thread` on a first prompt — with its `title` snapshot — or touches `updatedAt` on
   a follow-up, plus the `Turn` and one `ModelResponse` per model at `STREAMING`. Returns the
   thread id, the turn, and the response ids. Nothing has been sent to a provider yet.
2. **The browser fires one `POST /api/chat` per response id**, in parallel. Three independent
   requests, exactly as feature 1 decided, so a dropped connection kills one answer.
3. **`/api/chat` reads the row**, verifies the signed-in user owns its thread and that it is
   still `STREAMING`, re-checks its `modelId` against the eligible catalog, streams the ndjson
   the browser already knows how to read, and — on its own — writes `content`, every metric, and
   `COMPLETE` or `FAILED` to that row.

`Thread.updatedAt` advancing on a follow-up is feature 7's stated requirement, satisfied here
because `startTurn` is the only write path that could satisfy it.

**A follow-up's history is assembled server-side, per model.** For each earlier turn in the
thread: the turn's prompt as a `user` message, then that one model's own `COMPLETE` response as
an `assistant` message. A `FAILED` turn contributes the prompt but no answer, which is the honest
transcript of what that model actually saw. This is exactly the read feature 3's turn model was
shaped for, and it means `streamText` takes `messages` rather than a bare `prompt`.

**The model set locks at turn one.** Feature 7 already records this as feature 6's decision ("a
thread's model set never changes after turn one"), and it has to be true for the per-model
conversation above to mean anything — a model joining at turn four would have no history and
would be compared against two models that do. So a thread screen renders the locked trio as
read-only chips with a plain sentence, and the live picker only exists on the empty arena.

**A cancelled stream is `FAILED` with `failure: "CANCELLED"`, keeping whatever text arrived.**
The composer's `controls` slot exists partly so feature 6 can put a stop button in it, and an
aborted request must not leave a row `STREAMING` forever. But a user changing their mind is not
the model dying, and feature 3's whole argument for storing failures is that a model which dies
often must not outrank one that finishes slowly. Counting a cancel against the model would
poison the number that rule exists to protect. Two ways to say so: a new `CANCELLED` enum value,
which costs a migration, or the `failure` column that exists precisely to tell failure kinds
apart. The column wins — no migration, and it is the use it was designed for. **Feature 9 must
exclude `failure = "CANCELLED"` from reliability stats**, and that is written here because
feature 9 has no code yet to write it in.

**A `STREAMING` row with no live request is treated as interrupted, not as still working.** If
the tab is closed mid-answer the server's stream is cancelled and the row stops being written,
so on load any `STREAMING` row renders the per-column failure surface with a retry rather than a
spinner that will never resolve. No background job, no timestamp heuristic beyond "the page just
loaded and nothing is streaming from here."

#### Voting

**`features/voting/cast-vote.ts` is the single write path, as feature 3 promised.** A server fn
taking `{turnId, winnerResponseId}`. Inside one transaction: load the turn with its responses,
verify the signed-in user owns the thread, count responses at `COMPLETE`, refuse below two,
verify the winner is one of them, then insert. The unique index on `turnId` is the backstop under
a double click, not the rule itself. `docs/coding-standards.md` already carries the review rule
that nothing else inserts into `votes`.

A `FAILED` response is never votable and never counts toward the two. "Two or more models have
answered" means two or more actually finished; a failure is a real row for the leaderboard's
sake, not an answer for the comparison's sake.

**The controls appear only once nothing in the turn is still arriving — asked, not assumed.** The server
rule stays "two or more at `COMPLETE`", because the server cannot know whether a `STREAMING` row is live in
someone's tab or abandoned. The screen is stricter: no vote control on a turn while any of its columns is
still streaming. A vote is permanent and feeds the leaderboard, and the slow model is often the one worth
picking, so offering the choice before the last answer lands would let someone lock a verdict on a
comparison they have not seen. This costs a wait on the slowest model and buys the honesty the leaderboard
is for. It cannot deadlock: `resolve-response.ts` already renders a stored `STREAMING` row with no live
stream as interrupted, so an abandoned answer settles the turn rather than freezing it.

**A vote is final, and any qualifying turn can be voted on.** No un-voting and no changing it after the
numbers settle — the `@unique` on `turnId` already says as much, and a judgement revised once the metrics are
in is not a judgement. Older turns stay votable, because a turn is the unit of comparison and scrolling back
to judge one is legitimate.

**`getThread` grows the turn's vote.** One field on `ThreadTurn`, so a reload does not forget who won and the
win pills come from the thread the screen already loaded rather than a second query. That is a change to
feature 6's read, made here because this is the feature that needs it.

**The winner is marked with green plus a word and an icon, never colour alone** — rust and green
sit ~102° apart, squarely in deuteranopia's blind spot, which feature 4 measured. `--win` and
`--win-foreground` exist for this and have no other use in the app.

**The top bar's win-rate pills are this feature's fill of feature 4's `trailing` slot.** Per
model in the thread: wins over turns that have a vote, as the sketch's `P 0/2 · R 0/2 · V 1/2`.
Computed from the thread the screen already loaded, not a second query.

**`shell-chrome.tsx` grows a `crumbs` slot beside `trailing`.** The breadcrumb reads
`Arena / <thread title>`, and a thread's title is thread-scoped state exactly like the win pills,
so it publishes through the same mechanism rather than teaching `breadcrumbFor` to fetch. The
static path-to-label map stays for the three nav screens.

#### Arcjet, and where the limit actually belongs

> **Partly corrected once built — see stage 4's record below.** The placement of the limit held. The rest
> did not: shield and bot detection went onto all three paths rather than `/api/chat` alone,
> prompt-injection detection moved to `startTurn` because `/api/chat` carries no user text, and the budget
> had to cover `retryResponse` too.

**The per-person limit goes on `startTurn`; shield and bot detection go on `/api/chat`.** This
feature asks for "a real limit on how much one person can use across all three models at once,
not just a limit on the endpoint overall," and a limit counted per request cannot express that:
one prompt is three requests, so a budget of thirty requests is ten prompts with three models
and thirty with one. `startTurn` is called exactly once per prompt and already knows the signed-in
user, so it is the honest place to count prompts, keyed by user id rather than IP. `/api/chat`
still gets shield and bot protection, because it is the endpoint that spends the key.

#### PostHog

Two separate things, and they are not interchangeable — feature 1 already recorded that the
per-call analytics go through `captureAiGeneration` rather than the `withTracing` wrapper,
because the OpenRouter provider exposes the SDK's V4 model interface and the wrapper is typed for
V2/V3, so wrapping it would need an unsafe cast.

- **The funnel**: prompt sent, answer finished, vote cast. Enough to see honestly how many
  prompts become answers and how many answers become votes.
- **LLM analytics**: `captureAiGeneration` per model call, carrying the same measured tokens,
  latency and cost that the card and the row already share.

Plus feature 1's own open item: session replay and heatmaps in the browser, identified to the
signed-in user once Better Auth resolves, so events attach to a real person.

**This is what finally creates `infrastructure/public-env.ts`.** `docs/coding-standards.md` and
`eslint.config.js` have both referenced that module since feature 2 — the `process.env` ban
exempts it by name — and it has never existed, because nothing needed a browser-readable value
before. Session replay does. Vite only exposes `VITE_`-prefixed variables to client code, and it
reads them off `import.meta.env`, not `process.env`, so `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST`
are added to `.env` and `.env.example` alongside the server pair rather than replacing it: the
server SDK and the browser SDK are two clients and only one of them may be public.

#### How an answer renders

> **Reversed after review, before any code was written.** This section first said answers render
> as plain text with markdown deferred "until the streaming loop is proven." That was the wrong
> call, and all three reasons given for it fall over on inspection. The replacement is below; the
> rejected version and why it failed are kept rather than deleted, because a deferral reversed
> within a day is exactly the kind of thing a later reader needs to be able to trace.

**Markdown renders live, as it streams.** Models emit markdown — headings, lists, fenced code,
tables — and every tool a person would put Nexora next to renders it as it arrives. Raw `###`
and `**bold**` on screen is not a plainer version of the product, it is a worse one, and it works
directly against the only thing this app exists to do: three columns of literal asterisks make
judging which answer is actually better harder, not simpler. Full GFM, from the first delta.

**Why the deferral was wrong**, point by point, since each one was stated as a cost:

- _"No markdown parser is in the dependency tree."_ True, and irrelevant. `react-markdown` is
  53 KB unpacked and `remark-gfm` 22 KB — together smaller than a fraction of what is already
  installed — and `@tailwindcss/typography` has been wired in at `styles.css:2` since feature 4.
  The absence of a parser was a fact about the tree, never an argument.
- _"Re-parsing a growing document on every delta is work done hundreds of times per answer."_
  Only if the render is driven by deltas, which is a choice, not a constraint. See the coalescing
  decision below: the parse count becomes a function of wall-clock time, not token count, and
  stops scaling with how fast a model talks.
- _"A renderer is an injection surface that needs sanitising to be safe."_ Not this renderer.
  `react-markdown` builds a React element tree and never routes model output through
  `dangerouslySetInnerHTML`. Raw HTML inside an answer is inert text unless `rehype-raw` is added,
  and it will not be. That is one standing rule, not ongoing sanitising work.

**`react-markdown` + `remark-gfm`, with the component map written here rather than inherited.**
`streamdown` is the obvious alternative — Vercel built it for exactly this, and it handles
unterminated blocks out of the box — and it is rejected on two grounds. It ships its own Tailwind
styling, which would make answer bodies the one surface in the app whose look is decided by a
dependency instead of by feature 4's token set; and it pulls Shiki, KaTeX and Mermaid in
transitively, three renderers to get one. GFM alone covers what a chat answer actually contains.

**Deltas are coalesced on a ~60 ms flush per column, not rendered one at a time.** Each column
buffers arriving text and re-renders on a timer, so the parse-and-reconcile rate is capped at
roughly sixteen per second per column whether the model behind it emits ten tokens a second or
five hundred. Three columns is then about fifty parses a second of a few-KB document, which
`remark` does in well under a millisecond, and the flush is invisible at that rate — it reads as
streaming, because it is. This is the whole answer to the cost objection, and it is worth noting
it makes the fast models cheaper to render rather than more expensive. If measurement later shows
the reconcile is still hot, the next step is block-level memoisation — split at top-level block
boundaries, memoise every block but the last, since only the last one changes — which is additive
and needs none of this undone.

**Half-written inline markers are closed before parsing, fenced code is not.** Mid-stream a model
produces `**bol`, and a naive parse shows literal asterisks that snap to bold one delta later; the
flicker is small individually and constant across a whole answer. So a pure function balances an
odd count of `**`, `*`, `_` and `` ` `` before the text reaches the parser. It has to be
fence-aware to do that: markers _inside_ a fenced code block are literal characters and must be
left alone, so the function tracks fence state and only balances the regions outside. An
unterminated fence itself needs nothing — `remark` already treats it as a code block running to
the end of input, which is the correct rendering of a code block still being written. Incomplete
tables and links settle when their syntax completes, same as every other tool does; guessing at
half-written markup is worse than waiting a delta for it.

**Code blocks get a real surface: language label, copy button, and their own horizontal scroll.**
A long line inside a code block scrolls within the block and never widens the column, which
matters more here than in a single-column chat because a widened column would shift the other two
and break the comparison. **Syntax highlighting is applied once a response reaches `COMPLETE`,
not per delta.** Re-tokenising a growing code block on every flush is the one part of this that
genuinely is expensive, and a stable block highlights once. Shiki fine-grained (`shiki/core`, the
JavaScript regex engine, a curated language list). It is a separate checklist item on purpose: if
it bloats the bundle or fights the token set, it drops to its own follow-on and stage 2 still
ships answers that render properly.

> **Two corrections, made when stage 3 picked this up.** The deferral fired — stage 2 shipped the
> framed, labelled, copyable, scroll-contained block without colour — and it is stage 3's, built
> beside voting, not a floating follow-on. See stage 3's checklist for what that actually means.
>
> **This paragraph used to say dual-theme CSS-variable output is "the one highlighting setup that
> can read from the app's own tokens instead of shipping a competing palette." That is wrong.**
> Dual-theme mode emits _Shiki's_ two palettes as `--shiki-light` / `--shiki-dark`. The colours are
> switchable, but they are still a dependency's palette, which is the exact thing feature 4's token
> set exists to prevent and the exact ground `streamdown` was rejected on eight paragraphs above.
> What actually reads this app's tokens is **one** theme, authored here, whose colour values are
> `var(--code-*)` strings. Shiki writes a colour string straight into the token's `style`, so the
> `.light` class already on the page does the flip with no second theme, no `!important`, and no
> `--shiki-*` layer in between. Every code colour then lives in `styles.css` as oklch, where
> `check:contrast` can gate it like any other pair. It is a claim about Shiki's internals, so it
> gets proven with a real build before anything is built on top of it; if Shiki normalises a
> non-hex colour away, the fallback is two built-in themes and that gets written down here rather
> than swapped in quietly.

**Images in an answer are not loaded; `img` maps to a plain link.** A remote URL in model output
is untrusted — it is an unreviewed outbound request from a signed-in person's browser, and an
arbitrary-sized image would wreck a three-column layout. Links render, and open in a new tab with
`rel="noreferrer"`, for the same reason: the model chose that destination, not us.
`react-markdown`'s default `urlTransform` already drops `javascript:` and bare `data:` hrefs, so
that part is the library's default rather than something to maintain.

**Answer typography is one class, `.md-answer`, defined once in `styles.css`.** It composes
`prose prose-sm max-w-none` and then overrides the typography plugin's own `--tw-prose-*`
variables — body, headings, links, bold, code, `pre` background, quotes, `hr`, table borders — to
the app's tokens. That is what keeps answers inside feature 4's palette in both themes without a
`prose-invert` branch, since the tokens already flip, and it satisfies the standing rule that a
repeated visual pattern is a class or a component and never the same handful of Tailwind classes
copied into three files.

#### One smaller call

**Columns are side by side from `md` and stacked below it.** "The comparison is the product," so
side-by-side is the default wherever there is room; below that width three columns would be
three unreadable ribbons, and a horizontal scroller hides an answer behind a gesture. ~~The metrics
footer is a disclosure per the sketch, open by default, because the numbers are the point and
collapsing is for when someone wants the prose alone.~~ **Reversed in stage 2's second browser
pass.** A disclosure that is open by default is a control whose only reachable state is the one it
already has, and it cost a row of chrome to say so. The numbers are now one always-visible row of
icon-and-value pairs, labelled through `title` and an `sr-only` `<dt>`. Stage 6's manual pass said
to keyboard-test "the metrics disclosure"; that line is corrected there too.

#### One seam this feature deliberately leaves open

The sidebar currently reads "Your threads will appear here once you send a prompt." The moment
feature 6 lands, that sentence is false: threads exist and the sidebar still will not list them.
Wiring it is feature 7 and it is a real query with recency grouping, so it is not being
half-built here — but it means **feature 7 is no longer optional polish, it closes a live dead
end**, since a signed-in user can navigate away from a thread with no way back to it. Written
down so the gap is a known cost rather than a surprise.

#### Build checklist

Six stages, in order. Each one runs before the next starts, and the gate at the end is the whole
gate — nothing is checked off from reading the code.

**Stage 1 — sign-in that actually works** — done, verified against a running dev server.

- [x] `routes/api.auth.$.ts`: Better Auth's catch-all handler, `GET` and `POST`.
- [x] `infrastructure/auth.ts`: add `tanstackStartCookies()` from `better-auth/tanstack-start` as the last plugin — verified present in the installed `better-auth@1.6.26`, and it carries no schema, so `check:auth-schema` stays green.
- [x] `infrastructure/auth-client.ts`: the browser client, Google and GitHub only.
- [x] A session read for the server, and the sign-in surface replacing the sidebar's hardcoded "Guest" — real name, real avatar, sign out. **Not in `features/auth/`**, see below.
- [x] Sending a prompt requires being signed in. One code path, not a persisted one and an anonymous one.

##### Where the session ended up, and why it is not in `features/auth/`

Planned as `features/auth/`, built as `infrastructure/session.ts` + `infrastructure/session.server.ts`. Two
separate forces pushed it there, and both were found by tooling rather than by reading the code, which is
the argument for the gate being non-optional.

The first is the layering rule. Four features need to know who is signed in — the shell's account row, the
arena's send gate, and chat and voting in stages 2 and 3 — and a feature may not import another feature.
`no-restricted-imports` caught it the moment the sidebar reached for the account row. `docs/coding-standards.md`
names the two legal answers; `infrastructure/` is the right one, since `auth.ts` and `auth-client.ts` already
live there. `features/auth/` keeps only what is genuinely its own, the sign-in screen. The **account row moved
to `features/shell/`**: it is a row in the rail, the rail's rows belong to the shell, and what it needs from
auth it takes from `infrastructure/` instead of reaching sideways.

The second is a real bug, and worth writing down because stage 2 walks straight into it. Reading a session
needs `auth()`, which pulls Prisma and then `pg`, which needs `Buffer`. A plain exported function that touches
that chain **cannot** be dropped from the client bundle — the bundler has to assume something imports it — so
a module holding both `readSessionState` and the `useSessionState` hook ships a Postgres driver to the browser.
The symptom was not a warning: `ReferenceError: Buffer is not defined` on every request, which aborted the
client module graph and left SSR emitting the document shell with no app markup at all. Both pages looked
"fine" at 200 and were empty.

So the split is by **where the code runs**, not by which feature owns it:

- `session.ts` — client-safe. `SessionUser`, `SessionState`, `SESSION_UNAVAILABLE`, `useSessionState`, and
  `getSessionState`, whose `createServerFn` handler is the only thing that reaches across.
- `session.server.ts` — `readSessionState`, importing `auth`. Stage 2's `/api/chat` and `startTurn` call this
  one directly, since they already hold a `Request`.

`.server` is not a naming convention here, it is enforced: Start's import-protection plugin treats `.server`
as a hard filename boundary in the client environment, so a component importing it fails the build rather
than shipping a driver. That also means `__root.tsx` cannot import it — the server fn has to live on the
client-safe side and reach in from inside its handler, where the compiler strips it. Confirmed by scanning
the built client bundle: no `pg-types`, no `postgres-bytea`, no `PrismaClient`, no `readSessionState`, and
none of the five real secret values.

##### Two findings deferred out of stage 1

- **`components/ui/popover.tsx` uses `rounded-3xl`.** 24px, against the 12–16px card range `DESIGN.md` states.
  It arrived with the model picker in feature 5 and the account menu now inherits it. Left alone deliberately —
  quietly changing a shared component's radius mid-stage would silently restyle the picker too. It is a
  one-line fix and belongs to whoever next touches the design tokens, not to the auth stage.
- **A composer draft is lost across the OAuth round trip.** Signing in navigates the whole document, so
  anything typed before signing in is gone on return. Not fixed here: the fix belongs to whatever owns the
  draft, which is stage 2's `onSubmit`. Recorded so it is a known cost rather than a surprise.

**Stage 2 — turn persistence and the fan-out arena** — **done and verified in a browser.** Four passes by a
person found fifteen things after the automated gate had gone green on all of them, which is the argument for
the manual pass being part of the stage rather than a formality after it. One item is deliberately deferred:
Shiki highlighting, which the plan already allowed to become its own follow-on. **It is stage 3's**, decided
when stage 3 was planned — a deferred item with no step that owns it is how a deferred item disappears.

- [x] `features/chat/start-turn.ts`: the transactional server fn above, including the `Thread.updatedAt` touch on a follow-up.
- [x] `features/chat/thread-conversation.ts`: per-model message history, pure.
- [x] `chat-stream-protocol.ts`: request schema becomes `{responseId}`; the event contract is unchanged, so `read-model-stream.ts` keeps working.
- [x] `/api/chat` and `stream-model-response.ts`: owner check, status check, catalog re-check, `messages` instead of `prompt`, and the row write on finish — `COMPLETE` with metrics, or `FAILED` with a code.
- [x] `routes/thread.$threadId.tsx` plus a `getThread` server fn; `/` stays the empty arena.
- [x] The arena UI: response column, turn block, the metrics strip, and the hook that fires N streams and holds per-column state — the hook coalescing deltas on a ~60 ms flush rather than re-rendering per delta. Planned as a `<details>` disclosure over the numbers; built that way, then replaced by a single always-visible row in the second browser pass below.
- [x] `react-markdown` + `remark-gfm` installed; `features/chat/answer-markdown.tsx` with the component map — no `rehype-raw`, `img` mapped to a link, links `target="_blank" rel="noreferrer"`.
- [x] `features/chat/close-open-markers.ts`: the fence-aware pure function that balances trailing `**`, `*`, `_`, `` ` `` so mid-stream emphasis doesn't flicker.
- [x] `.md-answer` in `styles.css`: `prose prose-sm max-w-none` plus the `--tw-prose-*` overrides onto the app tokens; **written, not yet eyeballed in both themes** — that is the browser pass below.
- [x] Code-block surface: language label, copy button, horizontal scroll contained inside the block so a long line never widens the column.
- [ ] Syntax highlighting via Shiki fine-grained, applied at `COMPLETE` only. **Deferred, as the plan allowed, and moved to stage 3 rather than left floating.** Nothing in the stage depends on it, the plain code block is already legible and framed, and pulling a highlighter and its grammars in at the tail of a stage this size buys a bundle argument at the worst possible moment.
- [x] Per-column failure surface with per-model retry, and interrupted `STREAMING` rows rendering as interrupted.
- [x] Stop button in the composer's `controls` slot, writing `FAILED` / `CANCELLED` with partial text kept.

##### What stage 2 decided while it was being built

Eleven things the plan did not settle, or settled differently once the code existed.

**A retry writes a new row rather than resetting the failed one.** The failed attempt is real, measured
data — a provider 429 at a known moment with a known TTFT — and overwriting it would quietly launder a
failure into a success. `latestAttempts` picks the newest row per `modelId` for display, so the column
shows the retry while the history keeps both. This is also what settles a stale `STREAMING` row: retry is
the only thing that writes over one, which is why **there is no background sweeper** for rows whose tab
went away. A sweeper would need a heartbeat to tell "still streaming" from "abandoned", and the honest
answer is already available for free — a `STREAMING` row with no live stream in this tab _is_ interrupted,
and `resolve-response.ts` says exactly that.

**Columns are ordered by model name, fixed for the life of the thread.** Whichever model answers first
must not jump to the left, or two turns of the same thread would put the same model in different places
and the side-by-side comparison this screen exists for stops working.

**The layering rule was resolved by making routes the composition seam, not by relaxing it.** Every
streaming piece lives in `features/chat`; `features/arena` keeps the composer, the picker and the empty
screen; and `routes/index.tsx` and `routes/thread.$threadId.tsx` wire them together. `ThreadScreen` takes
the composer as a `composer` slot for precisely this reason — the prompt box belongs to the arena and a
feature may not reach into another feature. That is the same wall stage 1 hit, answered the way
`docs/coding-standards.md` names rather than with an exception.

**`ArenaStreamProvider` is mounted in `__root.tsx`, above `Outlet`.** Sending the first prompt navigates
from `/` to the thread, and three answers already arriving must not be thrown away by that navigation;
above the router is the only place they survive it. `children` is passed straight through, so a 60 ms
flush re-renders the provider and the columns and not the sidebar or top bar.

**`/api/chat` is reached by a dynamic `import()` inside the handler, not a static `.server` import.** Same
enforced boundary stage 1 documented: a client-environment module that statically imports a `.server` file
fails the build. The dynamic import is stripped from the client bundle, which the leak scan of
`.output/public` confirms.

**The composer's draft is mirrored into `sessionStorage`**, under `nexora:draft:<key>`, read in an effect
and never during render so the first paint matches the server's. This closes the finding stage 1 deferred:
an OAuth round trip is a whole document load, so component state alone cannot carry a draft across it.
`onSubmit` now answers whether the prompt was accepted, and the draft is cleared only on a yes — so the
sign-in gate keeps what was typed, which is the entire reason the person is signing in.

**A follow-up is blocked while a turn is streaming.** `busy={sending || streaming}`. A second turn on top
of three live streams would double the in-flight columns for no gain, and the stop button is right there
if the answer is already clearly wrong.

**Each answer scrolls in its own frame, capped at `min(60vh, 34rem)`,** with a follower that sticks to the
bottom only while the reader is already there. Three answers of very different lengths would otherwise
leave two short columns beside one very tall one, and making the comparison at all would need a scroll.
**Reversed by the browser pass below** — it read badly for reasons no amount of looking at the code showed.

**Column count is a `--columns` custom property, not `grid-cols-3`.** A two-model thread gets two real
columns instead of three with a hole in it.

**The stream caret only shows before the first token.** Once text is arriving, the column header's
`Streaming` state is what reports it; a caret after a block element strands itself on its own line.
**Replaced by the browser pass below** with a `Thinking…` row, because a caret was too small to answer the
question it existed to answer.

**Stop settles the columns before it aborts.** The sentence a person reads is then the one their press
caused, rather than whatever a torn-down transport would have reported. The partial text is kept on the
server, because feature 9 must never count a stopped answer against the model.

##### Four things the first browser pass found, and what replaced them

**A follow-up turn showed nothing at all until the last model finished.** The real bug of the four, and
not a styling one. `startTurn` writes the rows and `start()` opens the streams, but a follow-up stays on
the same URL, so nothing re-read the thread — and the columns are keyed by the rows the loader returns.
The deltas arrived for a turn that was not on screen yet, and the whole turn appeared at once when
`runStream`'s last `finally` fired `router.invalidate()`. The first turn of a thread was never affected,
because navigating to it runs the loader anyway, which is exactly why reading the code did not show it.
`useStartTurn` now invalidates as soon as the rows are written, and only for a follow-up.

**The composer floated in the middle of the page instead of docking to the bottom.** `mt-auto` and
`sticky bottom-0` were both already there and both were inert: the transcript column was only as tall as
its content, so there was no slack for `mt-auto` to push into and nothing for `sticky` to stick inside.
`min-h-full` on that column is the whole fix. It is now load-bearing rather than cosmetic and is commented
as such in `thread-screen.tsx`.

**The document scrolled behind the shell.** The shell sized itself to `100dvh` but nothing pinned the
document to the viewport, so something sitting beside `#app` under `body` — dev tooling, a browser
extension — made the page taller than the app. Scrolling it dragged the entire shell upward and left a
few hundred pixels of empty band under the composer, with the sidebar cut off mid-air. `html` is now
`100dvh`, `body` and `#app` are `height: 100%`, and `body` is `overflow: hidden`. A full-height app shell
should never have a second scrollbar, so this is the right shape regardless of what put it there.

**Per-column scroll was removed, reversing the decision above it.** `.answer-body` capped at
`min(60vh, 34rem)` with `overscroll-behavior: contain` looked right and read badly: it trapped the wheel
across two thirds of the screen, and worse, a live answer grew inside a box whose position never moved, so
following the bottom of the page showed no progress at all. The comparison argument for it was real but it
cost more than it bought. The transcript is now the app's single scroll container, it sticks to its own
bottom while a turn streams and lets go the moment the reader scrolls up (`use-stick-to-bottom.ts`, which
finds the scroller by walking up rather than importing a ref from `features/shell`), and a long code line
still scrolls inside its own block.

**And the working state is now visible per column.** A pulsing 8px dot in a header is not an answer to
"is anything happening": before the first token each column shows a `Thinking…` row with three staggered
dots, the composer's send button turns into the stop button while models are answering — one button, two
jobs, rather than two live buttons in one corner — and it reports `N of M answering` beside the locked
model chips. Sending also spins the send button immediately, so the gap while the rows are written is not
silent either.

##### Five more from the second browser pass

**The composer bounced on every delta, and `sticky` was the reason.** As a sticky child of the scrolling
transcript it was pushed down by the grown content for the frame before the scroll caught up — sixteen
times a second, which reads as a vibrating prompt box. The transcript now owns a scroller of its own and
the composer sits **outside** it, so nothing a model sends can move it. `ThreadScreen` is a full-height
column that does not scroll, which also means `main` above it never overflows and there is still exactly
one scrollbar on screen. This supersedes the `min-h-full` fix above; the composer is docked structurally
now rather than by `sticky` plus `mt-auto`.

**The dock's bottom padding is `pb-3`, matching the rail's `py-3`.** The composer's bottom edge and the
account row at the foot of the sidebar now sit on the same line. It was a loose `pb-4` inside a container
that also carried `py-6`, which read as an arbitrary band under the prompt box.

**The metrics disclosure is gone, replaced by one row with an icon per figure.** Six stacked
label-above-value columns spent more height on the words than on the numbers and still wrapped to two rows
in a three-way turn, which is what most turns are — and a `<details>` to collapse that cost another row to
hide one. `IconBolt`/`IconClock`/`IconGauge`/`IconArrowDownRight`/`IconArrowUpRight`/`IconCoin` carry the
labels; each figure still names itself on hover and through an `sr-only` `<dt>`, so nothing is lost to a
screen reader. Roughly half the footprint. The keyboard-operable collapse is the real cost, and it bought
little once the strip was one line tall.

**One word was not enough for the wait.** A fixed `Thinking…` reads as a frozen screen by the third
second, and this app's own TTFT figures show free-tier models taking fifteen. Twelve verbs now rotate
every 2.4 s, seeded from the row id rather than `Math.random()` — three columns say three different
things, the same column always opens the same way, and nothing reshuffles on a re-render or disagrees
between the server and the browser. Reduced motion holds on the first word.

**A prompt can be copied.** Revealed by hovering the prompt rather than parked under it, so a long thread
still reads as a transcript instead of a column of buttons; keyboard-reachable regardless, and always
visible where there is no hover to reveal it with. The copy button itself moved to
`components/ui/copy-button.tsx`, because the code block already had one and two call sites is where the
rule against copy-pasted markup starts applying. **The hover reveal was dropped in the third pass** — it
hid the button from anyone who had not thought to hover, and the ghost variant already goes quiet until you
reach for it, which is the restraint the reveal was after.

##### Four more from the third browser pass

**The thread is clamped to `max-w-6xl`, not the width of the window.** Collapsing the rail used to re-flow
three columns from ~370px to ~460px, so the answers a person was mid-comparison on changed size under
them. 72rem is the widest value a 1440px screen with the rail open already clamps to, which means
collapsing now gives back the rail's width without touching the columns — the behaviour the reference apps
have and the reason they have it.

**A refresh no longer scrolls itself.** The thread is server-rendered at scroll zero, so the first paint was
the top of a possibly very long transcript and every landing was a visible jump a second later.
`use-thread-scroll.ts` now positions in a **layout** effect, which React flushes before the browser paints,
and reports `settled` so `ThreadScroller` can keep the transcript laid out but hidden behind a loader until
then. Laid out because there is otherwise no height to scroll to; hidden because that is the whole point.
The layout effect is chosen per environment rather than per render, since React objects to one being
declared at all during a server render.

**A scroll-to-top button sits where the answers end.** Bottom-right of the scroll region and on the same
right edge as the content, appearing past 600px of scroll. After reading three long answers to the bottom,
that is where the eye already is, and the alternative was a very long drag back.

**The composer went from ~170px to ~85px.** A one-line textarea that grows rather than a 22-unit minimum
height, `py-2.5` instead of `p-3`, and the models compacted into a single control: three overlapped
initials and a count, opening the picker. The removable name capsules were the tallest and widest thing in
the composer — on this catalog they run to "Dots3-Note Preview" — and removing a model from the popover
list is the same gesture as removing it from a capsule, so they were a second way to do one thing paid for
in height. `components/ui/model-chip.tsx` is deleted rather than left unused; the thread page gets the same
control through `features/chat/locked-models.tsx`, read-only, so the composer does not change shape between
a fresh thread and a running one.

##### Two more from the fourth pass, and the shell rule that came out of it

**The blank band under the composer came back, and this time it was measured rather than reasoned about.** A
static harness of the real DOM structure against the real built CSS, driven through headless Chrome,
reproduced the screenshot — and only with a ~445px element sitting **beside** the thread screen inside
`main`. With `main` scrollable and the screen sized by `h-full`, such a sibling adds its height to `main`'s
scroll range and you scroll into a void below the prompt box; the arithmetic matched the screenshot to the
pixel. What that element is has not been identified: dev tooling, a browser extension (this browser
demonstrably injects into `body`), or DOM an orphaned hot reload left behind are all candidates.

The fix deliberately does not depend on knowing. **`main` now clips, and every screen is
`position: absolute; inset: 0` inside it** — `.screen`, plus `.screen-scroll` for the four screens whose
whole page scrolls. A screen fills the shell's content box whatever else lands in there: nothing can lengthen
the page behind it, and nothing can shorten the screen either. The harness confirms it with a 445px sibling
deliberately present — `main` unscrollable, the composer's bottom edge exactly the viewport's, and the
transcript the only scrollable element on the page. This is the second bug of this shape, after the document
scrolling behind the shell, which is why it is now a rule of the shell rather than a fix to one screen.

**The composer's draft caps at 120px, not 240px.** Past about five lines the transcript matters more than
seeing the whole draft at once, and on a thread that height is taken from the answers being compared. The
textarea scrolls from there.

##### How these passes were actually verified

`detect.mjs`, `check:contrast`, typecheck, lint and a real build were green before every one of these
fifteen findings. Layout of this kind is invisible to all of them. What worked was a static HTML harness of
the real DOM linked against the real built CSS and measured in headless Chrome — no test runner, no browser
automation framework, nothing added to the project — and it is what turned the last one from a guess into an
arithmetic match. Worth reaching for early the next time a layout bug does not match what the code says
should happen.

**Stage 3 — voting, and the code highlighting stage 2 deferred**

Two things in one stage because the second one is small and has nowhere better to be. Voting is what
the product is for; highlighting is the last piece of "how an answer renders" and it was left without
an owning step, which is how a deferral turns into a silent drop.

_Voting_

- [x] `features/voting/cast-vote.ts` + `cast-vote.server.ts`: the single transactional write path, owner check and two-or-more-`COMPLETE` check inside it, `@unique` on `turnId` as the double-click backstop reported as "already voted".
- [x] `getThread` returns each turn's vote, so a reload remembers the winner and the pills need no second query.
- [x] Vote control per column, shown only once nothing in that turn is still streaming; winner marked with green plus icon plus word; every answer stays fully visible.
- [x] Win-rate pills through `useTopBarTrailing`, and the new `crumbs` slot carrying `Arena / <title>`.

**How the two features were wired without either importing the other.** `docs/coding-standards.md`
forbids a feature importing a feature, and chat is what decides whether a vote is offered while
voting is what writes it. So the rule went to the bottom layer, the hole to chat, the filler to
voting, and the route joined them:

- `infrastructure/turn-vote.ts` — `MIN_VOTABLE_ANSWERS`, `columnVotes`, `voteFor`. No React, no
  feature types. `cast-vote.server.ts` imports the same constant its guard checks against, so the
  screen can never offer a vote the transaction would refuse.
- `features/chat/vote-slot.tsx` — a context carrying a `ComponentType`, not a render callback. A live
  turn re-renders on every token, and an inline closure in the context value would drag every column
  in the transcript along with it.
- `features/voting/vote-control.tsx` fills it; `routes/thread.$threadId.tsx` passes the module-level
  reference. Same arrangement as `shell-chrome.tsx`'s trailing slot.

**No optimistic winner.** The vote is a row that decides a leaderboard, so the control waits for the
record and re-reads it. A green mark that appears and then retracts is worse than one that appears a
moment later. `already-voted` settles on the same state as `recorded`, so a double click reports the
truth rather than an error.

**Focus moves to the mark that replaces the button.** The pressed button is gone once the vote lands,
and on a long transcript that drops a keyboard user back to the top of the document. The winner mark
takes `tabIndex={-1}` and is focused, which is also how a screen reader hears the vote saved.

**The win-rate denominator is voted turns, not all turns.** Six turns with one vote is a 1-of-1
result; reporting it as 1 of 6 reads as five losses for two models that never lost anything. The
pills hide entirely until something has been voted on, and are `display: none` below 48rem — they
summarise what every card already says, so the small screen loses the convenience and none of the
information.

**`useTopBarTrailing` had an undocumented requirement that only bit once it had a caller: the node
is the effect's dependency, and publishing is a state change in the provider above.** A fresh
element every render is therefore an infinite loop on a screen that renders per token, not a slow
path. Now documented in the hook; the thread's node is `useMemo`'d on `[thread]`. The new
`useTopBarCrumbs` sidesteps it by keying on the joined string and splitting it back apart, so
callers need no memo at all.

**`thread.$threadId.tsx` split into `ThreadRoute` + `LoadedThread`.** The two failure branches return
before a thread exists, and a hook cannot sit behind an early return, so the branch that has the data
got its own component.

**Pre-Shiki client bundle baseline: 725,621 bytes across 14 JS files** in `apps/web/.output/public`.
The highlighting item below was deferred over a bundle argument, so this is the number the after
measurement is compared against.

_Highlighting_

**`shiki@4` fine-grained, JavaScript regex engine, no wasm.** `shiki/core` +
`createJavaScriptRegexEngine()` from `shiki/engine/javascript`. The wasm Oniguruma engine is the
default and is the wrong default here: avoiding a WebAssembly download is most of the reason to go
fine-grained at all, and as of Shiki 3.9.1 the JS engine supports every built-in grammar, so the
compatibility argument for wasm no longer applies. Languages arrive as per-language dynamic
`import('@shikijs/langs/<x>')`, so a thread that only ever saw TypeScript never fetches the Python
grammar. One lazily-created memoised singleton highlighter, same shape as every other client in
`infrastructure/`.

**`codeToHast` into React elements, not `codeToHtml` into `dangerouslySetInnerHTML`.** The standing
rule from "How an answer renders" is that model text never becomes markup, and there is no reason
to spend it here: `codeToHast` returns a HAST tree synchronously and `hast-util-to-jsx-runtime`
turns that into elements. The rule keeps holding without a sanitiser and without an exception to
remember.

> **Correction, from building it.** This paragraph used to say `hast-util-to-jsx-runtime` was
> "already in the tree, `react-markdown` depends on it," and therefore needed no new dependency.
> That is wrong under pnpm. The store is isolated: a transitive dependency of `react-markdown` is
> not resolvable from this app's own `node_modules`, and importing it failed. It is now an explicit
> `dependencies` entry (`2.3.6`) alongside `shiki` and `@shikijs/langs`. The plan's reasoning about
> _which_ library to use survived; only the "it's free" part of it did not.

**Highlighting is client-only, in an effect, and the plain block is the real fallback.** The server
render and the first client paint stay exactly what stage 2 ships, so hydration matches and the
markup is identical whether or not a grammar ever loads; colour replaces it once the tokeniser
returns. That also means the deferral stays true in the worst case — if Shiki fails, is blocked, or
the language is unknown, the block is still framed, labelled, copyable and scroll-contained. Still
`COMPLETE`-only, per stage 2's decision: re-tokenising a growing block on every ~60 ms flush across
three columns is the one genuinely expensive thing in the render path, and mid-stream the syntax is
incomplete, so it would flicker between wrong colourings as the fence closes.

**Four new tokens, in hues nothing else in the app has claimed — asked, not assumed.** The direction
contract spends three colours and says green and red are "neither spent elsewhere," so a
conventional syntax palette breaks it at three points at once, and rust is reserved for things you
operate, which code is not. So: `--code-keyword` (blue), `--code-string` (teal), `--code-number`
(violet), `--code-function` (amber), all low-chroma enough to read as tinted graphite rather than a
rainbow, with comments reusing `--muted-foreground` and everything else falling through to
`--foreground`. Four tokens whose only use is inside a code block is the same narrow carve-out
`--win` already is. The alternative considered and rejected was pure weight-and-ramp with no new
hues: strictest reading of "a measurement instrument, not a chat toy," but it gives up the one thing
highlighting is for, which is finding the shape of a snippet without reading it.

- [x] Prove the `var(--code-*)` theme against a real build before building on it — Shiki writing a non-hex colour string through untouched is the load-bearing assumption, and the fallback is two built-in themes, written down here.
- [x] The four `--code-*` tokens in `styles.css` for both themes, and their pairs added to `check-contrast.mjs` against `--muted`, which is what a code block's background actually is.
- [x] `features/chat/code-theme.ts` (the authored theme) and the memoised highlighter with the curated language list; unknown languages render plain rather than guessing.
- [x] `code-block.tsx` grows the effect and the HAST-to-elements render, with the plain `<pre>` as both the SSR output and the failure state.
- [x] Measure the built client bundle before and after, and record both numbers here. This item was deferred over a bundle argument, so settling it without a number would be leaving the argument open.

**The `var(--code-*)` assumption is proven, so the fallback is dead.** A throwaway probe ran the
authored theme through a real `createHighlighterCore` + `codeToHast`: all 15 emitted `style`
strings kept the variable verbatim, no normalising to hex, no dropping the token. The two-built-in-
themes fallback written into the plan above is therefore not needed and should not be built — one
authored theme plus the `.light` class already in place does the whole flip, and every code colour
lives in `styles.css` as oklch where `check:contrast` gates it. **76 pairs pass in both themes,
nothing outside sRGB.**

**The four hues had to be re-picked for the sRGB gamut, not just for contrast.** The first attempt
put `--code-string` and `--code-function` outside sRGB in the light theme and the gate caught it.
oklch is unforgiving at low lightness for teal (h≈195) and amber (h≈74) specifically: at L=0.47 the
maximum in-gamut chroma is ≈0.080 and ≈0.100, where blue (h262) and violet (h305) allow 0.22+. All
four light values settled at L=0.47 with C between 0.072 and 0.10 — which is also, conveniently,
exactly the low-chroma tinted-graphite register the direction contract wanted, so the gamut ceiling
and the design intent pushed the same way.

**`code-languages.ts` split out of `code-highlighter.ts`, and this was a real bug, not tidiness.**
The first build had `code-block.tsx` importing `grammarFor` and `highlight` from the same module,
statically. That put Shiki's core and its regex engine — ~147 kB — in the **eager** path, paid by
every visitor including one who never opens a thread, which contradicts this plan's own "a thread
that only ever saw TypeScript never fetches the Python grammar" and the deferral argument behind it.
A block has to decide _whether a language is worth loading the tokeniser for_ before loading the
tokeniser, so the cheap half — the `Grammar` union, the alias table, `grammarFor` — moved to its own
Shiki-free module, and `code-block.tsx` now reaches the tokeniser with a dynamic
`import("./code-highlighter")` from inside its effect. `code-highlighter.ts` also absorbed the
HAST→React conversion, so `highlight()` returns a `ReactNode` and nothing outside that chunk touches
`hast-util-to-jsx-runtime` either.

**The `COMPLETE`-only flag reaches the fenced blocks through a context, not a prop.**
`answer-markdown.tsx` builds its `components` map at module level on purpose — rebuilding it per
render would hand `react-markdown` a new component identity on every streamed token — so the flag
cannot be closed over there. `CodeStreamingProvider` wraps the markdown instead, and it defaults to
"not streaming" so a block rendered outside an answer still colours.

**C and C++ were missing from the curated list, found by a real run.** A prompt asking for JS, TS,
JSX, TSX, Python, Java and C/C++ demos coloured everything except the `c and `cpp blocks, which
rendered plain. Not a highlighter bug — `grammarFor` returned `null` and the block took the
designed "unknown language renders plain rather than guessing" path. The list simply never had them.
Added: `c`, `h` → `c`, and `cpp`, `c++`, `cxx`, `cc`, `hpp` → `cpp`. `h` follows Linguist and reads a
bare header as C; a C++ header under the C grammar loses `class` and `template` to the theme's
default colour, which is incomplete rather than wrong, so it is still worth colouring. The general
lesson is that the curated list is the one part of this feature that fails silently — a missing
language looks exactly like a working plain block, so only a real prompt finds the gap.

**Then seven more, asked for directly: `c#`, `php`, `ruby`, `swift`, `kotlin`, `toml`, `prisma`.**
The list named in the previous paragraph as "still unlisted" was closed out in the same sitting, plus
`prisma`, which this project's own schema is written in. Aliases: `cs` / `csharp` / `c#`, `php`,
`rb` / `ruby`, `swift`, `kt` / `kts` / `kotlin`, `toml`, `prisma`. That is **25 grammars** and the
curated list is now roughly the set a model actually reaches for. Still unlisted and still rendering
plain: `dockerfile`, `graphql`, `lua`, `perl`, `scala`, `dart`, `elixir`, `ini`, `nginx`.

**Verified before shipping, because the aliases being right does not mean the theme is.** A one-shot
probe tokenised a real sample per language through the actual `code-theme.ts` and counted the emitted
colours. All nine new languages produced comments, strings and the theme default with every value
still a `var(--code-*)` and no raw hex. TextMate scope matching is prefix-based, which did most of
the work unaided: `keyword` already covers `keyword.control.directive.include.c`, `string` covers
`string.quoted.other.lt-gt.include.c`, and Prisma's `storage.type.model`, `entity.name.type.model`,
`support.type.primitive` and `entity.name.function.attribute` all landed on existing scopes. Probes
deleted after they answered the question.

**One scope added to the theme, for TOML.** A `[section]` header is `entity.name.section`, which
nothing in the theme claimed, so the structural spine of a config file read as body text while its
strings and numbers coloured. Added to the existing keyword group — no new token, no new hue, so the
direction contract's colour budget is untouched. It also catches markdown headings inside a fenced
markdown block, which is a fair reading of the same idea. TOML still shows three of four hues after
the fix and Prisma shows three of four, and both are correct rather than gaps: TOML has no
functions, and the Prisma sample had no numeric literal. TOML keys stay `--foreground` on purpose,
the same way `variable.other.member` does everywhere else — the section is the structure, the key is
the content.

**C++ is the most expensive grammar in the set, and it is worth it because it is lazy.** `cpp` pulls
`cpp-macro`, `regexp`, `glsl` and `c` with it, landing as a single **796,960-byte** chunk against
72,174 for `c` alone. Rollup duplicates `c` inside it rather than pointing at the standalone `c`
chunk, so a thread showing both a C and a C++ block fetches that grammar twice — noted, not fixed,
since both are lazy and the duplicate is 72 kB on a path most threads never take.

**Rollup shares embedded grammars across the lazy entries, which is why `php` and `ruby` are cheap.**
`php` embeds html, xml, sql, javascript, json and css; `ruby` embeds twelve grammars including
`cpp`. Both looked like they would be enormous and neither is — 113,065 and 88,041 — because
html, javascript, css, sql, json, shellscript, yaml, markdown and cpp all already exist as their own
lazy chunks and Rollup reused them, hoisting only `xml` into a new 5,380-byte shared chunk. The cost
did not vanish, it moved: a Ruby block transitively **fetches** the C++ grammar at runtime, so the
first Ruby block on a cold cache pulls close to a megabyte across several chunks. Every one of those
chunks is shared with the language that owns it, so a thread that already showed a C++ or HTML block
pays nothing extra for the Ruby one.

**Bundle, before and after** (`apps/web/.output/public/assets/*.js`):

|                                    | files | bytes     |
| ---------------------------------- | ----- | --------- |
| Pre-Shiki baseline                 | 14    | 725,621   |
| Eager, after                       | 15    | 727,733   |
| Lazy — Shiki core + engine + theme | 1     | 146,772   |
| Lazy — 25 grammars                 | 25    | 2,385,466 |
| Lazy — shared (`xml`)              | 1     | 5,380     |
| Total on disk                      | 42    | 3,265,351 |

**The eager path grew 2,112 bytes, 0.29%** — and the one new eager file is a 1,088-byte shared
`react/jsx-runtime` chunk that Vite split out because both graphs now need it. Twenty-five grammars
and 2.5 MB of tokenising data cost every visitor two kilobytes, because none of it is reachable
without a completed fenced block. The tokeniser is fetched by the first completed block with a known
language, and each grammar by the first block that uses it; a thread with no fenced code downloads
none of it. Verified in the built output rather than asserted: the only mention of the highlighter
chunk anywhere in the eager set is `await import("./code-highlighter-….js")` inside the thread route,
plus its lazy dependency map.

The 25 grammars, largest first: cpp 796,960 · typescript 181,141 · jsx 177,853 · tsx 175,597 ·
javascript 174,820 · php 113,065 · csharp 90,182 · ruby 88,041 · swift 87,224 · c 72,174 · python
69,945 · markdown 59,328 · html 57,244 · css 49,034 · go 46,811 · shellscript 41,472 · java 27,280 ·
sql 23,421 · rust 15,062 · yaml 10,499 · kotlin 8,778 · prisma 7,737 · toml 6,419 · json 2,817 ·
diff 2,562. Written out as 25 named `import()` calls rather than a template literal, because a
template literal lets Vite glob all 361 grammars in `@shikijs/langs` into the manifest.

**The server bundle carries `_libs/shikijs__langs.mjs` at 1,195,450 bytes and never loads it.** Vite
emits every dynamic import into the SSR output because it cannot know the branch is unreachable
there, but the import sits inside a `useEffect`, which does not run on the server. Dead weight on
disk, never in a response, and not user-facing — recorded so the next person reading the build
output does not think highlighting leaked into SSR.

**Stage 4 — Arcjet** — **built and verified against the live Arcjet API.** The automated gate is green, and
every decision below was measured rather than reasoned about. `@arcjet/node@1.11.0`; no TanStack Start
adapter exists, so the request is mapped to Arcjet's Node shape by hand.

- [x] `infrastructure/arcjet.ts`, lazy and memoised like every other client: one base client carrying
      shield and bot detection, plus three memoised `withRule` clones — prompt (bucket + injection), spend
      (bucket alone), injection (injection alone). `withRule` clones share the base client's decision
      cache; two sibling `arcjet()` constructors would not.
- [x] The per-person budget on `startTurn` **and on `retryResponse`**; prompt-injection detection on
      `startTurn`; shield and bot detection on all three paths, `/api/chat` included. Every one of them
      before a provider is ever called.
- [x] A blocked request returns a plain human sentence, never a raw rule name. Call sites never see an
      Arcjet type: `screenPrompt` / `screenRetry` / `screenStream` return a `RequestVerdict` carrying a
      finished sentence and an HTTP status. `/api/chat` answers `{ message }` with that status, and
      `read-model-stream.ts` now prefers the endpoint's own sentence over its generic line — the
      difference between "try again in about ten minutes" and a column that says nothing useful.

**Three corrections to "Arcjet, and where the limit actually belongs" above.** That section put shield,
bot detection and prompt-injection protection together on `/api/chat`. Built:

- **Shield and bot detection belong on all three paths, not just `/api/chat`.** They sit on the base
  client, so `startTurn` and `retryResponse` get them too. All three are same-origin calls from our own
  screen and all three end in a paid model call; screening only the endpoint protects the pipe and not
  the two things that fill it.
- **Prompt-injection detection belongs on `startTurn`, not `/api/chat`.** `/api/chat` names a row and
  carries no user text at all — the prompt, the history and the model are read back from the database, by
  stage 2's decision. There is nothing on that request for an injection detector to read. `startTurn` is
  the one place user-written text enters the app.
- **The budget has to cover `retryResponse`.** A retry is one more paid model call, so a budget that
  counts only prompts is bypassable one retry at a time.

A fourth, smaller deviation: the refusal sentences live in `arcjet.ts` beside the rules rather than in a
companion module, because nothing else consumes them — a call site receives the sentence on the verdict.

**What a token buys, and the one place it undercharges.** `startTurn` charges `modelIds.length` against a
thirty-token-per-hour bucket keyed by user id; `retryResponse` charges one. Thirty model answers an hour,
so ten three-model prompts or thirty single-model ones — which is what "a real limit on how much one
person can use across all three models at once, not just a limit on the endpoint overall" actually asks
for. On a **follow-up** turn `startTurn` ignores the submitted `modelIds` and uses the thread's locked
set, so a crafted client sending one id for a three-model thread undercharges by two. Accepted rather
than fixed: the abuse is bounded at three times the hourly budget, on free-tier models that cost
$0.0000, and closing it costs an extra query on every honest turn.

Charged outside the transaction and before the catalog read, so a blocked prompt costs nothing but the
check itself — and so a database transaction is never held open across a round trip to a third party.

**`body: ""` keeps Shield off the prompt on purpose.** Shield is a WAF: it reads a request body for SQL
and script injection. An arena is legitimately sent SQL, script tags and shell as _content_ to compare
answers about, so a WAF reading that body is a false-positive machine. Shield judges the envelope; the
prompt is judged by the injection detector, which is the rule that knows what a prompt is.

**The IP comes from the socket, not a header.** `getRequestIP()` from `@tanstack/react-start/server`
resolves to the srvx peer address, and it is passed as `ipSrc`, which takes precedence over Arcjet's own
detection. A caller cannot move their own rate-limit identity by setting `X-Forwarded-For`.

**Read the per-rule results, not the decision's conclusion.** This is why `verdictFor` looks the way it
does, and it was found by measurement. One `protect()` carrying the bucket and the injection rule
returned:

```
conclusion: ERROR   reason: "Unable to detect prompt injection - contact Arcjet support"
  SHIELD=ALLOW   RATE_LIMIT=ALLOW (remaining=0)   BOT=ALLOW   ERROR=ERROR
```

One rule failing upstream turns the whole decision into an `ERROR` while Arcjet still reports what every
other rule concluded. Branching on `decision.isErrored()` — the obvious shape, and the first one written
here — fails open on that aggregate and throws away a perfectly readable `RATE_LIMIT` result, so a broken
injection rule would have silently switched the hourly budget off. `blockingReasons` walks
`decision.results` instead, blocks on any rule that actually denied (`DRY_RUN` excluded), and falls back
to the decision's own reason only when a denial carries nothing readable per rule. Confirmed the other
way too: with the bucket spent, the same call returned `DENY` with `RATE_LIMIT=DENY`. The budget does
enforce.

**Prompt injection runs LIVE — flagged prompts are blocked — and it needed a second look to work at all.**
Measured across four separate runs against the live API: the _first_ injection evaluation in a fresh
process always errors, and every one after it succeeds. The decision-level reason gives the real cause,
`[deadline_exceeded] the operation timed out`. The SDK's Decide deadline is 2,000 ms and its
`decideTimeout` only _floors_ an injection request at 1,000 ms rather than raising it, so the model's cold
start outruns the deadline. The surfaced text — "Unable to detect prompt injection - contact Arcjet
support" — is misleading; nothing is wrong with the account or the plan.

Left alone that is exactly one unscreened prompt per server process, deterministically, in the rule this
product most wants enforced. So `screenPrompt` checks whether the injection rule produced a conclusion of
its own and, when it did not, re-screens the prompt on `injectionClient` — the injection rule with no
bucket rule on it, so the same prompt cannot be charged a second token. Verified in a fresh process: the
first call times out with no injection result, and the recheck comes back with a real
`PROMPT_INJECTION_DETECTION` conclusion. The cold start is per process rather than per client, so the
first call warms the model and the recheck lands on a warm one.

Raising the deadline instead was considered and rejected. It is only reachable by hand-building a
`createRemoteClient({ timeout })` and passing it as `client`, and it would make _every_ hung Arcjet
request slower for everyone rather than paying one extra round trip on the one prompt that needs it.

**The detector's recall is not perfect, which is worth recording rather than assuming.** Of three
deliberate override attempts sent through the rule, one was denied and two were allowed. It is a real
filter, not a guarantee — the honest reason nothing downstream treats a clean injection verdict as
permission for anything.

**What it costs.** Arcjet is server-only and the built output says so: after a clean build,
`grep -rl "arcjet\|Arcjet"` over `.output/public/` returns nothing at all. The server bundle carries
3,536,860 bytes of it — `@arcjet/analyze` 3,012,031 (the local analysis WASM), `@arcjet/node` 483,030,
seven small `arcjet__*` chunks totalling 34,864, and our own `infrastructure/arcjet.ts` at 6,935. Weight
on disk for a check that runs per request; none of it is ever sent to a browser.

**Verified live, not read.** `curl -X POST /api/chat` returns
`403 {"message":"We couldn't accept that request. Reload the page and try again."}` and logs
`[arcjet] blocked /api/chat: BOT` — a plain sentence out, the rule name kept server-side. A Chrome-shaped
`User-Agent` is blocked as `BOT` as well; Arcjet fingerprints past the UA string. The bucket and the
injection rule were driven directly against the live API with the real key, because both need a signed-in
session that `curl` cannot produce: thirty tokens spent, the next call denied `RATE_LIMIT`, and the
injection rule denying a real override attempt.

**Seen in a browser too.** Both refusals were verified by hand in a signed-in session — the rate limit
with thirty model answers actually spent, and the injection rule against a real override attempt. Each
arrives on screen as its plain sentence with a retry, and the rule name stays in the server log. Nothing
is left open in this stage.

**Stage 5 — PostHog**

- [x] `infrastructure/public-env.ts` and the `VITE_` pair in `.env` / `.env.example`.
- [x] Browser: session replay and heatmaps, identified to the signed-in user.
- [x] Server: the three funnel events plus `captureAiGeneration` per call.

**Two modules, not one, and the split is the whole reason nothing leaks.** `infrastructure/posthog.ts`
imports `posthog-node` and `@posthog/ai`; `infrastructure/posthog-browser.ts` imports `posthog-js`. One
module holding both would drag the server SDK into the client graph the moment a component touched it —
the same reason `arcjet.ts` is server-only, made explicit here because this is the first integration with
a real browser half. Measured after a clean build: `posthog-node`, `@posthog/ai` and `arcjet` each appear
in **0** of the 56 files (4,224 KB) under `.output/public/`, and `posthog-js` appears in exactly one, as
replay requires. The only PostHog key in client output is `VITE_POSTHOG_KEY` and its inlined literal;
`grep -roE ".{6}POSTHOG_KEY"` over the public bundle returns only `.VITE_POSTHOG_KEY` and
`{VITE_POSTHOG_KEY`, never the bare server variable.

**`public-env.ts` reads each key by name rather than spreading `import.meta.env`.** Vite statically
replaces named member access at build time; a spread is not reliably replaced, so a spread would compile
to a lookup on an object that does not exist in the browser and the key would simply be absent. Written
as a spread first and fixed before it ever ran. It is lazy and memoised for the same reason `serverEnv()`
is: `vite build` evaluates route modules, and an eager read would fail a build on a machine with no
`.env` rather than failing on the screen that needs the value. Confirmed inlined into
`.output/public/assets/index-*.js`.

**Naming: `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST`, matching the server pair, not the wizard's
`VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` / `VITE_PUBLIC_POSTHOG_HOST`.** `VITE_` already means public, so
`VITE_PUBLIC_` says it twice, and `KEY`/`HOST` beside `POSTHOG_KEY`/`POSTHOG_HOST` makes the pairing
readable at a glance. Both name the same project — the verification script confirmed the two keys are
byte-identical.

**PostHog's own recommended installer, `pnpm dlx @posthog/wizard@latest`, was assessed and declined.**
Unpacked rather than assumed: `@posthog/wizard@2.69.0` is an AI coding agent, depending on
`@anthropic-ai/claude-agent-sdk`, `@earendil-works/pi-coding-agent` and `@modelcontextprotocol/sdk`. It
does have first-class `tanstackStart` support, so this is not a support gap. It was declined because it
would rewrite this repo without knowing its laws — the layering rules, the `process.env` ban and its two
named exemptions, the comment conventions — it uses the conflicting env naming above, and it covers only
the browser SDK, which is the smaller half of this stage. A real key was already in `.env`, so it had
nothing left to bootstrap either.

**Browser: `defaults: "2026-08-30"`, the dated default set, rather than hand-picked flags.** Three of its
changes are load-bearing. Pageviews follow history changes, which is what a client-side router needs or
every navigation after the first goes uncounted. Injected scripts go into `<head>`, which avoids an SSR
hydration mismatch. Replay enforces a minimum duration, so a tab someone bounced off is not stored as a
recording. `person_profiles: "identified_only"` because a leaderboard cares about people who voted, not
about every anonymous scroll. `disable_session_recording: false` and `capture_heatmaps: true` are stated
rather than left to their defaults, because feature 1 asked for both by name and a silent default is not
a decision anyone can read back.

**The hook lives in `__root.tsx` and identification is tri-state, not boolean.** `usePostHogViewer()` is
called in the one component that never remounts, so replay starts once per document instead of being torn
down on every navigation. `identify` runs only when the session is `signed-in` and the id differs from
the last one identified. `reset()` runs only on an explicit `signed-out` that follows a real
identification. The case that forced this: an `unavailable` session means the database could not tell us
who is here, and resetting on that would sign a person out of their own analytics on a blip. A plain
anonymous visit must not reset either — that would throw away the distinct id their pageviews are already
attached to. The client itself is memoised tri-state (`undefined` not asked, `null` asked and cannot), so
a missing `VITE_` pair degrades to a single `console.warn` instead of breaking a screen.

**The funnel events fire _after_ the write that makes them true, never before.** `prompt_sent` is
captured after `startTurn`'s transaction commits, because a prompt Arcjet refused or one whose
transaction rolled back is not a prompt that was sent, and counting it would make the prompt-to-answer
rate read better than it is. `answer_finished` and the `$ai_generation` both fire from one helper,
`reportFinished`, after the row write — one place, so the funnel event and the LLM-analytics event can
never disagree about what happened. `vote_cast` fires after its transaction commits.

**Recording a vote forced a small restructure in `cast-vote.server.ts`, and the shape matters.** The
funnel needs the winner's model id and every candidate's, which the caller has no business receiving. The
obvious move — a mutable variable the transaction closure writes to — is both the shared-mutable-state
rule broken and a real bug: a rolled-back transaction would leave a `vote_cast` in the funnel that no row
backs. So the transaction now returns `VoteOutcome`, `{ result, counted? }`, and the event is emitted
only when `counted` came back. `finished.some(...)` became `finished.find(...)` in the same edit, because
the winner's model id was already being looked up and then thrown away.

**`streamModelResponse` took four analytics-only fields: `userId`, `threadId`, `turnId`, `prompt`.** The
stream needs none of them, and the docblock says so, so a later reader does not go looking for a use.
`prompt` is passed down from `chat-endpoint.server.ts` off the turn row rather than recovered from
`messages`, whose content may be structured parts rather than a string. `traceId` is the turn id, so
three models answering one prompt form one trace instead of three unrelated ones.

**A cancelled answer is recorded as a generation with no error.** Stopping is the person's choice and is
never counted against the model (feature 9), but the tokens were really spent, so whatever text arrived
is sent with `outcome: "cancelled"` and no `error` field. A failed answer carries the provider error.

**Latency converts to seconds at the boundary.** Everything in this app measures milliseconds; the
`$ai_*` schema is defined in seconds. Converting in `captureGeneration` beats storing a second unit
anywhere upstream. `costOverride` sends `0` for both halves honestly, per the free-tier rule.

**Nothing in either module can fail a request.** `capture` only queues, so it does not reject — but a
misconfigured host throws on construction, which is why the queue call sits in a `try`.
`captureAiGeneration` returns a promise that the caller drops with `void` and a `.catch` that logs.
Analytics that can take a prompt down with it is worse than no analytics.

**Feature 1's `captureAiGeneration`-over-`withTracing` decision was re-verified from source, not
trusted.** `@posthog/ai@8.9.0` now accepts `@ai-sdk/provider@^4` as a peer, which looked like it might
have made the wrapper usable. It has not: `withTracing` is still typed `LanguageModelV2 |
LanguageModelV3`, while the installed `@openrouter/ai-sdk-provider@3.0.0` declares
`specificationVersion: "v4"`. The recorded decision holds for exactly the recorded reason.

**Verified against the live project, not just compiled.** Typecheck, lint at `--max-warnings=0`, and a
clean `vite build` (4.75 s) all pass. A throwaway script proved the network path end to end before being
deleted: both keys are the same project, a raw POST to `/i/v0/e/` returns `200 OK`,
`captureAiGeneration`'s option shape is accepted, and the queue flushes and shuts down cleanly. It used
deliberately non-funnel event names (`setup_check`, `setup_check_sdk`) and a fake model id
(`nexora/setup-check`) under distinct id `nexora-build-check`, so nothing it sent can be mistaken for
real funnel or leaderboard data. Separately, `curl http://localhost:3000/` returns `200` with no
env-error text in the HTML and no PostHog lines in the dev log, which confirms the SSR pass never touches
`publicEnv()` — the `typeof window === "undefined"` guard holds.

**What only a person can confirm, and it belongs in stage 6's manual pass:** that a real signed-in prompt
produces `prompt_sent`, three `answer_finished`, one `$ai_generation` trace per turn and a `vote_cast`;
that a replay exists and is attached to a named person rather than an anonymous id; and that heatmap data
accumulates.

**Stage 6 — gate and documents**

- [x] typecheck, lint, `format:check`, a real production build, `check:contrast`, `check:auth-schema`.
- [x] `detect.mjs` over the changed UI files, and a `curl` smoke test of the routes that can be reached without a browser.
- [x] A live run against real models: three at once, one deliberately failing, a follow-up, a vote, a cancel — with the resulting database rows read by hand.
- [x] One prompt written to force markdown — headings, a nested list, a table, a long-lined fenced code block — watched live in all three columns, checking that emphasis does not flicker mid-stream, that a long code line scrolls inside its block instead of widening the column, and that highlighting arrives on completion.
- [x] Manual pass by a person: both themes, keyboard-only through the columns, the metrics row, the code-block copy button and the vote. ~~the metrics disclosure~~ — corrected: stage 2 replaced the disclosure with an always-visible row, so there is no control there to operate, only contrast and tab order to check.
- [x] This section rewritten from what was built, and `DESIGN.md` / `PRODUCT.md` updated where the build changed either.

**The gate, measured.** typecheck, `eslint --max-warnings=0` and `format:check` clean. `check:contrast`
passes **76 pairs in both themes** with nothing outside sRGB — up from feature 5's 66, because stages 1–3
added tokens. Its three remaining notes are all advisory `never signal with colour alone` pairs (rust vs
error-red at 1.27:1, rust vs winner-green at 1.31:1 and 1.54:1); they are correct as notes, because in
every place those colours meet, the state also carries an icon or a word. `check:auth-schema` reports 4
tables and 30 fields matching the installed Better Auth. A production build from a wiped `.output`
finished in 5.16 s. `detect.mjs` over the eighteen changed feature 6 UI files returned `[]`.

**The `curl` pass, including two redirects that are correct rather than broken.** `/` 200 (20,923 b),
`/models` 200 (54,716 b), `/leaderboard` 200 (30,534 b). `/sign-in` and `/thread/<id>` both return **307**
to `/sign-in?next=…` with the original path preserved and URL-encoded, which is the signed-out behaviour
these routes are supposed to have — `/sign-in` normalising its own URL to carry `next=%2F` looked like a
redirect loop at first glance and is not one. Following it renders the real page with both OAuth buttons
present in the SSR output. `POST /api/chat` returns 403 and the plain sentence with a Chrome-shaped
`User-Agent` as readily as with none, logging `[arcjet] blocked /api/chat: BOT` both times.

**The deliberate failure needed no code change and no waiting for a 429.** The plan was to provoke a real
upstream rate limit. A better instrument turned up in the dev log:
`thinkingmachines/inkling-small:free` is in the live free catalog (18 free models) and refuses every call
in about 150 ms with `AI_APICallError: … only available on agentic harnesses`. A genuine upstream refusal,
deterministic, nothing mocked and nothing edited. `z-ai/glm-5.2:free` supplied a second, slower real
failure at ~12 s.

**What the rows say, read back by hand after the pass.** All of the following is measured data, not what
the screen appeared to show:

- **Independent failure holds.** One turn: `nvidia/nemotron-3-ultra-550b-a55b:free` COMPLETE at 1,468
  chars with 102/985 tokens and 91.13 tok/s, `z-ai/glm-5.2:free` FAILED with `failure=PROVIDER`,
  `minimax/minimax-m3:free` COMPLETE at 1,775 chars and 112.10 tok/s. The failure took nothing with it.
- **Retry writes a new row beside the failed one, and feature 6's `latestAttempts` rule is visible in the
  data.** `z-ai/glm-5.2:free` appears twice on the same turn — `#1` at 11,996 ms and `#2` at 12,061 ms,
  both `FAILED / PROVIDER`, both kept. Same shape for `thinkingmachines/inkling-small:free` (#1 180 ms,
  #2 171 ms). Nothing was overwritten.
- **A cancel keeps its partial text.** Three `FAILED / CANCELLED` rows carry 696, 46 and 2 characters
  with real `ttftMs` (1,651 / 3,536 / 8,077 ms) and `totalTokens` null. The null is correct and not a
  gap: the catch path measures with no usage because the provider never sent any, and stage 3 already
  decided `CANCELLED` is excluded from reliability stats.
- **A follow-up grows only its own model's history.** One thread carries three turns, and the same model's
  `promptTokens` rises from 102 on the first to 612 on the second — the per-model conversation
  thickening exactly once per turn.
- **The vote points at a finished answer.** One turn's `Vote.winnerResponseId` resolves to the
  `minimax/minimax-m3:free` row that was `COMPLETE`, not to either of the other two.
- **Cost is `0.000000` on all 188 rows**, which is the free-tier rule reading correctly rather than a
  missing measurement.

**Two `STREAMING` rows exist in the database and are meant to.** Both are
`nvidia/nemotron-3-ultra-550b-a55b:free` with 0 characters, dated 26 and 30 August, left by dev-server
restarts rather than by this pass. Stage 3 designed for exactly this: a `STREAMING` row on load renders
the interrupted surface with a retry rather than a spinner that never resolves. Recorded here so a later
reader does not mistake them for corruption.

**The free tier's real failure rate, since it is now worth writing down.** Across every row ever written:
118 `COMPLETE`, 63 `FAILED / PROVIDER`, 5 `FAILED / CANCELLED`, 2 `STREAMING`. A third of all calls
failed. Some of that is `inkling-small` refusing by design, but not most of it. This is the honest
operating condition of a free-tier arena, and it is why per-model retry and per-model failure surfaces are
load-bearing rather than polish — feature 1 noted this once from a single 429; 188 rows confirm it.

**One decision the data confirms rather than challenges.** A ten-token answer recorded 5.69 tok/s because
`computeTokensPerSecond` divides by the whole call duration, and that answer spent 1,744 of its 1,757 ms
before its first token. That reads low, and it is deliberate: dividing by the visible window instead once
measured 2,277 tok/s for a reasoning model actually doing about 25. `ttftMs` is reported beside it so the
queue time stays visible rather than hidden inside the speed number.

**What was verified in a browser by a person:** three models at once with one failing, a retry, a
follow-up, a cancel, a vote, the markdown-forcing prompt watched live in all three columns with no
mid-stream emphasis flicker and highlighting arriving on completion, both themes, and a keyboard-only pass
over the columns, the metrics row, the copy button and the vote. Feature 6 is done.

## Slice 2: App shell & thread history

### 7. Thread history

> **Originally written against Next.js and Clerk; rewritten as built.** The paragraphs below describe what actually shipped on TanStack Start and Better Auth. The reasoning about grouping and recency is unchanged from the plan; what the sidebar shows per thread is not, and that reversal is recorded below rather than quietly edited away.

> **The shell frame moved into feature 4.** This feature originally owned both the frame — top bar, sidebar, sticky positioning, per-model win pills, drawer collapse — and the thread list inside it. Feature 4 needs a real composed surface to prove its token set against, and the frame has to exist before any screen can be designed inside it, so the frame is built there and this feature keeps what was always its substantive half: replacing the placeholder thread list with real data. The frame's own decisions (what sits where, how it collapses) are recorded in feature 4, not repeated here.

The frame everything else sits inside: a top bar and sidebar that stay in place while the page scrolls, the thread's name, and each model's win record shown right there (shrinking down to a small dot and number if it gets crowded). The sidebar lists a signed-in user's own past threads so the tool actually feels usable across visits, not just in one sitting.

#### Thread history, wired to the real database

Feature 4's shell is UI only; `PLACEHOLDER_THREAD_GROUPS` stands in for a signed-in user's actual threads. This closes that placeholder out.

**Recency grouping is computed in the query, not eyeballed from a raw timestamp.** "Today" is the calendar day so far, "This week" the six days before that, "Earlier" everything older, all measured from each thread's `updatedAt`. Empty groups are dropped rather than rendered with a heading and nothing under it.

**~~A thread's model count is the distinct `modelId`s across all its `ModelResponse` rows, not a stored column.~~ Reversed: the sidebar shows no model count and no avatars at all.** The plan was right that the number was cheap to compute and could never drift. It was wrong that it belonged in the thread list. On screen, a row of overlapped initials plus "3" under every title read as decoration: it never answers the question a person actually brings to a sidebar, which is _which conversation was this_, and it stole the width the title needed to answer it. The count still exists where it means something — the composer's `ModelStack` and the answer cards themselves — and the query no longer joins `ModelResponse` at all, so the list got cheaper as well as quieter.

**The query is `features/shell/thread-history.server.ts`, reading `@/infrastructure/database` behind a `createServerFn`, with the session resolved by `readSessionState`.** It stays feature-local rather than becoming a second `infrastructure/` client: nothing else needs a recency-grouped thread list, the same layering feature 5's picker already draws. The Next.js/Clerk shape in the original plan became a TanStack Start server function called from the root loader; the root route hands the grouped result down through `AppShell` into both the desktop sidebar and the mobile drawer, because the sidebar is client code and a signed-in user id plus a database round trip is not. Signed out, or before a first prompt, that is `[]`, which the sidebar already had a rule for. `groupDomId` turns a group label into a DOM id — the first version interpolated the label straight into `aria-labelledby`, which produced `aria-labelledby="thread-group-This week"` and, because that attribute is a space-separated **list** of ids, pointed at two ids that do not exist instead of one that does.

**`Thread.updatedAt` now advances on a follow-up, not only on creation.** `@updatedAt` only fires on a write to the `Thread` row itself, and `start-turn.ts` previously only ever created or read it, never touched it on a reply. Without a deliberate touch, a thread from six turns ago and one from six months ago sort identically the moment both were merely _created_ around the same time, which is exactly the distinction "grouped by recency" exists to draw. `startTurn` now updates the row on every follow-up inside the same transaction that writes the turn.

**A new thread needs an explicit `router.invalidate()` after navigation, and a follow-up needs one too.** TanStack Start keeps the root loader cached indefinitely, and that loader is exactly where the thread list is read. Without invalidation, a brand-new thread would not appear in the sidebar until some unrelated hard reload, and a follow-up's recency bump would not reorder it. The new-thread route invalidates after navigating to the thread, while the follow-up hook invalidates after the turn is saved.

#### Titles a person can actually scan

The first build named a thread by cutting its opening prompt to length. That is a correct string and a useless title: "can you look at this typescript error i keep getting when i…" tells a reader nothing the row beneath it doesn't, and two threads opened with the same question are two identical rows.

**A model writes the title; the truncated prompt stays as the provisional name and the fallback.** `threadTitleFrom` still runs at creation, so a thread is never nameless for a single frame and never blocks on a network call to appear in the sidebar. `ensureThreadTitle` replaces it afterwards.

**No model is pinned. The catalog is ranked at call time.** Every free-tier id on OpenRouter churns — pinning one would mean a dead constant the day it is delisted, and this project has no test suite that would notice. `rankTitleModels` scores whatever is live: reasoning markers in the id are pushed to the back (a reasoning model spends hundreds of tokens deliberating over six words), instruct markers pulled forward, parameter count read out of the id as a tiebreak. Four candidates are tried in order, because measured across 188 real rows a third of free-tier calls fail outright, so a ranking is a preference and never a guarantee.

**The first build's ranking was the bug, and finding that out took probing the live API rather than rereading the code.** Titling had been "working" in the sense that the call succeeded and returning a title that never changed: `cleanGeneratedTitle` rejected every reply, all three attempts were counted as failures, and the fallback `threadTitleFrom(turns[0].prompt)` was byte-identical to the name already stored, so the server function answered `unchanged` and the sidebar kept showing the raw opening prompt. The rejection was real, not a parsing slip: **12 of the 19 free models returned `content: null` with `finish_reason: "length"`.** Thirty-two output tokens is smaller than the deliberation these families do by default, so the entire budget went to reasoning and the text block came back empty.

The earlier heuristic deserves naming, because it was the root cause rather than a bystander: `SMALL_MARKERS` matched `mini`, `flash`, `lite`, `nano`, `tiny`, `micro` and **pulled those models to the front of the queue**, on the theory that a small model is a fast one. In the current free catalog those suffixes land overwhelmingly on reasoning-by-default endpoints — the exact population that returns nothing. A "fast and cheap" signal was selecting for the failure. It is deleted, not tuned. `NOT_A_NAMER_MARKERS` replaces it, pushing classifiers and vision captioners back instead: `content-safety`, `safety`, `moderation`, `guard`, `omni`, `vl`, `clip`, `embed`, `rerank`. Those do answer — with `User Safety: safe`, which is a verdict, not a name.

**Reasoning is now disabled at the call site, and the type requires more than `enabled: false`.** The provider option is a discriminated union: `effort` or `max_tokens` is mandatory alongside `enabled`, so `{ enabled: false }` alone does not compile. The shipped value is `{ enabled: false, exclude: true, effort: "none" }` — three signals that agree, which matters because a few endpoints declare reasoning mandatory and refuse the request instead. That refusal is just a failed attempt and the loop moves on. The output budget went to 512 with the same reasoning: 32 could only ever be enough for a model that does not deliberate, and the point is to stop depending on that.

**`maxRetries: 0`, because retrying a rate-limited free model spends the budget on the same refusal.** The AI SDK's own three attempts were seen burning 7.1 seconds on one candidate before the loop above it got a turn. With retries off, a rate-limited model fails in roughly 330–420 ms and the next candidate is tried inside the wall clock the first one used to waste. The timeout is 12 s for the whole attempt. Measured live after the change: `cohere/north-mini-code:free` named a thread in 867 ms, `dots-studio/dots-3-note-preview:free` in 1154 ms.

**A `supported_parameters` ranking was considered and ruled out by the data.** It looks like the obvious way to identify a model that can return plain text, but all 22 free rows declare `include_reasoning,reasoning`, so the field carries no information and cannot discriminate.

**Titling watches the first three turns, then freezes.** A thread that opens with "hey" has no subject in turn one; the turns after it are the whole reason to keep looking. After the third turn a title is settled, and a thread quietly renaming itself under a reader who has learned where it sits would be worse than an imperfect name. `Thread.titleLocked` freezes it earlier: renaming by hand sets it, and generated titling never touches a name a person chose.

**A generated title is cleaned, then made unique.** Models return `Title: "…"`, markdown asterisks, trailing full stops, and sometimes an answer to the prompt instead of a name for it — `cleanGeneratedTitle` takes the first usable line, strips the padding, and returns `null` over 72 characters, which is a model that answered rather than titled. Three guards were added once real replies were read:

- **`ECHOED_SHAPE` strips the brief's own labels handed back** — `Message 1: CPU cores and architecture` from a model shown two messages. These are **stripped rather than rejected**, and that distinction is the whole point: the model is naming the right subject underneath the label, so rejecting would fall back to the raw prompt, which is the original bug wearing a different hat.
- **`collapseDoubled` un-doubles a title repeated twice in one line** — `Processing Unit OverviewProcessing Unit Overview`. A first attempt halved any even-length string and produced a false positive on a 90-character `"x".repeat(90)`, so it now requires each half to contain a space and to be at least 8 characters, which keeps a genuinely short title like `TestTest` intact.
- **`VERDICT` rejects a moderation answer outright.** `User Safety: safe` is not a subject; there is nothing underneath it worth keeping.

`uniqueTitle` then suffixes ` (2)` against the user's own threads, which is what finally tells two identical prompts apart.

**Failure is silent by design.** Every failure path — no catalog, four refused calls, an unusable reply, a dead database — leaves the prompt-derived name in place and returns `unchanged`. Titling is a side path; a worse title is acceptable, a broken thread is not, and nothing about this ever reaches the screen as an error. The write is raw SQL for the same reason renaming is: `updatedAt` is `@updatedAt`, and a title arriving would otherwise yank the thread into Today.

**The client asks once per settled stream, not on a timer.** `useEnsureThreadTitle` fires when streaming goes from true to false and the thread is still inside the watch window, then invalidates the router only when the title actually changed.

#### Renaming, deleting, and searching from the sidebar

**Row actions live in a vertical three-dot menu on the row, revealed on hover, focus, and while open.** Horizontal dots read as "drag me"; vertical is the list-row idiom every reader already knows. The menu is portalled, because a menu rendered inside the thread list is clipped by that list's own `overflow-y-auto` the moment it opens near the bottom.

**Delete is a modal, not `window.confirm`.** The browser dialog cannot be styled, cannot be themed, names the origin instead of the thread, and reads as a security prompt for what is an ordinary decision. `DeleteThreadDialog` names the thread and says what goes with it, and blocks Escape while the delete is in flight. Deleting the thread you are reading navigates home, because the page under you just stopped existing.

**Delete renders in `--destructive`, and getting it there was a real finding.** Tailwind utilities live in a cascade layer, so a plain CSS class like `.side-row` outranks a `text-destructive` utility on the same element — the colour was being written and then silently lost. The fix is structural: `.menu-row[data-variant="danger"]` owns the colour in the same layer as the row pattern. Reusing `.side-row` for menu items would have reintroduced it, so menu rows are their own class. Four new pairs went into `scripts/check-contrast.mjs` for this (destructive-on-popover, destructive-on-accent, foreground-on-popover, muted-foreground-on-popover); the gate now covers 84 pairs in both themes.

**Search is a server query over prompts and answers, not a filter over the titles already on screen.** The sidebar only holds a page of recent threads, so a client-side filter can only ever search what is already visible, and titles are the one part of a thread a person is least likely to remember. `runSearchThreads` matches title, prompt, and response content case-insensitively, scoped to the signed-in user, and returns a snippet around the match, labelled "You" or "Answer" so it is clear which side of the conversation matched. The match is marked by weight, never by a rust fill — rust means "you operate this" everywhere else in this app.

**Search opens as a ⌘K palette from anywhere, and from both sidebar states.** The shortcut is registered at shell level, the palette is a `combobox`/`listbox` with a real `aria-activedescendant`, ↑/↓ wrap, and Enter navigates. Idle, it shows the eight most recent threads rather than an empty box. Results carry forward while the next query runs, so the list never blinks empty between keystrokes, and a sequence number drops a slow early response that would otherwise overwrite a newer one. The collapsed rail gets its own search button — a collapsed sidebar is a rail, not a hidden sidebar, and nothing should be reachable only by expanding it first.

**A long title slides its tail into view on hover, and the first version of this was too fast to read.** The technique is in `docs/DESIGN.md`; the correction belongs here.

The original was pure CSS: a fixed `--dur-reveal: 2.2s` meant a 40-character overflow and a 400-character overflow travelled in the same 2.2 seconds, so the long ones — the only titles that need the reveal at all — crossed the rail at a speed no eye can follow. The fix is **constant speed, not fixed duration**, and it costs the "no JavaScript" claim: CSS cannot divide a length by a length, so `translateX` cannot be derived from the overflow distance in a stylesheet. A row measures once on pointer enter (`ThreadTitle`), writes `--slide-shift` and `--slide-dur` as inline custom properties, and the transition reads them. The values are written synchronously in the hover handler, so the measured duration is what the same style pass uses — ordering it through React state would flash the 2.2 s fallback first. `--dur-reveal` survives as exactly that fallback, and the global reduced-motion block still collapses the travel because it sets `transition-duration: 0.01ms !important` on everything.

The measurement is a `Range` over the text node rather than `scrollWidth`, which is not incidental: hovering is the thing that removes the clip, so by the time the handler runs, `scrollWidth` reads back the already-expanded box and reports no overflow at all.

**The collapsed rail's footer is a column, and it used to be a clipped row.** `ThemeToggle` takes an `orientation` prop (`"horizontal"` default, `"vertical"` in the rail) and flips to `flex-col` with `aria-orientation`; `AccountRow` takes `compact` and renders the avatar alone, with the popover `align` following it to `"center"`. The broken version was a `w-9 overflow-hidden` wrapper around a horizontal row — the three theme buttons and the account name were being sheared off at 2.25rem rather than laid out. Every compact branch keeps a real name: an `sr-only` message for the unavailable state, `aria-label`/`title` on the icon-only link and on the avatar trigger.

**The sidebar's own collapse arrow and expand button are gone; the nav toggle is the only one.** Two controls did the same job, and the one in the sidebar header sat next to a `Button` that made the header row read as two competing actions rather than one. `AppSidebar` and `CompactSidebar` no longer take `onToggleSidebar` at all, and the mobile drawer never received it, so nothing reachable lost its way to collapse — `TopBar`'s toggle, immediately before the "New Chat" text, is the single entry point.

#### Build checklist

- [x] Add the authenticated `thread-history` server function and query the user's threads by `updatedAt`.
- [x] Group threads into Today, This week, and Earlier, dropping empty groups.
- [x] ~~Derive each thread's distinct model count from its response rows.~~ Reversed — the count and avatars are gone from the thread list, and the query no longer joins `ModelResponse`.
- [x] Pass history through the TanStack Start root loader into desktop and mobile sidebars.
- [x] Refresh root/thread loaders after creating a thread and after follow-up turns.
- [x] Rank the live free catalog for a title model and generate a real title, cleaned and made unique.
- [x] Watch the first three turns, freeze after that, and lock the title on a manual rename (`Thread.titleLocked`).
- [x] Fall back to the prompt-derived name on every titling failure, silently.
- [x] Vertical three-dot row menu: portalled, dismissable, Delete in `--destructive`.
- [x] Inline rename form with a real check/cancel pair, and a delete confirmation modal instead of `window.confirm`.
- [x] Server-side search over titles, prompts and answers, with snippets, behind a ⌘K palette reachable from both sidebar states.
- [x] ~~Hover reveal for a truncated thread title, JavaScript-free, reduced-motion safe.~~ Corrected — the reveal is constant-speed, so it measures on hover and is no longer JavaScript-free. Reduced-motion safe it still is.
- [x] Fix `aria-labelledby` on the recency group headings (`groupDomId`).
- [x] Fix titling returning no title: drop the small-model heuristic that promoted reasoning-by-default endpoints, raise the output budget to 512, disable reasoning at the call site, and set `maxRetries: 0`.
- [x] Strip an echoed brief label and a doubled title, and reject a moderation verdict, in `cleanGeneratedTitle`.
- [x] Rebuild the collapsed rail footer as a vertical `ThemeToggle` plus an avatar-only `AccountRow`.
- [x] Remove the redundant sidebar collapse arrow and expand button; `TopBar`'s toggle is the only one.
- [x] Automated gate: TypeScript, ESLint, Prettier, contrast (84 pairs, both themes), auth-schema, and production Vite/Nitro build pass.
- [x] `pnpm db:migrate` — confirmed applied: `prisma migrate status` reports 2 migrations found and "Database schema is up to date!", so `Thread.titleLocked` and the `(userId, updatedAt)` index are live.

## Slice 3: Sharing

### 8. Public thread visibility & sharing

> **Built.** The route, the two server-function pairs, the read-only slot and the owner's share dialog all exist and run; the automated gate is green. The write paths were probed with `curl` rather than trusted: an unauthenticated `shareThread` and `revokeShareLink` both return `{status:"signed-out"}` and no slug, and `/share/<wrong-slug>` server-renders the not-found panel carrying `noindex, nofollow` with a loader payload of exactly `{status:"not-found"}`. **The private-window browser pass is still owed** — see the checklist.

An owner can hand someone a link to one thread. That person reads the whole comparison — every prompt, every model's answer, the real numbers, and which one won — without an account, and cannot change anything. This is the first surface in the product that serves a request from someone who is not signed in.

**A secret slug at `/share/$slug`, not a public flag on `/thread/$threadId`.** This was the genuine fork and it was asked rather than assumed. The deciding argument is revocation: a thread's `id` is already in the owner's sidebar, in their browser history, and in the URL bar of every screen-share they have ever done, so a boolean makes a URL that is already loose in the world suddenly readable, and un-sharing then re-sharing hands the same URL back out. A separate `Thread.shareSlug String? @unique` is minted on share and set to `NULL` on revoke, so revoking kills the link for good and re-sharing mints a different one. `/thread/$threadId` stays owner-only forever, which also means **one loader per audience** rather than one loader branching on who is asking — the shape that leaks a field the day someone adds one without thinking about both readers.

**The slug is generated from a CSPRNG, not from `cuid()` and not from the title.** A title-derived slug leaks the subject of a private thread into a guessable URL, and the ids this schema already mints are sequential enough in time to be worth nobody's guessing budget. `crypto.randomUUID()` or 16 random bytes in base64url, minted server-side only.

**Never indexed.** `noindex, nofollow` on the public route. A link handed to one person is not a page on the open web, and PRODUCT.md records that this product has no public traffic and that nothing in it may be presented as a real ranking.

#### Three corrections from building it

**There is no `features/sharing/` folder, because the architecture forbids one.** The checklist below called for exactly that, and it failed `pnpm lint` with six `no-restricted-imports` errors. The rule in `apps/web/eslint.config.js` is that under `src/features/**` a feature may not import `@/features/*` — routes are the only place that composes features — and a sharing folder has to reach into `features/chat` for the transcript and `features/voting` for the winner mark, while `features/shell` has to reach into it for the dialog. That is three wall crossings, not an awkward edge.

The wall is deliberate and the plan broke it, so the structure changed rather than the rule, and the codebase's own answer was already sitting there: the vote slot exists precisely so chat never imports voting. Sharing is not one concern, it is two that happen to share a column:

| Where it landed                                                  | Why                                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `features/chat/get-shared-thread.ts` / `.server.ts`              | reading a thread is a chat concern, whoever is asking                               |
| `features/chat/shared-thread-screen.tsx`                         | it renders `TurnBlock`, which is chat's                                             |
| `features/shell/share-slug.ts`, `share-thread.ts` / `.server.ts` | minting and revoking a link is thread management, next to rename and delete         |
| `features/shell/share-dialog.tsx`                                | it is opened from `ThreadMenu`, which is shell's                                    |
| `features/voting/winner-mark.tsx`                                | it is a vote slot, and voting owns those                                            |
| `routes/share.$slug.tsx` wraps the screen in `VoteSlotProvider`  | the route composes the two, exactly as `thread.$threadId.tsx` injects `VoteControl` |

This is a better shape than the one planned, which is the useful part: the wall did not just reject the design, it named the seam.

**A `STREAMING` row is not rendered as recorded content plus a frozen streaming state.** The paragraph below said that, and `resolveResponse`'s `fromRow` disagrees: it maps a `STREAMING` row to state `"failed"` with a sentence saying the answer was interrupted. That is the more honest render — a row still marked streaming with nobody streaming it was abandoned, not paused — so the behaviour stayed and the plan was corrected. It is also exactly why `onRetry` had to become genuinely absent rather than merely unused: every interrupted row on a public page would otherwise draw a live retry button.

**The write-path table had seven rows and the product has eight.** `POST /api/chat` was missing from it, and it is the one that actually spends the OpenRouter budget — `startTurn` only creates the rows, then `readModelStream` calls the endpoint that streams each model and writes its `modelResponse`. It is unreachable from the public page for a structural reason rather than a cosmetic one: it is only ever called through `ArenaStreamProvider`, which the root layout short-circuits past on `/share/`, so there is no client holding it. The server refuses a signed-out caller with a 401 regardless. The table is corrected below.

#### Four things reading the code changed about this plan

These were found by reading the components a public page would reuse, before writing any of it. Each one changes the build rather than decorating it.

**The winner mark lives inside `VoteControl`, so a public view needs a read-only vote slot, not an absent one.** `ResponseColumn` renders the vote area behind `Vote !== null && vote.state !== "closed"`, and the trophy-plus-the-word-"Winner" `<p className="winner-mark">` is a branch of `VoteControl` itself. Simply omitting `VoteSlotProvider` — the obvious way to make a page read-only — would therefore leave `data-winner` green as the _only_ signal that a model won, which breaks the "never signal with colour alone" rule this project has held since feature 4. So feature 8 adds a `WinnerMark` slot that renders the won state and nothing else, and the public page provides that instead of `VoteControl`.

**`ThreadTranscript` calls `useArenaStream()`, which throws without a provider.** The public page cannot render the transcript without one. `ArenaStreamProvider` already sits at the root and so wraps every route, which is why this works at all — but a public viewer has no business holding a streaming client, and `retry` is reachable through it.

**The retry button renders on any `FAILED` response regardless of the vote slot.** It is inside `ResponseColumn`'s body, guarded only by `response.state === "failed"`. Reusing the component as-is would therefore draw a live "Retry this model" button on a public page, spending the owner's OpenRouter budget on a stranger's click. `onRetry` has to become genuinely absent on a read-only render, not a no-op handler, so the button cannot be drawn at all.

#### Read-only means every write path, enumerated

A shared thread is read-only in the strict sense: **no write permission at all**, not "no obvious buttons". The product has exactly eight write paths, and a public render must reach none of them. Listed because the only way to be sure is to enumerate them rather than trust that a page looks inert:

| Write path          | Reached from                                 | Kept out by                                                     |
| ------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| `startTurn`         | the composer                                 | no composer on the public page                                  |
| `POST /api/chat`    | `readModelStream`, via `ArenaStreamProvider` | no provider on the public route, so no client holds it          |
| `retryResponse`     | `ResponseColumn`'s failed state              | `onRetry` absent, so the button is never drawn                  |
| `castVote`          | `VoteControl` via the vote slot              | `WinnerMark` slot instead — shows the won state, offers no pick |
| `ensureThreadTitle` | `useEnsureThreadTitle` on the thread route   | hook not called on the public route                             |
| `renameThread`      | `ThreadMenu`                                 | no sidebar, no row menu                                         |
| `deleteThread`      | `ThreadMenu` / `DeleteThreadDialog`          | same                                                            |
| share / revoke      | the share dialog                             | owner-checked server-side; the dialog is not on the public page |

**`ensureThreadTitle` is the one worth naming, because it is a `POST` that writes to the database and it hides inside a hook.** `useEnsureThreadTitle(threadId, thread.turns.length)` sits in the thread route's component, so copying that route as the starting point for the public one — the obvious way to build it — carries a write call along with it. It only fires when a stream settles, which will not happen on a static page, and the server refuses a signed-out caller anyway. It still must not be on the page.

**The UI is the first of two locks, never the only one.** Every pre-existing write path already checks a session server-side and scopes by `userId` — verified by reading each one, not assumed — so a hand-made `POST` from a stranger is refused regardless of what is rendered. The public page removing the controls is the first lock; that check is the one that actually holds. Feature 8's own share and revoke functions are owner-checked the same way, and both were probed unauthenticated with `curl`: `{status:"signed-out"}`, no slug, nothing written. `/api/chat` answers a signed-out caller with a 401 and the `SIGN_IN_REQUIRED` sentence.

**One helper came out of this.** The owner check was about to have a third call site, so `infrastructure/session.server.ts` gained `readOwnerId(headers)` — `readSessionState` narrowed to `user.id` or `null`. `thread-actions.server.ts` had a private copy of it and now imports this one.

**The two thread reads share one mapper, so they cannot drift.** `features/chat/thread-turns.server.ts` holds `THREAD_TURNS_SELECT` and `toThreadTurns`, and both `get-thread.server.ts` and `get-shared-thread.server.ts` use it. Two copies of a select block is how the public read eventually grows a column the owner's read added.

**The public page needs different chrome, and the root shell always draws the sidebar.** `__root.tsx` renders `AppShell` with the thread list around every route. `getThreadHistory` returns `[]` for a signed-out reader, so a stranger would get a correct but strange app frame: a full sidebar, an empty "Recent Threads", and nav to Arena and Leaderboard as though the app were theirs. The public route renders its own minimal frame rather than the operator shell.

As built, `RootLayout` short-circuits on `pathname.startsWith("/share/")` and returns a bare `<Outlet />`. That one line does two jobs: it drops the owner's shell, and it leaves the page outside `ArenaStreamProvider`, which is what makes `/api/chat` structurally unreachable rather than merely unused. The frame itself is a 14-unit header — wordmark linking to `/`, hairline divider, thread title as `<h1>`, a "Read-only" badge, theme toggle — the turns, then a bordered footer carrying the snapshot sentence and one "Try your own prompt" link. No scroller: its jump-to-newest affordance is meaningless on a static page.

The root loader still fetches thread history on `/share/`, which looks wasteful and is not. For a signed-out reader it returns `[]` immediately, and for a signed-in one it is exactly the data `/` needs when they click "Try your own prompt" — and with `staleTime: Infinity` the root loader will not run again, so skipping it would hand them an empty sidebar on that navigation. It is a prefetch.

#### What a public viewer sees, exactly

Everything that is true, and nothing that is operable. The full transcript: every turn's prompt, every model's answer rendered the same way the owner sees it, each answer's real ttft / tok-s / tokens / `$0.0000`, failed models still shown as failed, and the winner marked in green _with_ the trophy and the word. No composer, no vote buttons, no retry, no rename, no delete, no model picker. The owner's name and email are not on the page — the thread is shared, the person is not.

**A thread still streaming is a real case.** ~~A `STREAMING` row is rendered as its recorded content plus the "streaming" state, frozen.~~ Corrected above: `resolveResponse` maps a `STREAMING` row to `failed` with an "interrupted" sentence, and that behaviour was kept rather than changed for this page. The public page subscribes to nothing either way — it is a snapshot, not a mirror, and re-reading the link shows the finished answer.

#### Where the owner controls it

In the thread row's existing three-dot menu (`ThreadMenu`) and on the thread screen itself, as a "Share" item opening a small dialog: a read-only input with the URL, a copy button, and a "Stop sharing" action once shared. The dialog is the same `Dialog` primitive `DeleteThreadDialog` already uses. Sharing is a deliberate act with an explicit undo next to it, which is the only honest way to present a control whose whole risk is forgetting it is on.

**`shareSlug` is never exposed to the client except by the owner, on the thread they own.** It is not in `ThreadView`, not in the sidebar's history query, and not in search results.

As built this is a type rather than a promise. `SharedThreadView` is deliberately not `ThreadView` — it is `Readonly<{ title: string; turns: readonly ThreadTurn[] }>`, so there is no field for an owner name, an email, the thread id or the slug to travel in, and adding one would be a visible decision rather than an oversight. The slug reaches exactly one component: the owner's own dialog reads it via `readShareLink` when the dialog opens, and it rides in no route payload. The `/share/$slug` loader returns `{status:"not-found"}` or a thread with those two fields, which is what the SSR payload was confirmed to contain.

**Sharing twice hands back the same link, and both writes use raw SQL.** Re-opening the dialog must not invalidate a link already sent, so `shareThread` returns the existing slug if there is one and mints only when the column is `NULL`. Both statements are `$executeRaw` because `Thread.updatedAt` is `@updatedAt`: sharing is not activity in the thread, and letting Prisma touch it would yank the thread up into "Today" in the owner's sidebar for an act the reader never sees. Each is scoped by `id` _and_ `userId`, and the mint additionally by `"shareSlug" IS NULL`, so the guard is in the statement rather than in a prior read.

#### Build checklist

- [x] `Thread.shareSlug String? @unique` plus a migration; applied by hand against Neon and `prisma migrate status` confirming three migrations and "Database schema is up to date!".
- [x] ~~`features/sharing/`:~~ share and revoke in `features/shell/share-thread.ts` / `.server.ts` (owner-checked) and the read by slug in `features/chat/get-shared-thread.ts` / `.server.ts` (no session required). The folder split is corrected above — a single `features/sharing/` folder is forbidden by the feature-wall lint rule.
- [x] A `WinnerMark` read-only vote slot, so a public page marks the winner with icon and word rather than colour alone. `sealVotes` in `infrastructure/turn-vote.ts` drops every open vote to closed while keeping a winner a winner, so the slot has nothing votable to render.
- [x] Make `onRetry` absent rather than inert on a read-only render, so no retry button is drawn for a public viewer. `TurnBlock` takes a `sealed` flag and passes `onRetry={undefined}`; `ResponseColumn` guards the button on `onRetry !== undefined`, so it cannot be drawn at all.
- [x] Do not call `useEnsureThreadTitle` on the public route — it is a `POST` that writes, carried along by copying the thread route. The public screen is its own component rather than a copy of the thread route, so the hook was never in reach.
- [x] Walk the write-path table above against the built public page and confirm each one is unreachable. Done by reading every path's server guard; the table gained an eighth row (`/api/chat`) in the process, recorded above.
- [x] `/share/$slug` route with its own minimal frame, `noindex, nofollow`, and a real not-found state for a revoked or wrong slug. Both the robots meta and the not-found panel confirmed in the server-rendered HTML.
- [x] Share dialog in `ThreadMenu` and on the thread screen: copy the link, see that it is live, stop sharing. On the thread screen it is a ghost icon button in the top bar's trailing slot, beside the win pills.
- [x] Confirm the public page renders for a genuinely signed-out reader, and that a revoked slug 404s. A wrong slug server-renders the not-found panel, verified by `curl`; the happy path and a genuinely revoked link were confirmed by hand in a private window.
- [x] Confirm `shareSlug` never reaches the client anywhere except the owner's own share dialog. Enforced by `SharedThreadView` having no field for it, and the `/share/` SSR payload was read to confirm it carries only `title` and `turns`.
- [x] Automated gate: typecheck, lint, Prettier, contrast, auth-schema, production build, and the Impeccable detector. All green.
- [x] **Needed a person, and was done:** a real browser pass in a private window — the shared link opens signed-out, shows the winner and the numbers, offers nothing operable, and dies after the link is revoked. Plus one `curl` of a write server function with no session cookie: `shareThread` and `revokeShareLink` both answered `{status:"signed-out"}`, refused at the server rather than only hidden in the UI.

## Slice 4: Leaderboard

### 9. Leaderboard: global & personal

> **Built.** The screen now reads the votes table. `DEMO_STANDINGS` and `DemoBadge` are deleted, the standings come from real aggregates, and the global scope is verified against the real seven votes — see the record at the end of this section. Three defects were caught while planning rather than after shipping, and all three are recorded below in place: a failed answer had to count as a loss, two failure codes had to be excluded from that rule, and a retried answer had to not double-count its battle. The personal tab's browser pass is done; the whole feature is verified.

The leaderboard is the reason the vote exists. Every other feature collects evidence; this one is the only place that reports it. That makes it the feature where an honest number matters most and where a flattering one would do the most damage, because a ranking is the one thing on this site a reader would take away and repeat.

**The screen is already built, against six fabricated rows.** `features/leaderboard/leaderboard-screen.tsx` renders the toggle, the table and the win-rate bar, and it reads `DEMO_STANDINGS` — a model at "won 507 of 700" that has never been voted on, behind a `<DemoBadge />`. Every structural decision in the sketch is therefore already made and does not need remaking: Global / Personal toggle, then a table of `#`, Model, Win rate (percentage + bar + "Won N of M"), Avg. to first token, Avg. tokens/sec. Feature 9 is not a new screen. It is the same screen, told the truth.

#### What counts as a battle, and why a failure is a loss

**A battle is a voted turn the model was in. A win is that turn's vote naming it.** Not a head-to-head pair. Three models answer one prompt and one vote is cast, so the pairwise reading would score two comparisons per vote and invent a number the vote never expressed. The turn is the unit the product actually measures, "Won N of M" in the sketch is a count of turns, and `winRatesFor` in `features/chat/thread-win-rates.tsx` already scores per-thread wins exactly this way. Elo and pairwise ranking stay out; they are a different product and they need volume this one does not have.

**A failed answer counts as a battle and loses it, and this is a correction to the first version of this plan.** That version said a failure is not a loss, on the reasoning that a model which never answered cannot have lost a comparison. PRODUCT.md's principle settles it the other way: "A failed call is recorded as a real row, not dropped. A model that dies often must not be able to outrank one that answers slowly but always finishes." Counting only completed answers as battles produces precisely that inversion — a model that answers one turn in ten and wins it reads 100% and ranks first, above a model that answered all ten and won five. So a model in a voted turn is in a battle whether or not it produced text, and PRODUCT.md's measured third of all free-tier calls failing is what makes this the difference between a real ranking and a fiction. `winRatesFor` had already made the same call: its denominator is voted turns in the thread, with no status filter.

A model that has only ever failed therefore appears with real battles, zero wins, and no speed numbers. That row is the most useful one on the page and it exists because of this decision.

**Two failures are not losses, and this was found by reading the write sites rather than the enum.** `ResponseStatus` has only `STREAMING | COMPLETE | FAILED`, so "failed" on its own is too coarse to score. The real distinction is in `ModelResponse.failure`, which carries one of four codes from `features/chat/response-failure.ts`:

| Code                | Written when                                         | Counts as a battle? |
| ------------------- | ---------------------------------------------------- | ------------------- |
| `PROVIDER`          | the model was asked and the call failed              | yes, and loses it   |
| `INTERRUPTED`       | a `STREAMING` row abandoned, or retried mid-stream   | yes, and loses it   |
| `CANCELLED`         | the reader pressed stop                              | **no**              |
| `MODEL_UNAVAILABLE` | not on the free list, so `start-turn` never asked it | **no**              |

`CANCELLED` is excluded because DESIGN.md already rules on it: "Cancelling is never counted against a model. A stopped answer keeps whatever text arrived and is stored as cancelled rather than failed, because stopping is the reader's choice." It is stored as `FAILED` with `failure: "CANCELLED"` (`stream-model-response.server.ts`), so a status-only query would silently count the reader's own interruption against the model — the exact thing that rule forbids. `MODEL_UNAVAILABLE` is excluded because `start-turn.server.ts` writes it at row-creation time for a model that is no longer on the free list: it was never asked, never streamed, and cannot have lost a comparison. Both were about to be counted as losses by the first version of this plan.

**A retry adds a row, so battles count models per turn, not rows.** `retry-response.server.ts` marks the old row `INTERRUPTED` and `create`s a _new_ `ModelResponse` for the same turn and model. A `groupBy` counting rows would therefore hand a retried model two battles for one vote. `infrastructure/response-order.ts` already solves this for the screen — `latestAttempts` keeps the last row per `modelId` — and the leaderboard has to agree with it, or a thread's own win pills and the leaderboard would report different denominators for the same thread.

**This is why wins and battles are folded in memory rather than aggregated in SQL.** Prisma's `groupBy` cannot express "the latest attempt per model per turn, excluding two failure codes", and forcing it into raw SQL would put the product's scoring rule somewhere the type checker cannot see it. So `standings.server.ts` reads the voted turns with their responses and folds them with the same `latestAttempts` the screen uses — which is also what `winRatesFor` does per thread, so the two cannot drift. At 7 votes against a `THREAD_HISTORY_LIMIT` of 50 this is trivially cheap; it is a fold over voted turns, and the honest limit is that it stops being appropriate somewhere in the low thousands of votes, at which point the scoring rule wants a materialised column rather than a cleverer query. Written down rather than discovered later.

**Speed stays in SQL.** A `COMPLETE` row is unambiguous — no code to exclude, and a superseded attempt that completed is still a real measurement of the model — so the two speed averages are a real `groupBy` with `_avg`.

**Speed is averaged over every completed answer, not only voted ones.** Time to first token and tokens per second are measurements of the model, not expressions of the vote, and there are hundreds of completed responses against seven votes. Restricting them to voted turns would throw away almost all the evidence for no gain in honesty. A model with no completed answer has no speed to report and shows "—" rather than a zero, because zero milliseconds is a claim and absence is a fact.

**A 0-of-0 record is not a 0% win rate.** A model with completed answers but no votes yet has an undefined rate, not a bad one. Those rows sort last, show "—" in both the rank and the win-rate cell, and still carry their real speed numbers. This is arithmetic rather than a policy: `0/0` has no value, and rendering it as 0% would state something false about a model nobody has voted on.

**Personal scope filters by two different owners, deliberately.** Wins and battles filter on the vote's `userId` — your ranking is built from votes you cast. Speed filters on the thread's `userId` — the timings you actually observed, which includes turns you never voted on. Same row, two different owners, because the two halves answer different questions and scoping speed to voted turns would discard most of one person's own data. Documented here because it looks like an inconsistency and is not.

#### Rank everything, label the volume

This was the genuine fork and it was asked rather than assumed, because PRODUCT.md forbids presenting a standing as real: "The 7 votes and 37 threads in the database are one person testing the build, which is enough to prove the vote path and nowhere near enough to rank a model — so no leaderboard standing, win rate or ranking may be presented as real."

Three ways to satisfy that were offered: a minimum-battles floor with everything below it listed but unranked; ranking everything with the volume stated plainly; or leading with speed and withholding win rates until volume exists. **The answer was to rank everything and label the volume.**

So the numbers are computed and shown, ordered, with a plain statement of how thin the evidence is sitting directly above the table. The compliance argument is that nothing is presented as real that is not: the wins are real votes, the rate is honest arithmetic on them, and the one thing PRODUCT.md forbids — a reader taking "100%" as a finding — is prevented by saying so in the reader's line of sight rather than in a footnote. A demonstration badge would now be the dishonest option, because the data stops being demonstration data the moment it comes out of the votes table.

The notice is not a badge and not an `alert` — nothing has gone wrong. It is a panel above the table, stating the vote count and that the count is too low to rank on:

- **Global, below the threshold:** "7 votes so far — not enough to rank a model." Body: these are real wins off real votes, but at this volume one vote moves a model from 0% to 100%; the order is honest, not yet stable.
- **Personal, below the threshold:** the same, counting only your votes.
- **Global, no votes at all:** "No votes yet." The speed columns are still real and still shown; the ranking begins at the first vote.
- **Personal, signed in, no votes:** the existing `EmptyPersonal` copy, which already says exactly this.
- **Personal, signed out:** a sign-in prompt. `/leaderboard` has no session guard and `NAV_ITEMS` shows it to everyone, so a signed-out reader reaching the personal tab is a real case, not a hypothetical.

`MEANINGFUL_VOTE_COUNT = 100` is the threshold at which the notice stops rendering. It is a judgement call, not a statistical result, and it is a constant with a comment saying so rather than a number buried in a comparison.

#### Where it lives

One feature folder, the project's usual `.ts` / `.server.ts` split, no new architecture:

| File                                          | What                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `features/leaderboard/standings.ts`           | `StandingRow`, `Standings`, `winRateOf`, `rankStandings`, `MEANINGFUL_VOTE_COUNT`, the `getStandings` fn |
| `features/leaderboard/standings.server.ts`    | `runGetStandings` — the Prisma aggregates and the session read                                           |
| `features/leaderboard/leaderboard-screen.tsx` | unchanged structure, fed by the loader instead of `DEMO_STANDINGS`                                       |
| `features/leaderboard/vote-volume-notice.tsx` | the panel above the table, used by both views                                                            |
| `routes/leaderboard.tsx`                      | gains a loader and a `LoaderErrorNotice` failure state                                                   |

**Deleted, not left behind:** `features/leaderboard/demo-standings.ts` and `components/ui/demo-badge.tsx`. The badge has exactly one call site, this one, so it becomes dead code the moment the data is real. Keeping fabricated rows behind a flag is how a demo row eventually renders in production.

`view-toggle.tsx` is untouched.

**One server function returns both scopes.** `getStandings` answers `{ global, personal }` with `personal: null` when signed out, so the toggle is instant and does not fetch. Signed out, the personal queries are skipped entirely rather than run and discarded. The route loader's `staleTime` stays at the default, so casting a vote and then navigating to the leaderboard reads fresh rows with no invalidation wiring.

#### The queries

One fold and two aggregates per scope, no raw SQL, issued in one `Promise.all`:

- **Voted turns, read and folded** — `turn.findMany({ where: { vote: { isNot: null } }, select: { vote: { select: { winnerResponseId: true } }, responses: { orderBy: { createdAt: "asc" }, select: { id, modelId, modelName, status, failure } } } })`, plus `vote: { is: { userId } }` for personal. Then per turn: `latestAttempts(responses)`, drop the rows whose `failure` is `CANCELLED` or `MODEL_UNAVAILABLE`, count each surviving model one battle, and award the win to whichever row's `id` matches `winnerResponseId`. The win is matched on the **row id, not the model id**, because that is what `Vote` actually stores.
    - One consequence worth naming: if a reader voted for an answer and _then_ retried that model, the winning row is no longer the latest attempt, so the win would vanish from a strict latest-attempts fold. The fold therefore keeps the winning row in the battle set even when a later attempt supersedes it — the vote is a fact about a row that existed, and a later retry does not un-cast it.
- **Speed** — `modelResponse.groupBy({ by: ["modelId", "modelName"], where: { status: "COMPLETE" }, _avg: { ttftMs: true, tokensPerSecond: true } })`, plus `turn: { thread: { is: { userId } } }` for personal.
- **Total votes** — `vote.count()`, scoped by `userId` for personal. This is the number the notice reads, and it is a count of votes rather than a sum of battles.

The display name comes from the response rows themselves rather than the live catalog, so a model that leaves the free tier keeps its record. The cost is that a provider renaming a model splits its history into two rows; at this volume that is worth accepting and worth writing down.

The roster is the union of the folded turns and the speed group merged on `modelId`, not either one alone — a model with only failures is missing from the speed group, and a model never voted on is missing from the fold. Both are real rows.

`_avg` on `ttftMs` returns a float to round; `tokensPerSecond` is `Decimal?` and returns a `Decimal` needing `Number()`. Prisma returns `null` for an average over no rows, which is the "—" case rather than a zero.

A read failure returns a `{ status: "failed" }` shape and the route renders `LoaderErrorNotice`, matching `get-shared-thread`. No raw provider or database error reaches the screen.

#### Build checklist

- [x] `features/leaderboard/standings.ts`: the row and view types, `winRateOf` returning `null` at zero battles, `rankStandings` sorting by rate then battles then name with unranked rows last, and `MEANINGFUL_VOTE_COUNT`.
- [x] `features/leaderboard/standings.server.ts`: the voted-turn fold (`latestAttempts`, the two excluded failure codes, the win matched on row id and kept even when superseded), the two speed aggregates, the roster union, personal skipped when signed out, and a caught failure that returns a status rather than throwing.
- [x] Wire `routes/leaderboard.tsx` to a loader with a `LoaderErrorNotice` failure state.
- [x] Feed `LeaderboardScreen` from the loader; delete `demo-standings.ts` and `components/ui/demo-badge.tsx`. Both deleted; the badge had exactly one call site.
- [x] Handle the real cells: `null` win rate as "—" with no bar, `null` speed as "—", unranked rows last with "—" for rank.
- [x] `vote-volume-notice.tsx` for both scopes, plus the signed-out personal state that `NAV_ITEMS` makes reachable.
- [x] Invoke `frontend-design` and `impeccable` on the notice and the changed cells before writing them — new visual pattern, shared classes into `styles.css` rather than copy-pasted utilities.
- [x] Confirm a failed-only model actually renders with battles, zero wins and no speed numbers, since that row is the whole point of the failure-is-a-loss rule. **Inkling Small is exactly that row** and it renders correctly: `wins:0, battles:3, ttftMs:null, tokensPerSecond:null` in the SSR payload, rendering as "0%", "Won 0 of 3", and `—` for both speed columns. It ranks 4th, below every model that actually finished an answer, which is the rule working.
- [x] Update DESIGN.md: the `DemoBadge` entry and the honesty-rules line that names the leaderboard's Global table as demonstration data, which stops being true with this feature. The component entry is now `VoteVolumeNotice`; the honesty rule is now "no surface shows demonstration data any more" plus a new rule stating thin real data is labelled rather than hidden. Also added the failure-is-a-loss rule, which shaped the whole scoring model and was not written down anywhere.
- [x] Automated gate: typecheck, lint, Prettier, contrast, auth-schema, production build, Impeccable detector. All green. One wrinkle worth recording: the running dev server rewrites `routeTree.gen.ts` in its own style (single quotes, no semicolons), so `format:check` fails on a generated file until it is re-formatted with the server stopped. Not caused by this feature.
- [x] **Needed a person, and was done:** a browser pass against the real seven votes — global and personal both, signed in and signed out — confirming the numbers match the database and that no row claims more than it has. Confirmed working as expected.

#### What it actually reports, against the real database

Verified by `curl` of the SSR payload on a running dev server (no test runner, no browser automation). Global scope, seven real votes:

| #   | Model              | Record   | Rate | Avg. TTFT | Avg. tok/s |
| --- | ------------------ | -------- | ---- | --------- | ---------- |
| 1   | MiniMax M3         | 5 of 5   | 100% | 4920 ms   | 76.0       |
| 2   | Dots3-Note Preview | 1 of 2   | 50%  | 3763 ms   | 68.4       |
| 3   | Nemotron 3 Ultra   | 1 of 6   | 17%  | 13592 ms  | 38.9       |
| 4   | Inkling Small      | 0 of 3   | 0%   | —         | —          |
| 4   | Ox Alpha           | 0 of 3   | 0%   | 15390 ms  | 25.1       |
| 6   | GLM 5.2            | 0 of 2   | 0%   | 7274 ms   | 327.99     |
| —   | 4 further models   | no votes | —    | measured  | measured   |

Three things in that table are the plan's corrections proving themselves, and they are the reason to keep the record here:

- **Wins sum to exactly 7, battles to 21.** Seven votes, three models asked per turn. If the retry correction were missing, a retried model would have shown two battles for one vote and the battles column would not have divided by three.
- **Ranks 4, 4, 6.** Inkling Small and Ox Alpha are genuinely tied at nought of three, so they share rank 4 and the next row is 6. Sequential numbering would have claimed an order the votes never expressed.
- **Inkling Small ranks below Ox Alpha's equal record and above nothing at all, with `—` for both speed columns.** It is the failed-only model: three battles, no completed answer, so no speed to average. It cannot climb by failing, and it cannot be given a zero it did not measure.

The notice above the table reads "**7 votes** so far — not enough to rank a model", and disappears on its own at `MEANINGFUL_VOTE_COUNT`. The four models with speed but no votes sort last with `rank: null`, reading `—` for rank and "No votes yet" for rate: measured on speed, silent on merit.

Accessibility of the dash: every `—` carries an `sr-only` label, because an em dash announces as nothing. The payload confirms 4 × "Unranked", 2 × "Not measured", 4 × "No votes yet".

One verification note for whoever picks this up: `grep` treats this minified single-line SSR HTML as binary and silently reports nothing without `-a`. Two of my own greps lacked it and appeared to show a feature returning no wins at all, which sent me looking for a defect that was never there. Always `grep -a` against this payload. React's `<!-- -->` text separators also break naive patterns like `>100%<`.

## Slice 5: Paid models and a business

This slice is the first one that overturns a foundational rule rather than extending it. Up to feature 9, "every model in this app is free tier, cost will always read $0.0000" was a law in `CLAUDE.md`, a capability line in `PRODUCT.md`, and a hard filter in `infrastructure/model-catalog.ts`. It is now wrong on purpose: the app supports paid OpenRouter models, and the money to pay for them comes from subscription plans sold through Dodo Payments.

**The rule it replaces, stated once so nothing quietly contradicts it later:** cost is a real measured number that is usually not zero. A free model still reads $0.0000 and that is still correct, still shown, and still not a bug. What changes is that $0.0000 stops being the only value the column can hold, and the app now has to be right about a number it is spending its own money on.

Three features, in this order, because each one is safe to ship on its own:

- **10** teaches the catalog about paid models and makes cost a measured number. Paid models become browsable on `/models`; the arena stays free-only, so nothing can spend money yet.
- **11** adds plans, the per-tier answer allowances and the server-side gate. Paid models become selectable, but only for a user whose subscription row says so — and no row can be bought yet, so this is testable by writing one by hand.
- **12** wires Dodo so a real person can actually buy a plan.

Shipping 10 before 11 is not an accident of ordering, it is the safety property: **the arena cannot reach a paid model until the gate that pays for it exists.**

### 10. Paid models in the catalog and the arena

#### What the live catalog actually looks like

Read directly from `https://openrouter.ai/api/v1/models` on 2026-09-28, because a snapshot is never a fact and this one is only here to size the problem:

| Reading                                 | Count |
| --------------------------------------- | ----- |
| Models in the catalog                   | 458   |
| Free (prompt and completion both `"0"`) | 21    |
| Paid                                    | 437   |
| Paid, text in and text out              | 424   |

Compare feature 5's readings — 337 / 14 free, then 413 / 16 — and the shape of the change is clear: **the free list is a rounding error and the paid list is the catalog.** A page built for 21 cards is about to be handed 424, and that is the single biggest structural consequence of this feature.

Three things in the live paid data that the current code gets wrong, all found by reading the real response rather than reasoning about it:

- **Some models price at `-1`.** `openrouter/fusion`, `openrouter/pareto-code`, `typesafe/jev-router` and `openrouter/bodybuilder` report `"-1"` for prompt and completion — they are routers that pick a model per request, so their price is not knowable in advance. `parsePrice` returns `-1`, which is not `0`, so the current free-only filter rejects them by luck. The moment the filter inverts they become "paid models with a negative price", and every cost estimate built on them is nonsense. **Reject any model whose prompt or completion price is negative**, explicitly and with a comment saying why.
- **`:batch` variants are listed alongside the real thing.** `openai/gpt-oss-20b:batch`, `z-ai/glm-5.3:batch`, `openai/gpt-5.2-pro:batch` and others are cheaper because they are not interactive. The arena streams an answer a reader watches arrive; a batch endpoint cannot do that. **Reject any id ending in `:batch`.**
- **Image-output models are in the paid list in numbers the free list never had** — `google/gemini-3-pro-image`, `openai/gpt-5.4-image-2`, `google/gemini-2.5-flash-image`. `isArenaEligible` already screens architecture and currently fails open, which was the right call against 21 models where a wrong rejection cost a whole tab. Against 437 it is the wrong default: a fail-open eligibility check now admits a model that will return an image part the stream reader drops on the floor, and the reader sees an answer that never arrives. **Eligibility keeps failing open on a missing `architecture` block, but a present-and-explicit non-text output modality is now a rejection.**

#### Free and paid are one catalog with a tier on each row

`freeModelCatalog()` becomes `modelCatalog()` and stops filtering by price. Each `CatalogModel` gains a tier, computed from the row's own pricing rather than from a list of names, because a pinned list of model ids is exactly the snapshot this project refuses to keep:

| Tier       | Rule (cost of one reference answer)          | Examples at today's prices                                                                                                    |
| ---------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `FREE`     | prompt and completion both zero              | the 21 free models                                                                                                            |
| `STANDARD` | ≤ $0.0025                                    | `deepseek/deepseek-v4-flash`, `google/gemini-3.1-flash-lite`, `openai/gpt-5-mini`, `meta-llama/llama-4-scout`                 |
| `ADVANCED` | ≤ $0.0150                                    | `x-ai/grok-4.3`, `anthropic/claude-haiku-4.5`, `openai/gpt-5.1`, `anthropic/claude-sonnet-5`, `google/gemini-3.1-pro-preview` |
| `FRONTIER` | ≤ $0.0500                                    | `moonshotai/kimi-k3`, `openai/gpt-5.4`, `anthropic/claude-opus-5`, `openai/gpt-5.5`                                           |
| —          | above $0.0500: **browsable, not selectable** | `openai/gpt-5.5-pro`, `openai/o1-pro`, `anthropic/claude-opus-4.1`, `anthropic/claude-fable-5`, `openai/gpt-4`                |

The three thresholds are one constant each with a comment, not numbers buried in a comparison, and they are judgement calls in exactly the way `MEANINGFUL_VOTE_COUNT` is.

**`ARENA_PRICE_CEILING` at $0.05 an answer is not a fourth rejection rule — it is the line between the catalog and the arena**, and it is here because of feature 11 rather than for its own sake. The nine or so models above it — the `-pro` reasoning variants, `o1-pro` at **$0.66 an answer**, and a couple of expensive legacy rows — span 13× among themselves, and a per-tier answer allowance has to be priced against the most expensive model a tier contains. Leaving them selectable would drag every plan's Frontier allowance down to protect against models almost nobody picks. Every flagship stays: `claude-opus-5` at $0.027 and `gpt-5.5` at $0.032 are comfortably inside. What leaves the arena is the top of the top, and it leaves with a plain reason rather than silently. Recorded in "Consider to build onwards" as a later add-on rather than a permanent no.

**They stay in the catalog and stay on `/models`.** This is the one place where "rejected" would have been the easier code and the wrong product: `/models` exists to say honestly what OpenRouter actually offers, and dropping the nine most expensive rows from a browsing page to make our own pricing simpler is exactly the flattering omission this project refuses. So `CatalogModel.tier` is `ModelTier | null`, where `null` means above the ceiling; the row renders on `/models` with both real prices and a plain "Not in the arena" label, and the arena reads a filtered view that drops `tier === null`. **The filter lives on the server in `start-turn.server.ts`, not only in the picker** — same reasoning as feature 6's fail-closed check on `/api/chat`, because a disabled control is a UI state and not a permission.

**The tier is a label, a filter, and the counter an answer is charged to. It is not a gate on the catalog.** Reasoned through and rejected: gating `FRONTIER` behind the top plan would make the upgrade ladder legible, but `PRODUCT.md` already rules that "the comparison is the product — anything that makes two answers harder to read against each other is a regression, whatever else it adds." Blocking a model from a comparison is the purest form of that regression, and it is not needed: feature 11 gives **every paid plan an allowance in every tier**, differing in size rather than in reach. A plan buys quantity, not a shorter catalog.

#### The reference answer, measured off our own rows

Every price in this plan is quoted as the cost of one answer, and that needs a real token shape. It was read out of our own database rather than assumed — 140 completed responses that reported tokens:

| Statistic       | Prompt | Completion |
| --------------- | ------ | ---------- |
| Mean            | 395    | 1,029      |
| Median          | 89     | 473        |
| 90th percentile | 1,101  | 2,424      |
| Max             | —      | 8,970      |

**The reference answer is 400 prompt / 1,000 completion tokens**, the mean rounded, because cost accrues on the mean and not the median. The first draft of this plan assumed 900 / 700 and was wrong in the direction that matters: real answers are completion-heavy, roughly 2.6 output tokens for every input token, and completion is the expensive side of every price pair in the catalog. Using 900 / 700 would have understated the cost of `claude-sonnet-5` by 23% and overstated `deepseek-v4-flash`'s by 4%, which is the kind of error that sets a budget wrong in the expensive direction only.

Two honest caveats on that shape, written here so they are not rediscovered later. The mean is dragged up by reasoning models emitting thousands of tokens, which is a real cost and belongs in the mean. And the prompt mean of 395 is measured against short threads; deep follow-up threads grow the prompt every turn, so the input side of this shape will drift upward as real usage arrives. **The reference shape is a constant to be re-measured from `model_response` once paid rows exist, not a fact.**

#### Cost stops being a hardcoded zero

`computeMetrics` currently ends with `costUsd: 0`, and `MetricsInput` has no cost field at all. That was correct when every model was free and is now the single most important lie in the codebase. Feature 11 does not enforce against this column — it counts answers per tier — but this column is how anyone ever finds out whether those allowances were priced correctly, so it has to be right.

**The real number comes from OpenRouter, through the provider, and this was verified in the installed package rather than assumed.** `@openrouter/ai-sdk-provider@3.0.0` declares `OpenRouterUsageAccounting` with `cost?: number` and `costDetails?: { upstreamInferenceCost: number }`, and its stream implementation attaches it to the finish part as `providerMetadata.openrouter.usage`. `ai@7.0.66` exposes `result.providerMetadata` as a promise on the `streamText` result. So `stream-model-response.server.ts` gains one `await` beside the `await result.usage` it already does, reads `openrouter.usage.cost`, and threads it into `computeMetrics` as an input rather than a constant.

One correction to carry forward from the research, because it contradicts most of what is written about this online: **`usage: { include: true }` and `stream_options: { include_usage: true }` are deprecated no-ops.** OpenRouter always returns usage now. Nothing needs to be enabled, and any code added to enable it is dead.

**When the provider does not report a cost, the number is derived and says so.** A derived cost is measured tokens multiplied by the live catalog's price for that model — two real numbers and an arithmetic step, which is honest but is not the same thing as the provider telling us what it charged. `ModelResponse` gains `costEstimated Boolean @default(false)` so the app can never present a derivation as a measurement. This follows straight from `PRODUCT.md`'s "one measured number, one place it came from": if there are two possible provenances, the row records which one it was.

**Cost is recorded at list price, not at what OpenRouter actually charges us.** Buying OpenRouter credits with a card costs 5.5% on top (minimum $0.80), so our true cost is about 1.055× every number on screen. Passing that through to the displayed cost would put a number on the screen that no OpenRouter price page agrees with, for no gain in honesty. The 5.5% lives in feature 11's margin arithmetic instead, and the screen and the ledger keep showing the same one value.

#### The `/models` page: two tabs over 445 cards

The tabs are **Free** and **Paid**, as asked, using the same control the leaderboard uses. That control has to move first: `features/models/*` cannot import `features/leaderboard/view-toggle.tsx`, because the ESLint `no-restricted-imports` wall forbids a feature importing another feature, and routes are the only composition seam. **`view-toggle.tsx` moves to `components/ui/view-toggle.tsx`** and the leaderboard's import is updated. This is a direct correction to feature 9's closing line, "`view-toggle.tsx` is untouched" — true then, not true now.

What changes on the page beyond the tabs:

- **The Paid tab needs a text filter, and this is required rather than nice to have.** 424 cards with no way to find `claude-sonnet-5` is not a page, it is a scroll. The Free tab keeps working with no filter at 21 cards, and the filter renders on both for consistency.
- **Paid cards sort by cost ascending, cheapest first; the Free tab keeps its context-window sort.** Feature 5 sorted by context window because on a free list price is not a differentiator. On the paid list it is the only differentiator that matters, and cheapest-first is the order someone comparing value actually wants.
- **The price row shows both numbers.** `pricePerMTokens` today is the prompt price alone, formatted to four decimals. For a free model, where both sides are zero, that is harmless. For `claude-sonnet-5` it reports $2.00 and hides the $10.00 that three quarters of the real cost comes from. It becomes two numbers — in and out per million tokens — plus the cost of one reference answer, which is the number a reader can actually reason about. A correction to feature 5, recorded rather than edited away.
- **A tier chip on every paid card**, and the header copy loses "all free tier".
- **`formatContextLabel` is unchanged** and still floors rather than rounding up.

#### The arena picker

The picker shows free and paid together, each paid entry with its tier and its cost-per-answer. For a user without a paid plan, a paid entry is **disabled with a plain sentence saying why, plus a link to plans** — it does not vanish. That is the convention the three-model ceiling already set ("the add-model control is disabled with a plain sentence saying why rather than vanishing") and there is no reason for this to behave differently.

**A single turn may mix free and paid models, deliberately.** This is not a fork worth asking about: "is the paid one actually better than the free one" is the single most useful question this product can answer, and it is answerable only by putting them side by side in one turn on one prompt. Forbidding the mix would remove the best reason the paid tier exists.

**The gate is enforced server-side in `runStartTurn`, and the picker's disabled state is a courtesy.** A disabled control is a UI state, not a permission. `start-turn.server.ts` is the one write path that creates a turn, and it is where a request naming a paid model without a plan to pay for it has to be refused — otherwise a hand-written `POST` spends our money.

#### The leaderboard gets a second toggle

Settled rather than left open: **Free and Paid become sub-tabs beside Global and Personal.** One table with a tier column was the recommendation and was not taken; the split is the decision, and what follows is what it actually costs and how each cost is paid down.

**The tab a row belongs to comes from `ModelResponse.tier`, not from the live catalog.** The leaderboard is a historical aggregate, and `standings.server.ts` today aggregates on `modelId` alone — it has no notion of price at all, which is why this needs deciding rather than falling out. Reading the tab off the live catalog would let a model that has just gone from free to paid carry its entire free-tier win record into the Paid tab, and would drop every delisted model out of both tabs even though its votes really happened. The tier recorded on the row is a fact about the call that was actually made, so it is the one that partitions. This is the second reason feature 10 writes `ModelResponse.tier`; the first was the allowance counter.

A model with rows on both sides therefore appears on both tabs, each with the record it earned under those conditions. That is rare, it is honest, and it needs no tie-breaking rule anyone would have to remember.

**The cost of the split, stated plainly because it does not go away.** A turn may mix free and paid models, so each model's battle lands in its own tab while the vote that decided it does not. On the Free tab, "won 0 of 3" can mean a paid model won, and the winner is not on the page. The split cannot fix that; it can only be honest about it, so **each tab carries a one-line note saying that battles include turns decided by models on the other tab.** Real, measured, and not flattering — which is the same standard `VoteVolumeNotice` already holds.

Two things that make the split cheaper than it looks:

- **The tier goes in the Model cell as a chip, not in a sixth column.** Inside the Paid tab the spread is 31× — `gemini-3.1-flash-lite` at $0.0016 against the $0.05 ceiling — so a Paid table with no cost signal at all would be worse than the merged table this replaces. As a chip it costs no column, so `PRODUCT.md`'s three leaderboard metrics and feature 9's refusal of a sixth column both stand untouched. The Free tab needs no chip: every row on it is free.
- **The Free tab is the default**, and stays byte-identical to what feature 9 built and verified. A signed-out visitor on a public page is the common case, votes will be overwhelmingly free-tier for a long time, and it means the split adds a surface rather than changing one.

Two consequences to build rather than discover:

- **Four states, two independent toggles**, both held in search params so a view is linkable, and both keyboard-operable. This is the second use of `ViewToggle<T>` on one page, which independently confirms the move to `components/ui/view-toggle.tsx` was the right call rather than a tidy-up.
- **Personal + Paid is empty for every user until they vote on a paid turn**, which is a genuinely new empty state and not a variant of an existing one. It gets the same treatment as feature 9's other empty states: a plain sentence about what would fill it, not a spinner and not a zero.

`ALLOWANCE_SPENT` joins `CANCELLED` and `MODEL_UNAVAILABLE` in the excluded-failure set, for the reason already given in feature 11: our billing ceiling is not a fact about the model. `FREE_TIER_EXHAUSTED` is excluded on the same grounds.

#### What the build actually found

Five corrections, all caught while building rather than after, and all of them changed the plan above rather than being worked around.

**The arena had to stay free-only, and the first wiring of it was wrong.** The plan said feature 10 makes paid models browsable while "the arena stays free-only, so nothing can spend money yet", and then the same plan told `startTurn` and `/api/chat` to validate against a ceiling-filtered catalog that includes paid models. Those two cannot both be true: with no gate until feature 11, a hand-written `POST` naming `claude-opus-5` would have passed the server check and spent real money. The send paths now read **`arenaModels()`, which filters to free**, with the widening to `tier !== null` named in its own doc comment as feature 11's job. One function, one line to change, and the safety property lives where the money is spent instead of in a sentence in this file.

**Thread titling would have quietly spent money on every new thread.** `thread-title.server.ts` does not take a model id — it ranks the whole catalog and calls up to four of them to name a conversation. Repointing it at the shared catalog would have billed us for naming threads. It reads `freeCatalog()` explicitly, with the reason in a comment, because this is the kind of call site that looks like a read and is actually a spend.

**`:batch` rejection is load-bearing, not hygiene.** Measured against the live list: **75 of 464 rows are `:batch` variants**, each shadowing a model already in the catalog. Without the filter the paid tab would have been half duplicates.

**Six rows quote a negative price**, all of them routers (`openrouter/auto`, `openrouter/fusion`, `typesafe/jev-router`). The tokenizer check already caught them, but a model we cannot cost is now rejected on price as well — two independent nets, because this is the value every allowance is priced against.

**Thirteen models sit above the ceiling, not "nine or so".** The live distribution at build time, after the eligibility filters: **17 free, 199 standard, 101 advanced, 21 frontier, 13 above the ceiling** out of 351 comparable rows. The newcomers since the plan was written are `gpt-5.4-pro`, `o3-pro`, `o1`, `gpt-6-astra`, `gpt-6-astra-pro` and `claude-fable-5.1`. A snapshot, as always — the count is re-derived from price on every refresh and nothing is pinned.

#### What the build decided, that the plan left open

**The tier chip encodes price without a colour ramp.** Rust means "you operate this", green means won, red means failed, and blue/indigo/purple are banned outright, so a four-step hue scale was never available. But the more interesting reason is that it should not be: **a brightness or saturation ramp rising with price would imply dearer is better, which is the single claim this product exists to test.** The chip is therefore a neutral ladder — muted, then outlined at the functional 3:1 edge, then inverted — and the word is always present. Above the ceiling it reads "Not in arena" on a dashed edge, so the state carries a second non-colour signal.

**`ViewToggle` gained a `radio` mode, because two crossed toggles over one panel are not two tablists.** Scope (Global/Personal) genuinely swaps panels and stays a `tablist`. Pricing (Free/Paid) filters what is inside the panel, so its `aria-controls` would have pointed at an element that does not exist. It is now a `radiogroup`, which is the same distinction `ThemeToggle` already makes, and both modes share one keyboard implementation rather than two.

**Vote counts are per tab.** `VoteVolumeNotice` states what a table is worth, and a single scope-wide count would have had an empty Paid tab claiming all of the free tier's votes as its evidence. A vote now only counts toward a tab that it actually has a model in.

**`ModelResponse.tier` defaults to `FREE`**, which is the truthful backfill rather than a convenience: every row that existed before the column could only have been a free model, because nothing else could be sent.

#### Build checklist

- [x] `infrastructure/model-catalog.ts`: `modelCatalog()` replacing `freeModelCatalog()`, the `ModelTier` union and its three threshold constants, `ARENA_PRICE_CEILING_USD` as a `tier: null` marker rather than a rejection, `arenaModels()`/`arenaCatalog()`/`freeCatalog()` as the three views, the reference-answer cost, negative-price rejection, `:batch` rejection, non-text output rejection, and both prices on the row.
- [x] `features/chat/start-turn.server.ts`: reads `arenaCatalog()` and records `tier` on every row it creates.
- [x] `features/chat/retry-response.server.ts`: reads `arenaCatalog()` and re-reads the tier from the catalog rather than copying the superseded row's.
- [x] `/api/chat`: its catalog re-check moved off the free list, and it now hands the catalog's own per-token prices to the stream as the cost fallback.
- [x] `features/chat/thread-title.server.ts`: `freeCatalog()`, explicitly, so titling cannot spend.
- [x] `features/chat/model-response-metrics.ts`: `costUsd` is a real input with a derived fallback; `MetricsInput` gained `reportedCostUsd` and `prices`, and the result gained `costEstimated`.
- [x] `features/chat/stream-model-response.server.ts`: reads `providerMetadata.openrouter.usage.cost` defensively, derives from catalog price when absent, records both.
- [x] `chat-stream-protocol.ts` and `thread-turns.server.ts`: `costEstimated` carried through the wire schema and the reload path, so a reloaded answer and a live one still report the same thing.
- [x] Prisma: `ModelTier`, `ModelResponse.costEstimated`, `ModelResponse.tier`, `pnpm db:generate`.
- [x] Migration applied to Neon. Hand-written rather than generated — `prisma.config.ts` sets no `shadowDatabaseUrl`, so `migrate dev` and `migrate diff --from-migrations` both refuse, and the SQL here is two additive columns with defaults plus one enum. Applied with `migrate deploy`; `migrate status` reads clean.
- [x] Move `view-toggle.tsx` to `components/ui/`, and add the `radio` mode it needed.
- [x] `features/leaderboard/standings.server.ts`: the fold and both speed aggregates partitioned by the row's `tier`, the voted turns read once and folded twice, and per-tab vote counts.
- [x] `features/leaderboard/leaderboard-screen.tsx`: the second toggle, Free as the default, the tier chip in the Model cell on Paid only, the cross-tab battles note, and the Personal + Paid empty state. Both toggles in search params, defaults stripped.
- [x] `features/models/models-screen.tsx`: Free/Paid tabs, text filter, tier chip, the "Not in arena" label, both prices plus reference-answer cost, per-tab sort, header copy.
- [x] `styles.css`: `.tier-chip`, `.field-input`, `.price-pair` / `.price-value` as shared classes rather than copy-pasted utilities.
- [x] Invoked `frontend-design` and `impeccable` before writing any of it.
- [x] `PRODUCT.md` and `DESIGN.md` corrected where feature 10 made them false — the free-tier capability line, the `/models` and leaderboard descriptions, the audience inference that leaned on the free tier, the do-not-fabricate list, and a new DESIGN.md section for the tier chip and the toggle's second mode.
- [x] Automated gate: typecheck, lint, Prettier, contrast (84 pairs, both themes), auth-schema, production build, and a grep of `.output/public` for secret values. All green.
- [ ] Impeccable mechanical detector over the changed UI files. **Not yet run** — the command was repeatedly refused by this session's tool sandbox, so it is outstanding rather than passed.
- [ ] **Needs a person:** browse `/models` on both tabs in a real browser, keyboard-only through the tabs and the filter, and confirm a paid model is visible and correctly priced against OpenRouter's own page. Then `curl` `startTurn` naming a paid id and confirm the server refuses it.

**Moved to feature 11:** the model picker's paid entries, disabled-with-a-reason. There is no plan concept in feature 10 and the arena is free-only, so there is nothing yet to show as disabled — building the control now would mean building it against a gate that does not exist. The excluded-failure additions (`ALLOWANCE_SPENT`, `FREE_TIER_EXHAUSTED`) move with it, since feature 11 is where those codes are created.

### 11. Plans, allowances, and the quota gate

#### What a plan actually sells

Four plans, as asked, shaped like Claude's ladder. **What a plan sells is a monthly allowance of answers in each tier** — so many Standard, so many Advanced, so many Frontier, each its own counter, refilling when the subscription renews.

**The unit is one answer from one model, not one prompt.** This is the first thing to get right and it is easy to get wrong. A prompt in this app fans out to up to three models, so "a message" would cost us 1× or 3× depending on what the picker happened to be set to, and a unit whose price triples silently is not a unit anyone can plan around. An answer is what we pay for and an answer is what is counted, so a three-model turn spends three. The composer says exactly that before the send: "3 Advanced answers, 197 left."

**This was chosen over a dollar spend budget, and the tradeoff is real and worth stating.** A spend budget is the metering that is automatically correct for every model at once; an allowance is the one people can read off a pricing page and plan a month around. The cost of the allowance is that cost varies inside a tier, so the allowance has to be priced against the most expensive model the tier contains. Two consequences follow directly, and both are load-bearing rather than incidental:

- **The `$0.05` arena ceiling in feature 10 exists because of this.** The `-pro` reasoning models span 13× among themselves and would have set the Frontier price single-handedly.
- **Headline allowances are smaller than a spend budget would have shown**, and in exchange they are a floor rather than an average: **the reader who picks the single most expensive model in every tier, every time, and burns every last answer, is still profitable.** That is a guarantee, not a projection, and it is the kind of claim this project prefers.

| Plan | Price | Dodo fee | Net revenue | Standard | Advanced | Frontier | Worst-case inference cost | Worst-case gross margin |
| ---- | ----- | -------- | ----------- | -------- | -------- | -------- | ------------------------- | ----------------------- |
| Free | $0    | —        | $0          | —        | —        | —        | $0.00                     | —                       |
| Pro  | $20   | $1.60    | $18.40      | 1,200    | 200      | 40       | $8.44                     | ≈54%                    |
| Pro+ | $50   | $3.40    | $46.60      | 3,000    | 600      | 90       | $22.16                    | ≈52%                    |
| Max  | $100  | $6.40    | $93.60      | 6,000    | 1,200    | 200      | $45.37                    | ≈52%                    |

Free gets the free models and no paid allowance at all.

**How those numbers were derived, so they can be re-derived when prices move.** Each tier is priced at its ceiling — $0.0025, $0.0150, $0.0500 an answer — and the three allowances are chosen so their total lands on a worst-case list spend of $8 / $21 / $43. Multiply by OpenRouter's 1.055 credit fee for the true cost, subtract from net revenue, and the margin column falls out. Worked for Pro: 1,200 × $0.0025 = $3.00, 200 × $0.0150 = $3.00, 40 × $0.0500 = $2.00, total $8.00 list, $8.44 true, against $18.40 net — **54%, and $9.96 of contribution per subscriber at the worst case the plan permits.**

#### Monthly and annual, and the one thing annual breaks

Every paid plan is sold on both intervals, toggled on `/plans` the way Claude and OpenAI do it. **Annual is two months free** — the convention, and the one discount a reader can verify by multiplying rather than believing:

| Plan | Monthly | Annual | vs 12× monthly | Dodo fee (once) | Net revenue | Worst-case inference | Worst-case gross margin |
| ---- | ------- | ------ | -------------- | --------------- | ----------- | -------------------- | ----------------------- |
| Pro  | $20     | $200   | −$40           | $12.40          | $187.60     | $101.28              | ≈46%                    |
| Pro+ | $50     | $500   | −$100          | $30.40          | $469.60     | $265.92              | ≈43%                    |
| Max  | $100    | $1,000 | −$200          | $60.40          | $939.60     | $544.44              | ≈42%                    |

**Two of those inference figures were wrong, and the build found it.** When `worstCaseFor()` was written against the allowances above, Pro+ annual computed $265.86 and Max annual $544.38, not the $265.92 and $544.44 the table carried. The original arithmetic rounded the monthly figure before multiplying by twelve, and $21.00 × 1.055 = $22.155 rounds two ways. The build multiplies the true monthly figure by twelve and rounds once, which is the honest order — the same figures the `/plans` page now shows. The margins move by less than a tenth of a point and the conclusions do not change, but a table that states dollars to the cent should have cents that compute.

**Still profitable at the worst case on every rung, which was the condition**, but visibly thinner than monthly's 52–54% and that is worth seeing rather than averaging away. Part of the discount comes back structurally: Dodo's flat $0.40 is charged once a year instead of twelve times, which is $4.40 returned on every annual subscriber regardless of plan.

**Annual bills once; the allowance still refills monthly.** Twelve months of Frontier handed over on day one is a cash-flow hazard rather than a generous gesture — we would have taken one payment and owe a year of inference to anyone who wants it in a fortnight — and it is not what Claude or OpenAI do either. An annual subscriber gets the same monthly numbers a monthly subscriber gets; what they bought is twelve months at a lower rate.

**That is the thing annual breaks, and it is in the schema rather than the copy.** The rule written below — that a `BILLING` period is bounded by Dodo's own `current_period_start` and `current_period_end` — is correct for monthly and wrong for annual, where those bounds are a year apart and would hand out a 12× allowance by accident. The correction, stated once:

- **The allowance period is always a month.** For a monthly subscription it coincides with the Dodo period, exactly as before.
- **For an annual subscription it is a monthly slice anchored on `current_period_start`'s day-of-month**, rolling forward eleven times inside the paid term without any payment event to trigger it.
- **So the period roll cannot be webhook-driven.** A monthly plan gets a `subscription.renewed` every month and an annual plan gets one every twelve, so the eleven intermediate rolls have no event behind them. `UsagePeriod` is therefore opened lazily on first use — the upsert that increments a counter creates the row for whichever monthly window `now` falls in — rather than being created ahead of time by a webhook. This is simpler than a scheduled job and has no cron to fail silently, which is the failure mode that would be least visible.
- **Month-end anchoring needs one explicit rule**, since a subscription starting on the 31st has no 31st in February. The window ends on the last day of the month when the anchor day does not exist, which is the same rule every billing system settles on and the same one Dodo applies to the annual charge itself.

`Subscription` gains an `interval` of `MONTHLY` or `ANNUAL`. It is read for two things only: which Dodo product a checkout points at, and how the monthly window is derived. **The allowances themselves do not vary by interval** — Pro is 1,200 / 200 / 40 a month whether it was paid for monthly or annually, which keeps the plan table above the single source of truth for what a plan gives.

Both fee figures are real and read off the vendors' own pricing pages. Dodo charges 4% + $0.40 on a domestic US card, +0.5% for a subscription and +1.5% for a card outside the US, so **6% + $0.40 is the conservative basis used here** and a US subscriber is slightly better than modelled. OpenRouter adds 5.5% (minimum $0.80) on credit purchases and takes **no markup on inference at all**.

**Realised margin will be well above the worst case, for two independent reasons, and neither is guessed at here.** Models sit below their tier ceiling — `claude-sonnet-5` is $0.0108 against the Advanced ceiling of $0.0150, and `x-ai/grok-4.3` is $0.0030, a fifth of it — and allowances are not fully consumed. Both effects are multiplicative and both are measurable from `ModelResponse.costUsd` once real rows exist, which is precisely why feature 10 makes that column honest. **No expected-margin number is stated here, because inventing one would be exactly the flattering estimate this project refuses.**

What the allowance buys, read as three-model turns, which is how the arena is actually used:

| Plan | Standard turns | Advanced turns | Frontier turns |
| ---- | -------------- | -------------- | -------------- |
| Pro  | 400            | 66             | 13             |
| Pro+ | 1,000          | 200            | 30             |
| Max  | 2,000          | 400            | 66             |

Excluding fixed infrastructure — Neon, Vercel, PostHog, Arcjet, the domain — which is a flat monthly floor rather than a per-subscriber cost. At Pro's worst-case $9.96 contribution, a $50–$100 floor means **break-even between 5 and 10 Pro subscribers, or 2 to 4 on Pro+**, and better than that in practice. That is the number to actually care about, and it is small.

**Three counters, and nothing spills between them.** An exhausted Advanced allowance does not start eating Standard, and an unused Standard allowance does not top up Frontier. Downward spill — spending an Advanced unit on a Standard answer — would be strictly cheaper for us and was still rejected: it turns three legible counters into one fungible pool, which is a spend budget wearing a disguise, and it makes "how many Advanced answers do I have left" unanswerable. Three numbers, three plain sentences when one runs out.

**No overage and no top-ups in this slice.** Running out of a tier is a hard stop on that tier with a plain sentence and an upgrade link; the other two tiers keep working. Dodo can charge on demand, but it carries a $1 minimum per charge and a second billing path to get right, and a surprise charge is the opposite of this product's voice. Recorded as deliberately left out, not forgotten.

#### Cost per answer is still shown, in dollars, on every answer

The allowance is what limits a reader; it is not what the product claims to measure. Every answer keeps displaying its own real measured cost in dollars, free ones included at $0.0000, because `PRODUCT.md`'s voice section is unambiguous — "never sell the numbers, never apologize for them, never hide a zero." A reader can therefore add up what their month actually cost and compare it to what they paid.

**That does not extend to publishing our margin, and an earlier build of `/plans` got this wrong.** The sentence above used to end by calling the markup "a feature rather than an exposure", and on that basis every plan card carried our worst-case inference cost, our contribution and our gross margin percentage. It was removed after seeing it rendered. The honesty rule is about **the numbers the reader is buying** — what an answer cost, measured, to four decimal places — not about our unit economics, which answer a question no buyer asked, hand a competitor our cost base, and invite a price objection in exchange for nothing. The distinction, stated so it cannot drift again:

- **Published, on every answer and on `/plans`:** the measured cost of a real answer, and the per-answer ceiling each tier was priced against. Both are facts the reader needs to judge what a plan is worth.
- **Internal, and nowhere in the UI:** inference cost per plan, contribution, and margin. These live in `plans.ts` (`worstCaseFor`), in `scripts/reconcile-usage.mjs`, and in the tables in this document — all of which exist so the pricing can be re-derived when prices move, which is a thing we do, not a thing we show.

What this rules out is a **credit** unit — some invented currency that is neither a dollar nor an answer. The allowance counts answers, which is a real thing; the cost column counts dollars, which is a real thing. Nothing in between gets invented.

#### Free, and the cap that is not ours

The free plan gets the free models and nothing else. It costs us nothing per answer, but it has a ceiling that belongs to OpenRouter and not to us, and it is much tighter than it looks:

**OpenRouter limits free models to 50 requests per day per account, rising to 1,000 per day once the account has bought at least $10 of credits.** That is **per account, which means app-wide across every free user at once** — not per user. At 1,000 a day and three models a turn, the entire free tier of this product is about 330 turns per day, shared. Seventeen enthusiastic free users would saturate it.

Two consequences, both of which have to be built rather than hoped about:

- **A per-user daily cap on free answers, set at 60**, so one user cannot eat the shared pool. This also gives the free plan a real, statable limit instead of an invisible cliff.
- **A plain sentence for the day the shared pool runs dry**, which is a different failure from a model rate-limiting us. A new `RESPONSE_FAILURE.FREE_TIER_EXHAUSTED` is written only when the provider error identifies the account's own free-model daily limit, and like `MODEL_UNAVAILABLE` it is **excluded from the leaderboard**, because our billing ceiling is not a fact about the model. The exact shape of that 429 body cannot be confirmed from the docs and **must be read off a real response before the code trusts it** — until then it falls through to the existing `PROVIDER` sentence, which is wrong but safe.

**`FREE_TIER_EXHAUSTED` ended up meaning both ceilings, and that is the better reading.** The paragraph above scoped it to OpenRouter's app-wide pool, but the built gate writes it for _our_ per-user 60-a-day cap as well — that is the ceiling the gate can actually see, since it is a counter we own. Keeping them as one code is honest rather than lossy, because what a reader needs to be told is identical in both cases: free answers are gone for today, they come back at midnight UTC, and paid models are unaffected. That is what the sentence says. The provider-side half is still **not detected** — a real 429 body has yet to be read — so the shared pool running dry continues to fall through to `PROVIDER`, exactly as the paragraph above allows. When that body is finally captured, it writes the same code and needs no new sentence.

There is a pleasant side effect worth writing down: selling even one Pro plan means buying credits, which lifts the free tier's app-wide ceiling from 50 a day to 1,000. **The paid plans are what make the free plan usable at all.**

#### Where the counting happens

Two different things are counted, and conflating them is the mistake to avoid. **What the gate enforces is a count of answers per tier.** **What proves the plans were priced correctly is `ModelResponse.costUsd`**, which stays the source of truth for money and is never enforced against. The allowance is the product; the dollar column is the audit.

Summing either per request would mean joining `model_response → turn → thread` to reach a `userId` on every prompt, so there is a **derived rollup that is reconcilable rather than authoritative**:

```prisma
enum Plan { FREE PRO PRO_PLUS MAX }
enum SubscriptionStatus { ACTIVE PAST_DUE ON_HOLD CANCELLED EXPIRED FAILED }
enum ModelTier { FREE STANDARD ADVANCED FRONTIER }
enum UsageScope { DAILY BILLING }

model UsagePeriod {
  id          String     @id @default(cuid())
  userId      String
  scope       UsageScope
  periodStart DateTime
  periodEnd   DateTime
  freeAnswers Int        @default(0)
  standard    Int        @default(0)
  advanced    Int        @default(0)
  frontier    Int        @default(0)
  spentUsd    Decimal    @default(0) @db.Decimal(12, 6)
  @@unique([userId, scope, periodStart])
  @@map("usage_period")
}
```

`ModelTier` is the same enum feature 10 writes onto `ModelResponse.tier`; it lands with that migration and is repeated here only so this block reads on its own.

**The `scope` discriminator is why this is one table and not two.** A `BILLING` row covers **one month of allowance**, and the section above is what defines its bounds: for a monthly subscription that is Dodo's own `current_period_start` and `current_period_end`; for an annual one it is a monthly slice anchored on that start's day-of-month. Either way the three tier counters are what the gate reads. A `DAILY` row is bounded by the UTC day and only `freeAnswers` matters. Same upsert, same increment, one code path — and the unique key is `[userId, scope, periodStart]` precisely because a user has both kinds of row live at once.

**Rows are opened lazily, by the increment itself.** Nothing schedules them and no webhook creates them, because the eleven intermediate months of an annual term have no payment event behind them. The first answer of a window creates that window's row; a user who sends nothing in March simply has no March row, which reads correctly as zero.

`spentUsd` is carried on both and **enforced on neither.** It exists so that summed `costUsd` can be compared against the allowances actually charged, which is the only way anyone ever learns whether the ceiling pricing above was right or whether a tier boundary has drifted. That reconciliation is a script a person runs, not an assumption the schema makes.

```prisma
model Subscription {
  id                 String             @id @default(cuid())
  userId             String             @unique
  plan               Plan
  status             SubscriptionStatus
  dodoSubscriptionId String             @unique
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean            @default(false)
  pastDueEndsAt      DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  @@map("subscription")
}
```

`Subscription` is a **cache of access state, never a record of money.** Dodo is the authority on what was paid; this row only answers "what may this user do right now", and it is written only by a verified webhook. A user with no row is on Free — absence is the free plan, not an error.

#### The gate: reserve at the start, refund what never happened

An allowance can be enforced exactly, which a spend budget could not, because the unit is known before the call rather than after it. So the gate is hard rather than soft, and the whole of it is one rule: **reserve the unit when the answer is created, give it back only if the answer never really happened.**

**The reservation goes inside the `$transaction` that `runStartTurn` already opens.** That transaction creates the thread, the turn and the `ModelResponse` rows together; incrementing the tier counters in the same statement makes the check and the charge atomic, so two tabs sending at the same instant cannot both spend the last unit. A gate that read the counter first and wrote it later would have exactly that race, and it would be invisible until it was a refund request.

Per-model, not per-turn, mirroring how the arena already treats a missing model. A turn where one of three tiers is exhausted starts the other two; that model's row is created `FAILED` with a new **`RESPONSE_FAILURE.ALLOWANCE_SPENT`**, and like `MODEL_UNAVAILABLE` it is **excluded from the leaderboard**, because our billing ceiling is not a fact about the model. Only when every selected model is blocked is the turn refused outright, which is the path `TURN_MODELS_GONE` already established.

The refund rule, stated once so it cannot drift:

| Outcome                                    | Unit           | Why                                                          |
| ------------------------------------------ | -------------- | ------------------------------------------------------------ |
| `COMPLETE`                                 | spent          | We paid for it and the reader got it.                        |
| `PROVIDER` failure                         | refunded       | Nobody should pay for a model that fell over.                |
| `MODEL_UNAVAILABLE`, `FREE_TIER_EXHAUSTED` | refunded       | It never reached a provider.                                 |
| `ALLOWANCE_SPENT`                          | never reserved | The gate is what created the row.                            |
| `CANCELLED`, `INTERRUPTED`                 | **kept**       | Tokens were really generated; a stop button is not a refund. |

A retry costs a fresh unit, because a retry is a fresh call. `CANCELLED` keeping its unit is the one line here a reader might argue with, and it is deliberate: the answer was streaming, OpenRouter billed us for what had been produced, and the same cost lands in `costUsd`. Refunding it would make the counter a thing to game.

**`INTERRUPTED` was added to that last row during the build, because the code had it refunding and that was wrong.** It is written in exactly one place — `retry-response.server.ts`, when someone retries an answer that is still streaming — so it describes the same situation `CANCELLED` does: a stream that had already started, tokens that were really generated, a provider that really billed us. The distinction between the two is who pressed what, which is not a billing fact. `earnsRefund` now lists `PROVIDER`, `MODEL_UNAVAILABLE` and `FREE_TIER_EXHAUSTED` and nothing else.

The refund happens in `recordOutcome`, which stops being a fire-and-forget `update` and becomes a small transaction that writes the response row, decrements the counter when the outcome earns a refund, and adds `costUsd` to `spentUsd` either way.

**There is a third refund site, which this plan originally missed.** `recordUnavailable` in `chat-endpoint.server.ts` marks a row `MODEL_UNAVAILABLE` when the model was delisted in the gap between the reserve and the stream opening. A unit had already been taken and the answer never reached a provider, so by the table above it must be refunded, and it was a bare `update` that did not. It is now the same transaction as the other two.

**Which period a refund credits is resolved when the stream opens, not when it ends.** `chargeForReservation` reads the subscription once at the top of `/api/chat` and hands the resulting `Charge` down to `streamModelResponse` as data. Deriving it at outcome time instead would have had a real bug behind it: a renewal webhook landing while an answer streamed rewrites `currentPeriodStart`, and `allowanceWindow` would then resolve the row's `reservedAt` into the _new_ window — refunding a month that was never charged and leaving the one that was charged short. Reading it at the start also keeps `streamModelResponse` about streaming rather than about billing, and costs a free-tier answer no query at all, since its ledger is the UTC day.

`MAX_ARENA_MODELS` stays at 3, so no single turn can reserve more than three units.

#### What the composer says before a send

A turn can mix tiers deliberately — that is the whole reason paid models exist here — so one send can spend from three different counters at once. **The composer carries a compact chip beside the models (`3 models · 2 paid`) and the three counters live on `/settings/billing`**, rather than a sentence enumerating every counter under the composer.

That is the quietest option and it buys the composer's vertical space back. It also opens two holes, and neither is acceptable left open, so both are closed here rather than noted:

**"2 paid" cannot tell a Frontier answer from a Standard one**, which is exactly the moment a reader would want to know — Frontier is the scarcest counter on every plan, 40 a month on Pro against 1,200 Standard. So **the chip stays compact until the send actually matters and escalates when it does**: at the point where this send would take a counter to zero it says so in words (`3 models · 2 paid · last Frontier`). Quiet by default, loud exactly once, and never a colour — the two reserved colours mean won and failed, and running out is neither.

**The detailed allowance lives on Billing on every screen size.** The account menu in the sidebar or mobile drawer opens `/settings/billing`, where paid-tier and free-daily meters remain visible. The composer chip remains the immediate carrier at the point of sending, including the last-answer warning; moving the detailed counters out of the sidebar does not remove that warning.

**The model-stack popover carries a tier chip per model.** The detail belongs at the point of choice, which is where someone is deciding what this turn costs, and it is one interaction away rather than permanently on screen.

#### Arcjet stays, and becomes plan-aware

`HOURLY_MODEL_CALLS = 30` is an abuse ceiling, not a product limit, and the allowance does not replace it — a Max subscriber with 7,400 answers in hand can still be a runaway script, and burning a month of allowance in an afternoon serves nobody. One memoised Arcjet instance per plan, since `tokenBucket` fixes its capacity at construction:

| Plan | Bucket              |
| ---- | ------------------- |
| Free | 30/hour (unchanged) |
| Pro  | 120/hour            |
| Pro+ | 300/hour            |
| Max  | 600/hour            |

`screenPrompt` already charges `requested: input.models`, which is correct per-answer accounting and needs no change beyond picking the right instance.

#### Build checklist

- [x] Prisma: `Plan`, `SubscriptionStatus`, `UsageScope`, `BillingInterval`, `Subscription`, `UsagePeriod`, migration applied, `pnpm db:generate`.
- [x] `infrastructure/plans.ts`: the four plans, their three allowances each, both interval prices, the free daily cap, and the tier ceilings the allowances were priced against — one file, all constants, each carrying the arithmetic that produced it. The `(plan, interval) → Dodo product id` map waits for feature 12, where the ids exist.
- [x] `infrastructure/billing-window.ts`: the monthly allowance window — identical to the Dodo period on monthly, a day-of-month-anchored slice on annual, with the short-month rule. Pure, and **verified against ten cases** including that the clamp does not compound (a 31st anchor gives Feb 28 and then recovers Mar 31) and that the final window of an annual term is clipped to the term rather than rolling past it.
- [x] `infrastructure/entitlement.server.ts`: the plan, the live `BILLING` window and the live `DAILY` window for a user; absence means Free. `effectivePlan` reads Dodo's statuses the way Dodo means them — `past_due` keeps access to its grace date, `cancelled` to the end of the period already paid for, everything else is Free.
- [x] `scripts/check-auth-schema.mjs`: taught to recognise a one-to-one **back-reference** as a relation rather than a column. `Subscription.user` carries the `@relation`, so `User.subscription` has only a type — and the check called it an undeclared column on an auth table. Fixed by treating any field typed as another model as a relation, which is what the script's own comment always said it did. Still 30 fields checked, so no coverage was traded away.
- [x] Reserve inside `runStartTurn`'s existing `$transaction` — per model, atomic with the row it creates. The retry path reserves too, since a retry is a fresh call.
- [x] `recordOutcome` becomes a transaction that refunds on `PROVIDER`, `MODEL_UNAVAILABLE` and `FREE_TIER_EXHAUSTED`, keeps the unit on `CANCELLED`, and adds `costUsd` to `spentUsd` in every case. Also keeps it on `INTERRUPTED`, and `recordUnavailable` was folded in as the third refund site — both corrections are written up above.
- [x] `RESPONSE_FAILURE.ALLOWANCE_SPENT` and `RESPONSE_FAILURE.FREE_TIER_EXHAUSTED`, their sentences, and their exclusion from the leaderboard fold alongside `CANCELLED` and `MODEL_UNAVAILABLE`. **The exclusion was the half that had been missed**: `response-failure.ts` exported the four-code list and nothing imported it, while `standings.server.ts` kept its own two-code `NOT_A_BATTLE` — so a blocked answer was counting as a loss against the model. There is now one `notTheModelsFault(failure)` predicate, taking the column's own `string | null`, and no second list for a future code to drift out of.
- [x] `infrastructure/arcjet.ts`: one memoised instance per plan.
- [x] Composer: the compact `N models · N paid` chip, escalating in words when a send would take a counter to zero. Model-stack popover carries a tier chip per model, and a row that cannot be sent says why in its provider line — the picker's own precedent of disabling with a sentence rather than hiding. The chip is the trigger's own label rather than a second element, so it is one control carrying more truth, and it is the always-visible allowance surface below 48rem, where the sidebar becomes a drawer.
- [x] Detailed allowance meters now live on `/settings/billing` (October 25 UI refinement), reached through the account menu on desktop and mobile. Neutral fills deplete with remaining answers; exact remaining and used/total figures accompany each semantic `meter`. Exhaustion is stated in words. Free readers see their daily allowance; paid readers see all three monthly tiers and the separate free-daily allowance. The composer retains its immediate last-answer warning.
- [x] `/plans`, display-only: four plans, the three allowances each buys, the monthly/annual toggle, and the per-answer tier ceilings. Moved here from feature 12, because every blocked state in this feature needs somewhere to send a reader; feature 12 adds the buy button to a page that already exists. **Standalone, and built as one joined panel from a pinned reference.** The shell does not render here (the same bypass `/share` uses), because a pricing page is not a tool; the sidebar nav carries no `/plans` row, since a row that makes the sidebar vanish on click would read as a glitch — it is reached from Billing and every blocked state instead. The plans are a single bordered panel split by hairlines into three horizontal bands — head, call to action, what's included — and **the bands are CSS subgrid rows**, so they line up across all four columns however long a tagline runs. That alignment is the whole point: it is what makes four plans comparable at a glance, and matching min-heights would have drifted the first time copy changed. The call to action is the band itself, a full-width row with the label left and an arrow right, not a pill in a padded box. Pro is featured, marked by a tab that hangs above the panel, a raised `--muted` surface, and the rust fill on its own row — rust on a button is an allowed use, and the other two meaning colours were never available here since green means winner and red means error. Buttons are `disabled` with a plain note that checkout opens when billing goes live: a dead button is honest, a missing one is a dead end. **No margin arithmetic on the page** — see the correction above. Allowances and prices are still computed from `plans.ts` at render time, never typed into JSX. **The one rounded figure on the page, and why it is allowed to be:** the list's headline row sums the three tier allowances, which lands on 1,440 / 3,690 / 7,400 — figures that read as oddly precise for a top-line. It rounds to the nearest hundred and carries a `~` (`~1,400`, `~3,700`, `~7,400`). This does not touch the exactness rule, because that rule governs **measured** values — cost, tokens, latency — and a plan's total allowance is a product parameter rather than a measurement. The exact per-tier counts sit in the three rows directly beneath it, so nothing is hidden and the `~` stops the aggregate from claiming a precision it was never carrying. **Responsive, and the tab is why it needed care:** four columns to two below 64rem to one below 40rem, with the panel dissolving into separate cards. As a direct child of the column grid the tab silently became a fourth row and pushed the featured column's bands out of line with its neighbour — it now lives inside the head band, absolutely placed into a slot that every head band reserves in the two-up band, and in flow above the title in one column, where there is nothing to line up against. **Design history, kept because it explains the shape:** arithmetic-as-hero editorial rows (chosen in the plan interview) → `/models`' ModelCard vocabulary → this joined panel, each rejected in a real browser before the next was tried.
- [x] Invoke `frontend-design` and `impeccable` before writing the meter, the composer line, or any upgrade surface. Both invoked via the Skill tool, `impeccable`'s `context.mjs` run against the target, `craft-floor.md` loaded before editing UI. The mechanical detector then ran over every changed UI file — zero findings, exit 0.
- [x] Reconciliation script: sum `costUsd` per period, compare it to `spentUsd`, and compare both against what the tier counters imply was charged. `scripts/reconcile-usage.mjs`, run as `pnpm reconcile:usage` from `apps/web` — plain text, one block per period, reads and never writes, exits 0 even on findings because it is a report rather than a gate. **Verified end to end against the real database**: a throwaway user was driven through the real `reserveOne`/`settleCharge`/`earnsRefund` code paths (reserve → counter 1, COMPLETE keeps the unit and accumulates `spentUsd` 0.012345, PROVIDER refunds, CANCELLED and INTERRUPTED keep theirs, free answers open a DAILY period), the script reported the BILLING period **OK**, and every probe row was then deleted. The probe's DAILY-period MISMATCH lines were the probe's own artifact — its second response carried `createdAt` inside the day but was charged to BILLING, which no real send can do, since the two scopes are only ever written by the charge each tier actually belongs to.
- [x] Automated gate, then re-measure the reference answer shape from `model_response` and correct the tier ceilings and allowances here if it has moved. **Re-measured against the 140 completed rows: avg 395 prompt / 1,029 completion tokens against the 400 / 1,000 reference — 1.2% and 2.9% off, and the completion:prompt ratio reads 2.60 against the 2.5 the shape implies. The shape holds; the tier ceilings and allowances stay as they are.** To be redone once paid rows exist, since every row so far is free-tier and $0.0000 — the re-measure only proves the free half of the ladder.
- [ ] **Needs a person:** browser pass on `/plans` (monthly + annual toggle, both themes), the billing allowance meters with a real subscription, and the picker's tier chips and blocked sentences. Then the original list: confirm a paid model becomes selectable, send a real paid turn, check the recorded `costUsd` against OpenRouter's own activity page, and set a tier counter to its limit to confirm the other two tiers keep working.

### 12. Dodo Payments: checkout, portal, webhooks

#### What is being wired

`@dodopayments/better-auth@1.6.6` with `dodopayments@2.52.0`. The plugin's peer range is `better-auth@^1.4.0` and the installed version is 1.6.26, so it fits.

This lands far more cleanly than a payments integration usually does, for one reason: **the plugin mounts inside Better Auth, and Better Auth is already mounted.** Checkout, the customer portal and the webhook receiver all appear under `/api/auth/*`, which `routes/api.auth.$.ts` already forwards wholesale. **No new route file, and no new public endpoint to secure.**

Four sub-plugins, three of which are used: `checkout` for the purchase, `portal` for the customer's own billing management, `webhooks` for the truth. **`usage` is not used** — Dodo can meter events and hold credit balances, but our metering is a sum of a column we already write, it is synchronous, and it is the authority on our own spending. Dodo's meters reject events older than an hour and would give us a second version of the truth that can disagree with the first. Recorded as a deliberate no.

`createCustomerOnSignUp: true`, so a Dodo customer exists before anyone reaches checkout.

#### The schema consequence, and the check that will catch it

The plugin adds **one field to the `user` table: `dodoCustomerId`.** No new tables. That one field will break `pnpm check:auth-schema`, and it is worth knowing why before it happens rather than after: the script calls `getAuthTables({})` with **no plugins**, then fails any column on an auth table that Better Auth did not declare — "an undeclared column on an auth table will not be written". A plugin-added column is exactly that case.

**The fix is to pass the configured plugin list into `getAuthTables`, not to loosen the check.** The check's value is that it knows what Better Auth expects; handing it the real plugin list keeps it truthful, while adding an exception would blind it to the next real mistake.

#### Products live in Dodo's dashboard

Plans are not defined in code. **Six** subscription products are created in Dodo's dashboard — three plans × two intervals, because a Dodo product carries its own price and payment frequency and one product cannot be both — and referenced by id, so six more environment variables, all fail-fast in `infrastructure/env.ts`:

| Variable                       | What                               |
| ------------------------------ | ---------------------------------- |
| `DODO_PAYMENTS_API_KEY`        | server API key                     |
| `DODO_PAYMENTS_WEBHOOK_KEY`    | webhook signing secret (`whsec_…`) |
| `DODO_ENVIRONMENT`             | `test_mode` or `live_mode`         |
| `DODO_PRODUCT_PRO`             | Pro, monthly                       |
| `DODO_PRODUCT_PRO_ANNUAL`      | Pro, annual                        |
| `DODO_PRODUCT_PRO_PLUS`        | Pro+, monthly                      |
| `DODO_PRODUCT_PRO_PLUS_ANNUAL` | Pro+, annual                       |
| `DODO_PRODUCT_MAX`             | Max, monthly                       |
| `DODO_PRODUCT_MAX_ANNUAL`      | Max, annual                        |

**One lookup, not six branches.** `(plan, interval) → product id` is a single map in `infrastructure/plans.ts`, so adding an interval later is a row rather than a rewrite, and a checkout can never reach for a product id the plan table does not know about.

One warning from Dodo's own docs that is easy to get wrong in the dashboard and produces a subscription that silently does not renew: **set the subscription period longer than the payment frequency**, or it is valid for a single cycle and then expires.

#### Webhooks are the only thing that grants access

`checkoutSession()` returns a URL and the reader goes to Dodo. When they come back, the client knows nothing trustworthy about whether money moved. **Access is granted only by a signature-verified webhook**, never by a client callback or a success-page query parameter.

Dodo follows the Standard Webhooks spec and the plugin verifies signatures itself, so the handler's job is the three things the plugin does not do:

- **Idempotency.** Every delivery carries a `webhook-id`, retries redeliver, and there are up to 8 attempts over about 28 hours. A `WebhookEvent` table keyed on that id, with the id written **after** the handler succeeds so a failure is genuinely reprocessed on retry rather than swallowed.
- **Ordering.** Dodo states plainly that events may arrive out of order. The body's `timestamp` is compared against `Subscription.lastEventAt` and a stale event is dropped. `updatedAt` is a local write time, which can be later than a genuinely newer event after a delayed delivery; it is only the fallback for pre-integration rows without a receipt. Every payload carries the latest state at delivery time, so dropping a stale one loses nothing.
- **Acknowledge fast.** 30-second timeout, and anything other than a 2xx is a retry.

Which events matter, mapped to what they change:

| Event                              | Effect                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| `subscription.active`              | upsert the row, set the plan; `BILLING` usage opens lazily on first answer         |
| `subscription.renewed`             | roll the period forward — **this** is what extends access, not `payment.succeeded` |
| `subscription.plan_changed`        | change the plan and the allowances; keep the period bounds                         |
| `subscription.past_due`            | keep access until `past_due_ends_at`, and say so plainly                           |
| `subscription.on_hold`             | suspend paid models, offer the portal to fix the card                              |
| `subscription.cancelled`           | access to the end of the paid period, then Free                                    |
| `subscription.expired` / `.failed` | Free, and `expired` cannot be reactivated                                          |

`subscription.renewed` gating access rather than `payment.succeeded` is Dodo's own guidance and the difference is real: a payment can succeed for something that is not a renewal.

**A mid-period plan change keeps the counters and changes only the limits**, which falls out of storing answers-used rather than answers-left. Upgrade on day 20 having spent 900 Standard, and Pro+ gives 3,000 − 900 = 2,100 left, immediately, without a new period or a prorated allowance to compute. It is slightly generous on an upgrade and slightly harsh on a downgrade, and both are small, legible, and easier to explain than any proration would be.

**Switching interval arrives as the same `plan_changed` event and needs one extra step**: the product id changes, so `Subscription.interval` is re-read off the payload rather than assumed, and the monthly-window anchor moves with the new `current_period_start`. Getting this wrong is silent — a monthly-to-annual switch that keeps the old bounds would leave the allowance refilling on the old day, which nobody would notice for a month.

#### What the reader sees

- A `/plans` page: four plans, the three allowances each one buys, and the honest per-answer dollar figures behind them.
- **A monthly/annual toggle on `/plans`**, with the annual saving stated as a real number rather than a badge — "$200 a year, two months free" beats "Save 17%!", and it is the same number a reader gets by multiplying. The toggle moves prices only: the allowances are identical on both intervals, so nothing else on the card may change when it is flipped.
- Billing in settings: current plan **and interval**, the three counters as used-against-bought, when the allowance next refills, when the subscription next renews — **which are the same date on monthly and different on annual** — and a button to the Dodo portal via `authClient.dodopayments.customer.portal()`.
- **The portal needs a verified email or it answers 401.** Google and GitHub OAuth both deliver verified emails, so this should never fire — but it is a 401 on a billing screen, so it gets a plain sentence rather than a raw error.

#### The costs of running this

Worth writing down because they do not appear in the margin table and they are the ones that bite: **a refund costs $1 and a chargeback costs $30.** A single chargeback erases roughly half a full-burn month of Max margin, or nearly three of Pro. Dodo's dunning and recovery tooling is free to enable and charges 5% of what it actually recovers, which is a reasonable trade whenever it fires. Dodo is the merchant of record, so sales tax and VAT across 190+ countries are theirs to handle rather than ours — which is the main reason to choose them over wiring a processor directly.

**Annual concentrates that risk rather than adding a new kind.** A disputed $1,000 Max year is the same $30 fee as a disputed $100 month, but the reversed amount is twelve times larger and the inference behind the months already used is spent and unrecoverable. Nothing in slice 5 is built to mitigate that — no proration on refund, no clawback — and that is a deliberate omission on a product with no subscribers, recorded so it is a known exposure rather than a surprise.

#### Build checklist

- [x] Install `@dodopayments/better-auth` and `dodopayments` (already installed on arrival).
- [x] The **six** products already exist in Dodo's dashboard. Read back through the configured API on October 22: USD $20/$50/$100 monthly, $200/$500/$1,000 annual, one month/year payment frequencies, ten-year subscription terms so all six can renew.
- [x] **Nine** environment variables into `infrastructure/env.ts`, failing fast and listing everything missing at once.
- [x] Better Auth server config: the `dodopayments()` plugin with `checkout`, `portal` and `webhooks`; `createCustomerOnSignUp: true`.
- [x] Auth client: `dodopaymentsClient()`.
- [x] Prisma: `dodoCustomerId` on `User`, existing `BillingInterval`/`Subscription.interval`, `WebhookEvent`, `Subscription.lastEventAt`, stable `ModelResponse.usagePeriodId`. Migration applied to embedded PostgreSQL and Neon, preserving earlier Neon schema-push columns and webhook receipts.
- [x] `scripts/check-auth-schema.mjs`: pass the configured plugins to `getAuthTables` so the new column is known rather than excused.
- [x] Subscription webhook handlers, with transactional idempotency on `webhook-id`, staleness on `timestamp`, terminal expiry, and interval re-read on `plan_changed`. Also handle `updated`, pause and unpause snapshots so scheduled cancellation and suspension cannot be missed.
- [x] `/plans` page with the monthly/annual toggle, and the billing panel in settings showing interval, next refill and next renewal.
- [x] Invoke `frontend-design` and `impeccable` before writing `/plans`, the interval toggle or the billing panel.
- [x] Client bundle scan: all nine Dodo variable names and all configured Dodo values absent from `.output/public`; server SDK/config stay private.
- [x] Automated gate: typecheck, lint, formatting, contrast (84 pairs), auth schema (4 tables / 31 fields), Prisma generation/format and production build. UI detector returned `[]`. Source review fixes applied; visual browser pass remains pending.
- [x] Isolated PostgreSQL probes using the actual auth handler: signed activation, duplicate/concurrent delivery, stale delivery, bad signatures, retry after failed handling, upgrade counters, annual windows, stable refunds after interval changes, past-due grace, hold, cancellation at the exact boundary, terminal expiry, leap-year month anchoring, checkout authentication, existing-subscription rejection, catalog validation, and rejection of quantity/trial/metadata overrides. Production SSR checked for `/plans` and signed-in/signed-out `/settings/billing`, including checkout return. Temporary probes live outside the repository; no test framework was added.
- [x] Billing and account-menu rendering manually verified by the user on October 25. The user explicitly waived further browser verification. Live test-card payment verification remains separate below.
- [ ] **Needs a person:** buy Pro **monthly** with a Dodo test card end to end, confirm the webhook arrives and the row appears, confirm a paid model unlocks, then cancel through the portal and confirm access lasts to the period end and not a second longer. Then buy Pro **annual** and confirm the allowance window is one month while the renewal date is a year out — the one thing that cannot be checked by reading the code.

#### October 25 — billing and account-menu refinement

The user requested a modern, minimal billing page, removal of the crowded sidebar
allowance panel, and consistent borderless Billing / Sign out menu actions. The
incumbent Operate direction, warm tokens, Noto Sans / Montserrat typography, tier
chips, and shared buttons remain the visual authority. Impeccable, frontend-design,
building-components, vercel-react-best-practices, and web-design-guidelines were read
and applied before implementation.

- [x] One raised plan summary groups the plan, interval, plain subscription status,
      portal / comparison actions, monthly refill, and subscription renewal or access end.
      Dates remain explicitly UTC, and annual refill remains separate from annual renewal.
- [x] Move the allowance detail to Billing: three unboxed monthly columns, neutral
      remaining-answer meters, exact tabular counters, and a separate daily free allowance.
      Stack at narrow widths; free readers see the daily meter without zero paid-tier rows.
- [x] Replace the account popover with the existing Radix dropdown pattern: matched
      icon rows, account identity separated by a seam, keyboard navigation and Escape,
      loading / disabled sign-out feedback, and inline retryable sign-out failure.
- [x] Typecheck, lint, production build, formatting, layout detector, and all 84
      contrast pairs in both themes pass.
- [x] The user manually verified the billing and account-menu changes and confirmed
      they render correctly. Further browser verification was explicitly waived; temporary
      preview files were removed. No browser automation framework was added.
- [x] Follow-up: Billing now uses a standalone frame like `/plans`, with a full-width
      Nexora header with a linked wordmark, theme controls, and its own scrollable main
      region in ready, signed-out and unavailable states.

#### What implementation changed in the plan

The checklist on arrival marked implementation complete while the source was absent. Those items now have running code and measured checks behind them; the external test-card and visual checks remain open explicitly.

- **Dodo's actual period fields are `previous_billing_date` and `next_billing_date`.** They map into our `currentPeriodStart` and `currentPeriodEnd`; a same-interval plan change keeps the bounds and counters, while an interval switch takes the new anchor.
- **The installed Better Auth plugin predates `past_due`.** Its core parser rejects that status and strips the grace deadline from known subscription snapshots. The handler retains the original signed body in request-scoped `AsyncLocalStorage`; regular deliveries enter through the plugin's signature verification and `onPayload`. Past-due snapshots use the installed official Dodo SDK's Standard Webhooks verification at the same auth endpoint, then the same transactional handler. No unverified payload grants access.
- **Checkout accepts only a configured plan slug.** The plugin accepts custom cart, metadata and trial settings, so an auth hook rejects those overrides. A probe caught that returning a replacement context body merged rather than removed those fields; explicit rejection is the verified correction. Existing unexpired subscriptions use the portal to avoid duplicate purchases. Customer linking uses the Dodo customer ID first, with verified-email fallback for accounts created before this integration; client `referenceId` never selects the owner.
- **A reservation retains its period ID.** Settlement no longer derives a past charge from today's subscription bounds. Outcome writes claim only `STREAMING` rows, so duplicate settlement cannot refund or count the same cost twice. Reconciliation filters by owner and stable period links, with a legacy fallback; the old script summed every user's answers in a time range and compared all tiers with an incorrect single cap.
- **Neon already had an earlier schema push.** The first migration attempt stopped on the existing customer column. Introspection identified the existing receipt timestamp `occurredAt` and optional subscription ID; both were preserved, `eventAt` maps to `occurredAt`, and existing receipt timestamps seed `lastEventAt`. The failed attempt was marked rolled back and the transactional compatible migration applied successfully. No schema reset or data deletion occurred.
- **The design extends the incumbent app.** `frontend-design` and `impeccable` were read before UI edits. Billing uses existing typography, theme tokens, tier chips and buttons, neutral dividers and used/total figures; the account menu supplies the entry point. The annual toggle changes prices and savings while allowances and included features remain the same. The finish review ran inline from source: visual fidelity still requires the pending browser pass.

#### Documents this slice contradicts, and has to correct

Not a to-do list of edits so much as a record of every place the old rule is written down, so none of them is missed:

- **`CLAUDE.md`** — the obsolete free-only cost rule was corrected under the user's Feature 12 implementation instruction: free answers read $0.0000 and paid answers show their real measured cost.
- **`PRODUCT.md`, Capabilities** — the same line, replaced by the three per-tier allowances, the reserve-and-refund rule, and the free daily cap.
- **`PRODUCT.md`, what must not be fabricated** — "no pricing tiers" becomes true once feature 12 ships, and stays a fabrication until then.
- **`PRODUCT.md`, Users** — the audience read is partly inferred from "the whole product is scoped to the free tier", which stops being the evidence it was.
- **`PRODUCT.md`, Operating Context** — "/models browses the live free-tier catalog".
- **`DESIGN.md`** — the paid badge, the tier chip, the three-counter allowance meter and the upgrade surfaces, plus the restatement that the meter may not use green or red.
- **Feature 5, in this file** — price shown as the prompt price alone, and `/api/chat`'s "rejects a model that is not on the free list", which becomes "not in the arena catalog".
- **Feature 9, in this file** — "`view-toggle.tsx` is untouched", and the five-column table gains a tier chip inside the Model cell on the Paid tab. The column count itself is unchanged, which is deliberate.

#### Still open, to settle before feature 11 is built

Nothing. Both items that stood here are settled:

- ~~**Whether the allowance ladder's prices are right.**~~ **Confirmed at $20 / $50 / $100 monthly**, plus annual at two months free — $200 / $500 / $1,000 — on the standing condition that the worst case stays profitable. It does, at ≈52–54% monthly and ≈42–46% annual.
- ~~**How the leaderboard treats paid models.**~~ **Free/Paid sub-tabs beside Global/Personal**, partitioned on the row's recorded tier. Written up in feature 10 under "The leaderboard gets a second toggle", including the cost the split carries and the note that pays it down.

## Deploy fixes

### 13. Vercel 500 on every route: the TanStack version split

**The symptom.** Every route on the Vercel deployment returned `500` with a body of `{"status":500,"statusText":"","unhandled":true,"message":"HTTPError"}`. That body is h3 masking an unhandled exception (`h3/dist/h3.mjs`, `message: unhandled ? "HTTPError" : this.message`). The real error was only in the Vercel runtime logs: `TypeError: router.serverSsr.takeBufferedScripts is not a function`, thrown at `@tanstack/react-router/.../Scripts.js:49` inside `renderToReadableStream`.

**Why.** `apps/web/package.json` declared `"@tanstack/react-router": "latest"`, `"@tanstack/react-start": "latest"` and `"@tanstack/react-router-devtools": "latest"`. `react-start` publishes a _pinned_ `@tanstack/react-router` (1.170.44 at 1.169.2), and pnpm resolved the top-level `latest` to a different one (1.170.25). That installed two `@tanstack/router-core` copies: 1.171.21 behind 1.170.25, 1.171.37 behind 1.170.44. `Scripts` from 1.170.25 calls `router.serverSsr.takeBufferedScripts()`; `router-core@1.171.37` removed that method, and the router instance at render came from the 1.171.37 copy. Every SSR render failed, including `/favicon.ico`. The root `loader` in `__root.tsx` renders `Scripts`, so this was not route-specific.

It surfaced now because the local `.output` was stale (built Oct 10) while Vercel installed fresh; the initial guess — missing env vars — was ruled out by the Vercel env list, which had all 13 set.

**The fix.**

- Pinned every `latest` in `apps/web/package.json`: `react-router` `1.170.44` (the version `react-start@1.169.2` requires exactly), `react-start` `1.169.2`, `react-router-devtools` `1.167.1`, `react-devtools` `0.10.9`, `devtools-vite` `0.8.3`, `eslint-config` `0.4.0`.
- Added `overrides` to `pnpm-workspace.yaml` forcing `@tanstack/react-router` to `1.170.44` and `@tanstack/router-core` to `1.171.37`. These must live in `pnpm-workspace.yaml`; this pnpm version warns that `pnpm.overrides` in `package.json` is no longer read, and silently ignores it.
- Declared the build-time env vars in `turbo.json`'s `build` task. Turborepo 2 strict mode strips undeclared vars from the task, which had been blanking `VITE_POSTHOG_KEY` / `VITE_POSTHOG_HOST` at build time and silently disabling browser PostHog. Declaring them also makes them part of the cache key.

**Checklist.**

- [x] Pin the TanStack packages, move overrides to `pnpm-workspace.yaml`, `pnpm install`
- [x] Confirm one `react-router` and one `router-core` reach the app (`pnpm why`); the only `1.171.21` left is the `router-cli` dev chain, which never ships
- [x] `turbo.json` env declarations
- [x] typecheck, lint, `pnpm build` green
- [x] `vite preview` + `curl`: `/` 200, `/models` 200, `/plans` 200, `/leaderboard` 307 → `?scope=global&pricing=free`, `/sign-in` 307 → `?next=%2F`; `takeBufferedScripts` no longer appears anywhere in `.output/server`
- [x] Redeploy on Vercel and check runtime logs

### 14. Dev server: nothing interactive worked after the pin

**The symptom.** After feature 13's redeploy, the site rendered but no control responded, model selector, sign-in, search, the `/models` search input included. The browser console showed `SyntaxError: ... use-sync-external-store/shim/with-selector.js does not provide an export named 'useSyncExternalStoreWithSelector'`, served from `/@fs/`.

**Why.** Pinning `react-router` to 1.170.44 moved `@tanstack/react-store` from 0.9.3 to 0.11.2. Both import `useSyncExternalStoreWithSelector` from `use-sync-external-store/shim/with-selector`, which ships **CommonJS** (`module.exports = require(...)`). Vite's dev server left that deep import unoptimized, so the browser received raw CJS and found no named export; module evaluation threw, React never hydrated, and every handler silently did nothing. The production build was unaffected, which is why `vite preview` had passed.

**The fix.**

- Listed `use-sync-external-store/shim` and `use-sync-external-store/shim/with-selector` in `vite.config.ts` `optimizeDeps.include` so Vite pre-bundles them into real ESM.
- Added `use-sync-external-store` `1.7.0` as a **direct** dependency of `apps/web`. Without that, pnpm only exposes it through `react-store`'s nested link and Vite reports `Failed to resolve dependency`, so the include silently does nothing.

**A second bug found in the same pass.** The dev log also showed `TypeError: path.endsWith is not a function` from `router-devtools-core`. `router-core` changed `interpolatePath` from an options object to positional arguments between 1.171.21 and 1.171.37; `router-devtools-core@1.168.1` (shipped by `react-router-devtools@1.167.1`) still used the old form. Fixed by bumping `react-router-devtools` to `1.167.2`, which ships `router-devtools-core@1.168.2` and peers on `router-core ^1.171.30`. Devtools-only; it never reached production.

**Checklist.**

- [x] `optimizeDeps.include` + direct `use-sync-external-store` dependency, `pnpm install`
- [x] `react-router-devtools` → `1.167.2`
- [x] Clear `apps/web/node_modules/.vite`, restart `vite dev`; `/` and `/models` 200, zero `does not provide an export`, zero `path.endsWith`
- [x] The shim is pre-bundled and exports its named symbol (`use-sync-external-store_shim_with-selector.js`)
- [x] typecheck, lint, `pnpm build`, `vite preview` `/`, `/models`, `/plans` all 200
- [ ] A person's browser pass: click the model selector, sign in, search, the `/models` filter

One note for later: `react-router-devtools` is now resolving `router-devtools-core` a few minor versions behind core. If devtools misbehave again, check that pair first.

## Consider to build onwards

Kept here so the plan stays honest about what's deliberately left out.

- A "fastest" label on the leaderboard, tagging whichever model already has the best average speed, only for models with enough votes to mean anything. Nice to have, not required.
- An answered-rate column on the leaderboard, so "won 1 of 10" says whether the other nine were losses or failures. PRODUCT.md names exactly three leaderboard metrics and the sketch shows five columns, so feature 9 does not add a sixth; the information is real and currently only visible per-answer in the arena.
- Giving each model's own little icon a distinct look instead of plain gray. Nice to have, not required.
- Privacy policy and terms pages.
- Rich link previews when a thread gets shared somewhere.
- Any kind of admin or moderation page.
- A public API for the leaderboard data. Nobody's asked for this.
- Overage or pay-as-you-go top-ups once a tier's allowance runs out. Slice 5 hard-stops that tier instead, deliberately.
- Team plans and per-seat billing. Monthly and annual are both in slice 5; a seat model is a different product.
- BYOK, where a reader brings their own OpenRouter key. OpenRouter charges 5% on BYOK usage beyond a $25k/month allowance, so it is cheap to support and it changes who the product is for; not now.
- Dodo's own usage meters and credit balances. Slice 5 meters against a column it already writes and will not keep a second version of that truth.
- Per-model caps inside a plan, so a reader could cap how much of a tier's allowance one model is allowed to consume.
- Letting an unused allowance roll over into the next period, or spill downward between tiers. Both were considered and rejected for slice 5: three counters that reset are legible, and either change makes "how many do I have left" a calculation instead of a number.
- **The models above `ARENA_PRICE_CEILING`** — `o1-pro`, the `gpt-5.x-pro` variants, `o3-pro`, `claude-opus-4.1`, `claude-fable-5`, `gpt-4`. They are browsable on `/models` from feature 10 onwards and simply not selectable in the arena. Bringing them in needs a unit that is not one of the three tiers, most plausibly a small per-answer top-up, which is the same machinery the overage entry above describes. A later add-on, not a permanent no.
