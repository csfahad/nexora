# Coding standards

The conventions this project actually holds itself to. `docs/scope.md` is the plan; this is the shape of the code that comes out of it.

Two halves, kept honest about which is which: rules a machine enforces, and rules a person enforces. Nothing here is aspirational. If a rule is listed as enforced, there is a config line behind it and a probe that proved it fires.

## Tooling

| Command                  | What it does                                                            |
| ------------------------ | ----------------------------------------------------------------------- |
| `pnpm lint`              | ESLint, `--max-warnings=0`, so a warning is a failure                   |
| `pnpm typecheck`         | `tsc --noEmit`                                                          |
| `pnpm format`            | Prettier writes the whole repo                                          |
| `pnpm format:check`      | Prettier verifies without writing                                       |
| `pnpm build`             | A real production build (`prisma generate` then `vite build`)           |
| `pnpm check:contrast`    | Every token pair in `styles.css`, both themes, against WCAG             |
| `pnpm check:auth-schema` | The four Better Auth tables against the installed `better-auth`         |
| `pnpm db:generate`       | Regenerates the Prisma client into `src/generated/prisma`               |
| `pnpm db:migrate`        | `prisma migrate dev` — the one command that needs a real `DATABASE_URL` |

All of them run from the repo root. `lint`, `typecheck` and `build` go through Turborepo into `apps/web`; `format` and `format:check` run Prettier over the repo directly; the two `check:*` scripts are plain Node with no dependencies of their own.

**Prettier owns formatting, ESLint owns correctness.** They do not overlap. There is no `eslint-plugin-prettier`, so a formatting difference never shows up as a lint error, and lint output stays entirely about things that are actually wrong. Prettier config is `printWidth: 90` and defaults for everything else, plus `prettier-plugin-tailwindcss`, which sorts Tailwind classes into one canonical order so class-list churn stops showing up in diffs.

**`.prisma` is the exception, because Prettier has no parser for it.** `prisma format` is the formatter for `prisma/schema.prisma` — two-space indent, aligned attributes — and it is wired into `lint-staged` so the schema cannot drift. It reads the schema path from `prisma.config.ts` rather than from arguments.

**The pre-commit hook is deliberately fast.** `husky` runs `lint-staged`, which runs `eslint --fix --max-warnings=0` and then Prettier, on staged files only. Typecheck and build are not in the hook. That is a choice, not an oversight: a full `tsc` on every commit grows with the codebase and is the thing people start skipping with `--no-verify`, and a hook that gets bypassed enforces nothing. Typecheck, lint and a real build are still required after every change, per `CLAUDE.md` — they just run at the point where the change is finished rather than at every save point along the way.

Vendored and generated things are not ours to reformat: `.agents/`, `.claude/`, `generated/`, `prisma/migrations/`, `routeTree.gen.ts` and the lockfile are all ignored by Prettier, and `routeTree.gen.ts` and `src/generated/**` by ESLint too. Prisma's client is generated, gitignored, and rebuilt by `postinstall`, `pnpm build` and `pnpm db:generate`, so a fresh clone never needs a database to get a typed client.

**Type-aware ESLint rules are scoped to TypeScript files, and that scoping is load-bearing.** `@typescript-eslint` is only registered for `.ts`/`.tsx`, so naming one of its rules in a config block with no `files` key is a hard ESLint config error — not a lint failure on one file, a refusal to run at all — the moment any non-TS file enters the lint surface. `apps/web/scripts/*.mjs` was the first one. Keep new type-aware rules inside that block.

## Enforced by the linter

**No `any`.** `@typescript-eslint/no-explicit-any` is an error, not the warning it ships as. A warning is an error everyone learns to scroll past.

**Type imports are top-level, not inline.** `import type { Foo } from "..."` alongside a separate value import, rather than `import { type Foo, bar }`. This is `import/consistent-type-specifier-style` from `@tanstack/eslint-config`, and it pairs with `verbatimModuleSyntax: true` in `tsconfig.json`: a type-only import statement is erased wholesale, which keeps the emitted import graph honest. `eslint --fix` rewrites these for you.

**`const` by default, nothing reassigned in place.** `prefer-const`, `no-var`, and `no-param-reassign` including properties. Prefer `map`/`filter`/`reduce` over a loop that mutates an accumulator.

**`process.env` is banned outside two modules.** Configuration is read through `serverEnv()` in `infrastructure/env.ts` or `publicEnv` in `infrastructure/public-env.ts`, never directly. Only `NODE_ENV` is exempt everywhere, because it describes the runtime rather than configures the app.

This rule exists because it already went wrong once. A stray second Prisma client reached for `process.env.DATABASE_URL!` and quietly bypassed the fail-fast validation, so a missing variable would have surfaced as a confusing failure on someone's first prompt instead of a named crash at boot (`docs/scope.md`, feature 1).

An earlier version of this line claimed config files (`*.config.ts`, `*.config.mjs`) were exempt. **They are not** — there is no such override in `eslint.config.js`, only the two `infrastructure/` modules, so the claim was aspirational and is corrected here. It matters in exactly one place so far: `apps/web/prisma.config.ts` needs `DATABASE_URL` before the app exists, and reads it through Prisma's own `env()` helper from `prisma/config` rather than reaching for `process.env`. `process.loadEnvFile()` in that same file is untouched by the rule — it loads `.env`, it does not read a variable.

The rule is `no-restricted-properties` on `process.env`. It is worth knowing _why_ it matters even though Vite never inlines server env into client code: a `process.env` read that reaches the browser compiles to `{}`, so the variable silently becomes `undefined` rather than leaking a secret. That is a confusing bug rather than a breach, and this rule plus `serverOnly()` is how both stay impossible. See feature 1 in `docs/scope.md` for the build output that demonstrates it.

**Feature folders have real walls.** `no-restricted-imports` enforces the layering:

- A feature imports its own files **relatively** (`./chat-request`), and other layers through the alias (`@/infrastructure/env`).
- A feature may **not** import another feature, by alias or by climbing out with `../`. If two features need the same thing, it belongs in `infrastructure/`, or in a feature both can legitimately depend on. This rule is scoped to `src/features/**`, because routes are _supposed_ to import features — that is what composing a screen is.
- `infrastructure/` is the bottom layer. It imports no feature and no route.
- Nothing outside `src/routes/` imports from `src/routes/`. Routes and layouts compose features; features never reach back up.

**Accessibility has a floor.** The `jsx-a11y` rules that catch the things actually worth catching are errors: alt text, anchors with real content and real hrefs, valid ARIA roles and props, labels bound to controls, keyboard handlers alongside click handlers, focusable interactive elements, no autofocus. This is a floor, not the whole accessibility rule — see below.

**`console.log` is a warning, and warnings fail the build.** `console.error` and `console.warn` are allowed, because that is exactly how a real provider error survives server-side while the user sees a plain sentence. Debug logging is not that. The one exemption is `scripts/**/*.mjs`: those are Node CLIs whose entire job is printing a report, so stdout is their product rather than stray logging.

## Enforced by review

These are real rules with no honest lint rule behind them. A rule that approximates them would produce false confidence, which is worse than a written rule someone actually reads.

**Never show a raw exception or provider error to the user.** A plain human sentence and a retry action, always. The real error goes to the server log with `console.error`.

**If the same handful of Tailwind classes shows up in three places, that is a component.** Shared spacing, color and repeated UI patterns live in `apps/web/src/styles.css` or in a shared component, never copy-pasted across files.

**Keep env reads and connections lazy.** Anything that reads config or opens a connection does it on first use, inside a memoised function, not at module scope. `vite build` evaluates route modules to collect page data, so an eager read makes a production build demand real secrets. `serverEnv()`, `openRouterClient()` and (later) `arcjetClient()` and the Prisma client are all built this way, and anything new that touches config must be too.

**A vote is only ever created through `castVote`.** Nothing else inserts into `votes`. The rule that a vote needs two or more completed answers is application code by decision (`docs/scope.md`, feature 3), not a database constraint, so that one transactional function _is_ the constraint. A second insert path silently repeals it. The unique index on `turnId` still catches a duplicate, but nothing catches a vote on a turn only one model answered.

**Side effects at the edges.** Pure functions by default; no shared mutable state. Network calls, database writes and logging live in route handlers and clearly named effectful functions, not scattered through helpers.

**Database access uses Prisma only.** Application code and CRUD paths must not issue raw SQL or bypass the shared Prisma client.

**Accessibility beyond the linter.** Real contrast, a visible focus ring on everything focusable, and full keyboard operation on every screen. The lint rules catch missing labels and dead handlers; they cannot tell you a focus ring is invisible against a coffee-brown background. Check it by eye, in both themes.

**Cost shows the real per-call number.** A free answer reads `$0.0000`; a paid answer shows measured provider cost, or an explicitly recorded catalog estimate when usage omits it.

## File and naming conventions

- Folder by feature (`features/chat/`), never a layer-wide folder of every hook or every type.
- Files are `kebab-case.ts`; a file is named for the thing it exports (`stream-model-response.ts` exports `streamModelResponse`).
- Components are `PascalCase`, everything else `camelCase`, arrow-function consts over `function` declarations.
- Types are `Readonly` where they describe data that should not change; `type` over `interface` unless declaration merging is genuinely needed.
