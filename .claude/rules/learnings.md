# forge-pages — Learnings

> Per-phase, non-obvious learnings for this project. Split out of `.claude/CLAUDE.md` §12
> to keep that file under the 200-line budget. Add a new dated section at the end of each phase.

Historical, stack-specific learnings from the Nuxt/Vue/Strapi/NocoDB/VPS build (2026-07-08 → 2026-08-04) are archived in `docs/HISTORY.md` — several entries (Supabase key model, Turnstile/Cloudflare token validation, mise/tera quirks) remain true and useful even after the rewrite.

### 2026-08-04: Fase 0 — repo reset to Next.js 16 + Cloudflare Workers

- **Keep `middleware.ts`; do NOT migrate to Next 16's `proxy.ts`.** `next build` prints a deprecation warning telling you to switch, and switching passes `next build` — then fails `opennextjs-cloudflare build` with "Node.js middleware is not currently supported." `proxy.ts` is hardwired to the Node.js runtime (Next *throws* on a route segment config in a proxy file), and OpenNext/Cloudflare only supports Edge middleware. Next's own v16 upgrade guide says to stay on `middleware` if you need edge. The warning is a trap for this deploy target; `middleware.ts` carries a comment saying so.
- **`Headers.set()` returns `void`**, so it can't be chained off the constructor — `new Headers(h).set(...)` fails with `TS2322: Type 'void' is not assignable to type 'Headers | undefined'`. Assign, then mutate. (The original snippet in `.claude/docs/TECHNICAL_REVIEW_CONTEXT7.md` had this bug; it's corrected there now.)
- **Verify on the Workers runtime, not just `next dev`.** `next build` succeeding proves nothing about Workers — the middleware constraint above only surfaces in `opennextjs-cloudflare build`, and only `wrangler dev` exercises workerd. Both are part of the verification loop.
- **Tenant assertions need `<!-- -->` tolerance**: React emits an HTML comment between static text and an interpolated value, so `grep "Tenant host: [^<]*"` finds nothing. Match `Tenant host: <!-- -->[^<]*` (or read the RSC payload).
- **Cloud grant drift is real and RLS masks it.** `supabase db diff --linked` found `anon` *and* `authenticated` holding SELECT/INSERT/UPDATE/DELETE on all three tables, far beyond what the RLS migration grants. RLS was still blocking it (no matching anon policy), so nothing was exploitable — but table grants are the second layer and must not be wider than the policies. Fixed in `20260804000001_revoke_anon_write_grants.sql`, which also does `alter default privileges ... revoke` so new tables don't reintroduce it. **Run `supabase db diff --linked` after any cloud push** — `db push` reporting success does not mean cloud matches the migrations.
- **Guess a function name in a DROP and it silently no-ops.** The lead webhook trigger function was `on_new_lead_webhook()`, not the `notify_new_lead()` a migration guessed, so the function outlived its trigger. `drop ... if exists` reports success either way; confirm the real name (via `db diff` or `pg_proc`) before trusting the drop.
- **Always pass `--workdir infra` to `supabase`.** Without it the CLI creates a stray `./supabase/` at the repo root and links the project there (now gitignored, and the `db:migrate` task hardcodes the flag). `supabase db execute` does not exist in CLI 2.111 — seeding goes through `db reset`, driven by `config.toml`'s `[db.seed] sql_paths`.
- **Next 16 writes root `AGENTS.md` + `CLAUDE.md` on every `next dev`** (`agentRules`), containing its own "this is NOT the Next.js you know" guardrail. Kept deliberately — that block is exactly the warning that the `middleware`/`proxy` trap above needed. The project's own instructions stay in `.claude/CLAUDE.md`; set `agentRules: false` in `next.config.ts` if the duplication ever becomes a problem.
- **`pnpm run lint` fails in this environment via the rtk hook** (misroutes to eslint: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL, Command "eslint" not found`). The script is `biome check .` and is fine — run `rtk proxy pnpm run lint` or `pnpm exec biome check .`.
- **pnpm 11 build allowlist** moved to `pnpm-workspace.yaml`'s `allowBuilds` (kept even with no workspace packages): `esbuild` and `workerd` need `true`, set via `pnpm approve-builds --all`.

### 2026-08-05: Fase 1 — multi-tenant render + Forge Company content

- **Anchors belong to the data, not the component.** The first pass hardcoded `id="manifesto"` / `id="pacotes"` inside `DifferentialsBlock` / `PricingBlock` — tenant-specific section names inside components every tenant shares. It also silently could not work: `value-proposition` renders twice on the Forge page (Processo, Setores), and one constant cannot give two occurrences different anchors, so two header links pointed at nothing. Fixed with `anchorId` on the block (ADR-0008). **Any value that differs between two instances of the same block type must be data.**
- **`next/font`'s `font.variable` is a class name, not the CSS variable.** It returns a generated className (`__variable_abc123`) that *declares* `--font-x`; it is not the string `--font-x`. Track the property name yourself (`lib/fonts.ts` keeps `{ font, cssVariable }` pairs) — deriving it from `font.variable` is a regex on an opaque build artefact.
- **Screenshots taken with Chrome's `--screenshot` CLI flag lie about this page.** `--window-size=1440,4600` makes `100vh` equal 4600px, so `min-h-screen` stretches the hero over the whole capture and everything else falls off the bottom; combining it with a `#fragment` produced entirely blank frames for sections that were rendering correctly. Use CDP instead: `Emulation.setDeviceMetricsOverride` to fix the layout viewport, then `Page.captureScreenshot` with `captureBeyondViewport: true` (+ `clip` for a region). **Measure before believing a screenshot** — `getBoundingClientRect` over CDP disproved two "bugs" that were capture artefacts and found the real one.
- **Biome lints `public/` as source.** The brand SVGs tripped `a11y/noSvgWithoutTitle` as if they were JSX. Static assets are excluded via `!public` in `biome.json`.
- **CSS suppressions attach to the declaration, not the selector.** `/* biome-ignore lint/complexity/noImportantStyles */` above a rule block reports `suppressions/unused`; it has to sit immediately above each `…!important` line.
- **Prefer a `switch` over a component-map lookup for the block union.** `blockComponentMap[block.type]` cannot be typed without an assertion (`as any` is banned by §10); a `switch` on `block.type` narrows the discriminated union to each component's own props, so the mapping is checked rather than asserted.
- **A tenant's page background needs its own variable.** `--tenant-background` (the flat fill behind whatever the background type paints) is what the sticky header's glass fallback and the seam glyph mask reference. Without it both had to hardcode a colour, which is correct for exactly one tenant.
- **Local Chromium without a system Chrome**: the Playwright MCP server is pinned to the `chrome` channel and fails, but Playwright's bundled binary works directly — `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome` (note `chrome-linux64`, not `chrome-linux`).

### 2026-08-05: Fase 2 — lead capture

- **The local Supabase stack does not authenticate `apikey` at all.** A garbage
  `sb_publishable_…` value and *no key whatsoever* both return 200 on a published-row read
  against `127.0.0.1:54321` — every request runs as `anon` regardless of what you send. So a
  read path passing locally proves nothing about the key being correct, and the first thing
  that ever notices a wrong key is the first operation needing `service_role`, which fails
  as `permission denied for table <x>` rather than as an auth error. **Diagnose a stray
  `permission denied` as "wrong role", not "wrong grants"** — check the key before the
  policies.
- **Keys in `.env` drifted to the cloud project's values under a local `SUPABASE_URL`.**
  `SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` were byte-identical to their `PROD_*`
  counterparts while `SUPABASE_URL` pointed at `127.0.0.1:54321`. Combined with the item
  above this is silent: reads work (degraded to `anon`), writes fail. Verify with
  `pnpm exec supabase status --workdir infra` rather than assuming.
- **Neither mise nor Next.js overrides a variable already present in the environment, so a
  stale value in the shell that launched your tooling silently beats a corrected `.env`.**
  After fixing the keys in `.env`, `next dev` still used the old ones: they were exported in
  the environment Claude Code itself was started from (nothing in `~/.zshrc` — just
  inherited), and `_.file = ".env"` fills gaps rather than replacing. `mise env` printed the
  *correct* value the whole time, which makes this look impossible. Diagnose by reading the
  server's real environment — `tr '\0' '\n' < /proc/$(pgrep -f "next[-]server")/environ` —
  not by re-reading the file. Fix by restarting the launching shell, or per-run with
  `env -u VAR … <command>`, which lets Next's own dotenv loader supply the file value.
- **`wrangler dev` loads the entire root `.env` into the Worker env, and it beats shell
  exports.** Every key in the file shows up in the startup banner as
  `env.X ("(hidden)") Environment Variable local`, including `PROD_*` and unrelated tokens.
  A local Worker run therefore silently uses *production* credentials. Override per-run with
  `wrangler dev --var KEY:VALUE` (shell exports are ignored). **Verify before Fase 4 whether
  `wrangler deploy` also uploads `.env`** — if it does, the deploy needs an explicit
  allowlist, not a file that happens to contain every secret on the machine.
- **`pkill -f "next-server"` kills its own shell.** `-f` matches full command lines and the
  pkill command's own line contains the pattern, so the wrapper dies with the target and the
  rest of the compound command never runs (exit 144, no log file created). Bracket the
  pattern: `pkill -f "next[-]server"`.
- **Next 16 refuses a second `next dev` for the same project directory, whatever the port.**
  It prints "You can access the existing server at … or run kill <pid>" and exits 1;
  `--port 3001` does not help. To verify with different env values you must take over the
  running server, not run beside it.
- **Turnstile's dummy keys are a matched pair of behaviours, not just "test keys".** Secret
  `1x0000000000000000000000000000000AA` passes *any* token, so it cannot demonstrate the
  rejection path or `timeout-or-duplicate`; the always-fail secret
  (`2x` prefix, same shape) rejects every token, which is what proves the siteverify verdict
  is honoured rather than short-circuited on an empty token. Verifying both needs two runs.
- **Zod's default object strip is what enforces the trust boundary.** A body carrying
  `landing_page_id` and `status: 'converted'` produced a row on the correct tenant with
  `status = 'new'` — the unknown keys never reach the insert. Worth an explicit test rather
  than trust: switching a schema to `.passthrough()` would silently open it.

### 2026-08-05: Fase 3 — second/third tenant + light/dark theming

- **Neutrals became themeable by adding one indirection, not by touching any component.**
  `globals.css`'s `@theme` block went from `--color-surface: #2b2116` (literal) to
  `--color-surface: var(--tenant-surface)`, with `app/layout.tsx` setting
  `--tenant-surface` per request from `lib/theme.ts`. Every block already used the
  `bg-surface`/`text-ink` Tailwind utilities rather than the custom properties directly,
  so zero component files needed a change for two tenants to render in opposite themes.
  **The lesson generalises**: route platform-wide tokens through one indirection layer
  early, even before a second value is needed — the alternative is finding every literal
  later.
- **The Playwright MCP server's `chrome` channel isn't installed in this environment**
  (`Chromium distribution 'chrome' is not found at /opt/google/chrome/chrome`), same trap
  Fase 1 hit. This time the bundled binary was driven directly via `playwright-core`
  instead of the MCP tool: `NODE_PATH=<any-sibling-project>/node_modules node script.js`
  works because `playwright-core` isn't installed in this repo but is in others on the
  machine, and Node's `NODE_PATH` will resolve it from there. Executable path:
  `~/.cache/ms-playwright/chromium-<rev>/chrome-linux64/chrome`.
- **`page.goto(..., { waitUntil: 'networkidle' })` hangs indefinitely on any page with the
  Turnstile widget in this sandbox** — no outbound network access to
  `challenges.cloudflare.com` means the widget's script never settles, so "0 connections
  for 500ms" never arrives. Use `waitUntil: 'load'` (+ a short fixed wait if the DOM needs
  a beat) for any page-render check that doesn't specifically need network-idle.
- **Cloudflare Turnstile emits its own console noise in headless/automated Chrome**
  (`%c%d font-size:0;color:transparent NaN`) as anti-automation fingerprinting — it showed
  up nondeterministically across repeated loads of the *same, unmodified* `forgecompany.localhost`
  page. Don't diagnose this as an application console error; it's the third-party script,
  not our code, and its absence/presence isn't a signal of anything.
- **`pkill -f "wrangler dev"` kills its own shell** — same trap as the documented
  `next-server` one (Fase 2 learnings): the pkill command's own argv contains the
  unbracketed pattern. Bracket it: `pkill -f "wrangler[ ]dev"`.
- **The pre-existing `pg_net` schema drift (cloud has it outside `public`, migrations
  declare it schema-less) survived this session's cloud push untouched** — `db diff
  --linked` after pushing `20260805000001`/`20260805000002` still reports
  `drop extension if exists "pg_net"; create extension ... with schema "public"` as the
  only remaining diff. Confirmed non-trivial to fix blind: relocating an extension's
  schema can silently break any `pg_cron` job that calls it schema-qualified. Left open
  rather than guessed at.

### 2026-08-05: Fase 4 prep — `wrangler deploy` env var check

- **`wrangler deploy` never auto-loads the root `.env`** — that behavior
  (`getVarsForDev` in workers-sdk) is hardcoded to `wrangler dev` only, confirmed against
  the Cloudflare Workers SDK source via Context7. No risk of the whole `.env` file
  reaching a deploy; the carried-over concern from Fase 2 doesn't apply.
- **But `deploy.yml` had a real gap the same investigation surfaced**: setting a secret
  as GitHub Actions job `env:` only reaches the `opennextjs-cloudflare build` step
  (correct for inlining `NEXT_PUBLIC_*`) — `wrangler deploy` does not forward the CI
  runner's shell env into the Worker's runtime bindings. Server-side vars
  (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
  `TURNSTILE_SECRET_KEY`) need to be pushed as Worker secrets explicitly, or the deploy
  succeeds and the app 500s on first Supabase/Turnstile access. Fixed by adding
  `cloudflare/wrangler-action`'s `secrets:` input (`wrangler secret bulk`) to the deploy
  step — not yet run for real, since `deploy.yml`'s trigger is still commented out.
