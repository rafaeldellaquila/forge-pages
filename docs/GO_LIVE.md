# forge-pages — Go-Live / Remaining Work

> Snapshot: **2026-08-04**. Living checklist of what's left before onboarding the first
> paying client, plus notes to resume in a fresh session. Update as items are completed.

---

## Where the project stands

- **MVP rewrite in progress (ADR-0007)**: Next.js 16 + React 19 + Supabase JSONB blocks +
  Cloudflare Workers. The previous Nuxt/Strapi/NocoDB/observability/VPS stack was dropped
  — anything below that looks like it "vanished" is explained in
  `docs/adr/0007-drop-strapi-nocodb-observability-vps.md` and `docs/HISTORY.md`.
- Local dev bootstraps with `bash .claude/skills/onboard-local/setup.sh` (or the
  `onboard-local` skill), then `mise run dev`.
- Company account migration Fases A + B are complete (below); Fase C (prod wiring) is next.

**True blocker to go live:** deploying to Cloudflare Workers with the three MVP domains
resolving. Everything else is config / hardening / ops.

### MVP phases (`.claude/docs/MVP_REWRITE_CONTEXT.md`)

| Fase | Focus | Status |
|---|---|---|
| 0 | Reset repo, infra, docs | in progress |
| 1 | Core multi-tenant + Forge Company real content | pending |
| 2 | Lead capture (form → Supabase) | pending |
| 3 | Second/third tenant (`dellaquila.dev`, `imobiliaria.forgecompany.example.com`) | pending |
| 4 | Deploy (Cloudflare Workers, 3 domains live) | pending |
| 5 | Visibility (Supabase Studio + Cloudflare Web Analytics) | pending |

---

## Company account migration (Forge Company)

Context: the company exists — domain **forgecompany.example.com** (registro.br, DNS on
Cloudflare, Google Workspace). `admin@forgecompany.example.com` (alias of `contato@`) is the
registration email for all infra; `contato@` is the public/reply address. Cloudflare and
GitHub are registered under `admin@`. Every account and key in use was created fresh under
`admin@` — nothing was carried over or reused.

Decisions taken (2026-07-20): Supabase = **new project from scratch** (not a transfer);
environments = **local dev / cloud prod** (no second cloud project); envs = root `.env`
single source + `docs/SECRETS.md` matrix.

- [x] **Fase A — repo**: env management reorganized; the root `.env` is the single source
      of truth and the matrix lives in `docs/SECRETS.md`. (The `env:sync` fan-out that
      existed at the time died with the monorepo — Next.js reads the root `.env` natively.)
- [x] **Fase B — new accounts + keys** (all registered under `admin@`) — **complete
      2026-07-20**. Of the services provisioned then, these are still part of the stack:
  - [x] **Supabase — done 2026-07-20.** Org "Forge Company" (`tnacbzhyknaylpljhktv`) →
        project **`ofpnglnnzpowlzsyfbit`** (`forge-pages`, sa-east-1, PG17) — the single
        cloud project this repo targets. Migrations pushed with RLS on all tables; legacy
        JWT keys disabled (publishable/secret keys only). Prod URL/keys live in the root
        `.env` `PROD_*` section and are mirrored into the GitHub secrets.
  - [x] **Cloudflare — done 2026-07-20.** Account already `admin@`. Prod **Turnstile**
        widget live (real site/secret keys replaced the `1x…` test pair; siteverify with a
        dummy token returns `invalid-input-response`, i.e. the secret resolves). An API
        token was verified against an account endpoint — note an account-scoped token
        **401s** on `/user/tokens/verify` (that endpoint is user-scoped), so check it
        against `/accounts/{id}/…` instead. **The token's scope still needs re-checking
        for Workers** (see Remaining work §3).
  - [x] **Anthropic — done 2026-07-20.** Key under `admin@` in `ANTHROPIC_API_KEY`
        (verified against `GET /v1/models`, which bills no tokens). **Not wired to CI**:
        `claude-review.yml` keeps its `pull_request` trigger commented — user decision to
        avoid per-PR API spend, `/code-review` locally covers it. The secret is therefore
        **optional** in Fase C.
  - [x] **GitHub — done 2026-07-20.** Org billing email = `admin@`. **PAT not rotated**
        (user decision): GitHub has no org-level PAT — every PAT is personal — and no
        workflow reads one (`GITHUB_TOKEN` is auto-injected and covers checkout/PR
        comments/releases). The existing personal PAT stays for local automation. Only
        revisit if a workflow ever needs to trigger another workflow.
- [x] **GitHub secrets reconciled — done 2026-08-04.** The 11 secrets now match exactly
      what the workflows read, all pointing at `ofpnglnnzpowlzsyfbit`. Secrets for retired
      services were deleted, and `NUXT_PUBLIC_*` was renamed to `NEXT_PUBLIC_*`.
- [ ] **Fase C — prod wiring** *(next)*: deploy to Cloudflare Workers, activate the
      workflows, turn on branch protection.
- [x] GitHub org renamed `forge-co-tech` → **`forgecompany-tech`** (2026-07-20); local
      remotes updated. GitHub redirects the old name, but re-check any webhook or
      integration that pins the old slug.
- Open (non-blocking): registro.br ownership CPF → CNPJ.

---

## Remaining work

### 1. Security
- [x] GitHub PAT tightened to Contents/PRs/Workflows/Actions R/W.
- [ ] *(optional)* Add **Secrets: R/W** to the fine-grained PAT if you want the `github`
  MCP tool / PAT to manage repo secrets (it currently can't; `gh` CLI auth was used).
- [ ] **Rate limiting is a known gap** — deferred with the rest of the observability stack
  (ADR-0007). Turnstile is the only protection on `POST /api/leads`. Revisit before any
  paid-traffic launch.

### 2. GitHub repo config
- [x] **Repo secrets reconciled — 2026-08-04.** Exactly 11, matching what the workflows
  read (`.github/SETUP.md`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SECRET_KEY`, `SUPABASE_DB_HOST`, `SUPABASE_DB_PASSWORD`, `NEXT_PUBLIC_SITE_URL`,
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY` (optional — `claude-review.yml` stays
  `workflow_dispatch`-only). Every Supabase value points at `ofpnglnnzpowlzsyfbit`.
  - `NEXT_PUBLIC_SITE_URL` is set to `https://forgecompany.example.com`, **not** the local value
    the root `.env` carries for dev.
- [ ] **Activate workflows** — uncomment the `on:` triggers in `.github/workflows/`
  `build.yml`, `deploy.yml`, `backup.yml` (`ci.yml` is already active). Merging a change
  under `.github/workflows/` needs the `workflow` scope — use the `gh` CLI with the
  fine-grained PAT via `GH_TOKEN`, or the web UI.
- [ ] **Branch protection** on `main` (Settings → Branches → Add rule):
  require PR + 1 approval; dismiss stale approvals; require the `Lint & Typecheck` status
  check; require up-to-date branches; no bypass. Record applied settings in
  `.github/SETUP.md`.

### 3. Deploy — Cloudflare Workers *(blocker)*
- [ ] First deploy: `pnpm run deploy` (`opennextjs-cloudflare build && wrangler deploy`),
  or activate `deploy.yml`.
- [ ] **Verify `CLOUDFLARE_API_TOKEN` is scoped for Workers deploy** — the value was
  minted for Pages; if `wrangler deploy` 403s, mint a token with *Workers Scripts: Edit*
  and update the secret + `.env`.
- [ ] Run `mise run preview` (local Workers runtime) before deploying — Workers-runtime
  problems surface there and not under `next dev`. Watch for `next/image` gaps and the
  emulated ISR cache key (`.claude/docs/TECHNICAL_REVIEW_CONTEXT7.md` §1–2).
- [ ] Plan B if OpenNext debugging exceeds ~1 day: **Vercel Pro** (ADR-0001) — deliberate,
  not improvised.
- [ ] Per-client **custom hostname** + SSL via Cloudflare for SaaS for the three MVP
  domains: `forgecompany.example.com`, `dellaquila.dev`,
  `imobiliaria.forgecompany.example.com` (see ADR-0001 & `docs/ADD_CLIENT.md`).

### 4. Visibility
- [ ] Enable **Cloudflare Web Analytics** per hostname in the Cloudflare dashboard
  (zero-config, no env var, no cookie banner).
- [ ] Confirm leads are readable in **Supabase Studio** on the prod project, filtered by
  `landing_page_id`.

---

## Gotchas / operational notes

- **Restart the dev server after editing the root `.env`** — env values are read at process
  start. `NEXT_PUBLIC_*` values are inlined at build time, so a changed one needs a rebuild
  for `mise run preview` / `mise run build`, not just a restart.
- **Root `.env` is the single source of truth** (gitignored): mise auto-loads it for tasks
  and the activated shell, and Next.js reads it natively from the project root. Keep values
  bare — no quotes, no inline `#` comments. Matrix: `docs/SECRETS.md`.
- **Supabase CLI always needs `--workdir infra`** — `infra/supabase/config.toml` is where
  the config lives. `supabase login` needs a TTY; set `SUPABASE_ACCESS_TOKEN` in the root
  `.env` instead (mise loads it, so CLI + Management API calls authenticate headlessly).
- **Local multi-tenant test:** open `http://forgecompany.localhost:3000`,
  `forge-motos.localhost:3000`, `clinica.localhost:3000`, `advocacia.localhost:3000`;
  `unknown.localhost:3000` → 404.
- **Merging PRs that touch `.github/workflows/`** needs the `workflow` scope — the
  fine-grained PAT has it (`GH_TOKEN=<pat> gh pr merge …`); the interactive `gh` login does
  not. Conversely, **setting secrets** needs the interactive `gh` login (classic `repo`
  scope); the fine-grained PAT lacks the Secrets permission.
- **zsh globs unquoted URLs** — always quote a URL with a query string in a shell command.

---

## Resume prompt (paste in a new session)

```
Read .claude/CLAUDE.md, .claude/docs/MVP_REWRITE_CONTEXT.md and docs/GO_LIVE.md in full.
We're mid MVP rewrite (ADR-0007): Next.js 16 + Supabase JSONB blocks + Cloudflare Workers.
Continue from the current Fase. Next up: <pick one — "finish Fase 0/1 (multi-tenant render
+ Forge Company content)" | "reconcile GitHub secrets + activate workflows + branch
protection" | "first deploy to Cloudflare Workers">.
Ask before commits and before installing dependencies; branch + PR for any commit.
```
