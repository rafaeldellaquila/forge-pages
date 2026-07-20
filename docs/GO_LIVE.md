# forge-pages — Go-Live / Remaining Work

> Snapshot: **2026-07-20**. Living checklist of what's left before onboarding the first
> paying client, plus notes to resume in a fresh session. Update as items are completed.

---

## Where the project stands

- All 6 build phases are complete and merged to `main`.
- Local dev is fully working: 3 demo tenants on `*.localhost`, fully styled, lead capture
  E2E. Bootstrap with `bash .claude/skills/onboard-local/setup.sh` (or the `onboard-local`
  skill), then `cd apps/cms && node scripts/seed-content.cjs` for published content.
- 15 GitHub Actions **repo secrets are configured** (see below).
- Root `.env` cleaned (dead keys removed, naming fixed).

**True blockers to go live:** deploying the web app (Cloudflare Pages) and hosting Strapi
so the CMS is reachable in production. Everything else is config / hardening / ops.

---

## Done recently (context for next session)

- Multi-tenant local demo: `infra/supabase/seed/{01_clients,02_landing_pages}.sql` (3
  tenants) + `apps/cms/scripts/seed-content.cjs` (idempotent, Document Service, publishes;
  **replaces** each domain on run). Onboarding guide: `docs/ADD_CLIENT.md`.
- Tailwind fix: `packages/config/tailwind.css` has `@source "../ui/src"` so block
  utilities in `@forge-pages/ui` are generated (they were being dropped).
- Dependabot PRs #5/#6/#7 + feature PR #8 merged.
- `.env` cleanup: removed `DOMAINEE_API_KEY`, `STRAPI_API_TOKEN_READ_ONLY`,
  `NUXT_SECRET_KEY`, and the unused/broken Cloudflare **R2** keys; renamed
  `UPSTASH_API_TOKEN`→`UPSTASH_REDIS_REST_TOKEN` and `CLOUD_FLARE_*`→`CLOUDFLARE_*`.
- Repo secrets set (15): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
  `SUPABASE_DB_PASSWORD`, `STRAPI_API_TOKEN`, `UPSTASH_REDIS_REST_URL`,
  `UPSTASH_REDIS_REST_TOKEN`, `TURNSTILE_SECRET_KEY`, `NUXT_PUBLIC_TURNSTILE_SITE_KEY`,
  `NUXT_PUBLIC_POSTHOG_KEY`, `NUXT_PUBLIC_POSTHOG_HOST`, `NUXT_PUBLIC_SENTRY_DSN`,
  `SENTRY_AUTH_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`.
  **All 15 hold personal-account values — every one gets replaced during the company
  migration (Fase C below).**
- **2026-07-20 — env management reorganized (migration Fase A)**: root `.env` is the
  single source of truth, `mise run env:sync` regenerates `apps/*/.env`, matrix in
  `docs/SECRETS.md`, per-app `.env.example` files removed, root `.env.example` rewritten.

---

## Company account migration (Forge Company)

Context: the company now exists — domain **forgecompany.example.com** (registro.br, DNS on
Cloudflare, Google Workspace). `admin@forgecompany.example.com` (alias of `contato@`) is the
registration email for all infra; `contato@` is the public/reply address. Cloudflare and
GitHub are already registered under `admin@`. **Everything else is on a personal account
and must be recreated — no key is reused; all current keys get revoked at the end.**

Decisions taken (2026-07-20): Supabase = **new project from scratch** (not a transfer);
environments = **local dev / cloud prod** (no second cloud project); envs = root `.env`
single source + `docs/SECRETS.md` matrix.

- [x] **Fase A — repo**: env reorg (done 2026-07-20, see above).
- [ ] **Fase B — new accounts + keys** (all registered under `admin@`):
  - [ ] Supabase: org "Forge Company" → new project (sa-east-1, PG17) → `supabase link`
        (`--workdir infra`) → `db push` → deploy `handle-lead-webhook`
        (`verify_jwt = false`) → function secrets (`RESEND_*`, `WHATSAPP_*`) → Vault
        (`project_url`, `secret_key`) → Database Webhook `on-new-lead` → disable legacy
        JWT keys. New ref/URL/keys everywhere; then delete the old project
        (`wsfteewohhchwewwxnpn`, test data only).
  - [ ] Resend: verify send subdomain `send.forgecompany.example.com` (keeps root-domain
        SPF/MX with Google Workspace); `RESEND_FROM_EMAIL=leads@send.forgecompany.example.com`,
        `RESEND_NOTIFICATION_EMAIL=contato@forgecompany.example.com`.
  - [ ] PostHog: new org + project → new `phc_…` key.
  - [ ] Sentry: new org + Nuxt project → new DSN + source-map auth token (update
        `sentry.sourceMapsUploadOptions.org` in `apps/web/nuxt.config.ts`).
  - [ ] Upstash: new account → new Redis → REST URL/token.
  - [ ] Anthropic: console under `admin@` → key for `claude-review.yml`.
  - [ ] Cloudflare (account already `admin@`): prod Turnstile widget for
        `forgecompany.example.com` + client domains; Pages-scoped deploy token.
  - [ ] GitHub: confirm org billing email = `admin@`; new fine-grained PAT.
- [ ] **Fase C — prod wiring**: replace all 15 GitHub secrets + add the missing 5
      (`ANTHROPIC_API_KEY`, `STRAPI_URL`, `SUPABASE_DB_HOST`, `FLIPT_URL`, `FLIPT_TOKEN`
      when they exist); Cloudflare Pages deploy; activate workflows; branch protection;
      UptimeRobot (under `admin@`).
- [ ] **Fase D — revocation**: revoke every personal-account key (the `OLD_*` section in
      the root `.env` lists the pending ones — delete the section when done), delete the
      old Supabase project, close/detach personal accounts.
- [ ] **Fase E (parallel, slow)** — WhatsApp Cloud API under a Forge Company Meta
      Business Manager (needs CNPJ business verification; channel stays dormant until
      then).
- [x] GitHub org renamed `forge-co-tech` → **`forgecompany-tech`** (2026-07-20); local
      remotes updated. GitHub redirects the old name, but re-check webhooks/integrations
      that pin the old slug. The Sentry org slug (`forge-co-tech` in
      `apps/web/nuxt.config.ts` + `.claude/AGENTS.md`) is unrelated — it gets replaced
      with the new Sentry org in Fase B.
- Open (non-blocking): registro.br ownership CPF → CNPJ.

---

## Remaining work

### 1. Security — mostly done
- [x] Removed stray `sk_live_` (Domainee) key and cleaned `.env`.
- [x] GitHub PAT tightened to Contents/PRs/Workflows/Actions R/W.
- [ ] *(optional)* Add **Secrets: R/W** to the fine-grained PAT if you want the `github`
  MCP tool / PAT to manage repo secrets (it currently can't; `gh` CLI auth was used).

### 2. GitHub repo config
- [x] Repo secrets added (15 — list above).
- [ ] Add the **5 still-missing secrets** once their services exist: `ANTHROPIC_API_KEY`
  (CI PR review), `STRAPI_URL` (prod Strapi), `SUPABASE_DB_HOST` (backup pg_dump),
  `FLIPT_URL`, `FLIPT_TOKEN`.
- [ ] **Activate workflows** — uncomment the `on:` triggers in `.github/workflows/`
  `ci.yml`, `build.yml`, `claude-review.yml`, `backup.yml` (currently
  `workflow_dispatch`-only). Needs the `workflow` OAuth scope to merge — use the `gh`
  CLI with the fine-grained PAT via `GH_TOKEN`, or the web UI.
- [ ] **Branch protection** on `main` (Settings → Branches → Add rule):
  require PR + 1 approval; dismiss stale approvals; require status checks
  (add `Lint & Typecheck` **after** `ci.yml` has run once); require up-to-date branches;
  no bypass. Record applied settings in `.github/SETUP.md`.

### 3. Deploy web app — Cloudflare Pages *(blocker)*
- [ ] First deploy: `pnpm --filter web deploy:cloudflare` (or activate `deploy.yml`).
- [ ] **Verify `CLOUDFLARE_API_TOKEN` is scoped for Pages/Workers deploy** — the current
  value is a `cfat_…` token that may be R2-only; if deploy 403s, mint a token with
  *Cloudflare Pages: Edit* and update the secret + `.env`.
- [ ] Verify Sentry **server** SDK on the Workers runtime (`nodejs_compat`); switch to
  `@sentry/cloudflare` if it misbehaves (noted in `docs/LOCAL_DEVELOPMENT.md §12`).
- [ ] Per-client **custom hostname** + SSL via Cloudflare for SaaS (see ADR 0001 &
  `docs/ADD_CLIENT.md`).

### 4. Always-on services (no free tier — deferred) *(Strapi is a blocker)*
- [ ] **Strapi** — pick a host; set prod `DATABASE_URL` (currently local Supabase PG);
  verify S3 upload (Supabase Storage bucket + `SUPABASE_S3_*`). Must be reachable in prod
  or pages render with theme but no blocks.
- [ ] **Flipt** — run a server; set `FLIPT_URL`/`FLIPT_TOKEN` (until then: fails open).
- [ ] **NocoDB** — self-host; point at Supabase Postgres for partner lead management.

### 5. Activate parked integrations (wired, currently no-op)
- [ ] **Turnstile** — swap the test keys in the root `.env` for real site/secret keys
  (`mise run env:sync` after; widget is wired → real keys will enforce).
- [ ] **Sentry** — confirm errors land once DSN is live in prod.
- [ ] **PostHog** — confirm Live Events after deploy.
- [ ] **Resend** — verify a real sender domain; update `RESEND_FROM_EMAIL`
  (currently `noreply@dellaquila.dev`).
- [ ] **WhatsApp** — set `WHATSAPP_*` secrets in Supabase (channel dormant until then).

### 6. Manual dashboards
- [ ] **UptimeRobot** monitors (web + Strapi).
- [ ] **NocoDB** partner workspace (after §4).
- [ ] **Cloudflare** custom hostnames per client at onboarding.

---

## Gotchas / operational notes

- **Restart `dev:web` after editing `apps/web/.env`** — Nuxt bakes `runtimeConfig` at
  startup; a stale server throws `supabaseUrl is required`.
- **Root `.env` is the single source of truth** (gitignored): edit it, then
  `mise run env:sync` regenerates `apps/web/.env` + `apps/cms/.env` (GENERATED — never
  edit by hand). mise auto-loads the root `.env` for tasks and the activated shell.
  Matrix: `docs/SECRETS.md`.
- **Strapi 5 REST creates drafts only** — seed *published* content via the Document
  Service script (`apps/cms/scripts/seed-content.cjs`), which must be `.cjs`.
- **Local multi-tenant test:** open `http://forge-motos.localhost:3001`,
  `clinica.localhost:3001`, `advocacia.localhost:3001`; `unknown.localhost:3001` → 404.
- **Merging PRs that touch `.github/workflows/`** needs the `workflow` scope — the
  fine-grained PAT has it (`GH_TOKEN=<pat> gh pr merge …`); the interactive `gh` login
  does not. Conversely, **setting secrets** needs the interactive `gh` login (classic
  `repo` scope); the fine-grained PAT lacks the Secrets permission.

---

## Resume prompt (paste in a new session)

```
Read .claude/CLAUDE.md and docs/GO_LIVE.md in full. We're past all 6 build phases;
local dev + multi-tenant demo work and 15 GitHub repo secrets are set. Continue the
Go-Live checklist. Next up: <pick one — "activate GitHub workflows + branch protection"
| "deploy the web app to Cloudflare Pages" | "decide Strapi production hosting">.
Ask before commits and before installing dependencies; branch + PR for any commit.
```
