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
- [x] **Fase B — new accounts + keys** (all registered under `admin@`) — **complete
      2026-07-20**; every credential below re-issued and live-verified. Only `WHATSAPP_*`
      remains empty (Fase E) and the GitHub PAT was deliberately not rotated.
  - [x] **Supabase — done 2026-07-20.** Org "Forge Company"
        (`tnacbzhyknaylpljhktv`) → project **`ofpnglnnzpowlzsyfbit`** (`forge-pages`,
        sa-east-1, PG17). 4 migrations pushed (RLS on all tables), Edge Function
        `handle-lead-webhook` deployed (`verify_jwt=false`), Vault (`project_url`,
        `secret_key`), Database Webhook replaced by a SQL trigger `on_new_lead` on
        `leads` (reads the secret from Vault — no key hardcoded), retry cron active,
        legacy JWT keys disabled. **E2E verified**: lead insert → trigger → pg_net →
        function `200 {"ok":true}` → Resend email delivered → no `webhook_retries`.
        Prod URL/keys stored in the root `.env` `PROD_*` section (→ GitHub secrets in
        Fase C). **Caveat**: `WHATSAPP_*` not set (channel dormant, Fase E). Old personal
        project `wsfteewohhchwewwxnpn` still needs deleting (Fase D).
  - [x] **Resend — done 2026-07-20.** Send subdomain `send.forgecompany.example.com` added
        in Resend and **verified** (DKIM + MX + SPF, DNS on Cloudflare; keeps root-domain
        SPF/MX intact for Google Workspace). New sending-only API key
        (`re_…`, restricted — can send but not list). Three function secrets re-set on
        `ofpnglnnzpowlzsyfbit`: `RESEND_API_KEY`, `RESEND_FROM_EMAIL=leads@send.forgecompany.example.com`,
        `RESEND_NOTIFICATION_EMAIL=contato@forgecompany.example.com`. **E2E verified**: lead
        insert (publishable key) → trigger → function `200 {"ok":true}` → no
        `webhook_retries`; direct invoke also `200`, real email delivered to `contato@`.
  - [x] **PostHog — done 2026-07-20.** New project under `admin@`; `phc_…` key +
        `https://us.i.posthog.com`. Verified: capture endpoint returns `{"status":"Ok"}`.
  - [x] **Sentry — done 2026-07-20.** New org **`forge-company`** (US region) + project
        `forge-pages`; `sentry.sourceMapsUploadOptions.org` in `apps/web/nuxt.config.ts`
        updated from `forge-co-tech`. DSN (new org id, distinct from the old
        `o4511700188069888`) in `NUXT_PUBLIC_SENTRY_DSN` + `SENTRY_DSN`;
        **Organization Token** (`sntrys_…`, from Settings → Developer Settings →
        Organization Tokens) in `SENTRY_AUTH_TOKEN`. Verified: test envelope accepted
        (`200`), and `sentry-cli releases -o forge-company -p forge-pages list` exits 0
        (exits 1 on a bogus project) — source-map upload will authenticate.
  - [x] **Upstash — done 2026-07-20.** New account → Redis; REST URL/token verified
        (`PING` → `PONG`).
  - [x] **Anthropic — done 2026-07-20.** Key under `admin@` in `ANTHROPIC_API_KEY`
        (verified against `GET /v1/models`). **Not wired to CI**: `claude-review.yml`
        keeps its `pull_request` trigger commented (`workflow_dispatch` only) — user
        decision to avoid per-PR API spend, `/code-review` locally covers it. The secret
        is therefore optional in Fase C.
  - [x] **Cloudflare — done 2026-07-20.** Account already `admin@`. Prod Turnstile
        widget live (real site/secret keys replaced the `1x…` test pair; siteverify with
        a dummy token returns `invalid-input-response`, i.e. the secret resolves).
        Pages-scoped API token verified against
        `/accounts/{id}/pages/projects` (`200`, empty — no Pages project until Fase C).
        Note: an account-scoped token **401s** on `/user/tokens/verify` (that endpoint is
        user-scoped) — check it against an account endpoint instead.
  - [x] **GitHub — done 2026-07-20.** Org billing email = `admin@`. **PAT not rotated**
        (user decision): GitHub has no org-level PAT — every PAT is personal — and no
        workflow reads one (`GITHUB_TOKEN` is auto-injected and covers checkout/PR
        comments/releases). The existing personal PAT stays for local automation. Only
        revisit if a workflow ever needs to trigger another workflow.
- [ ] **Fase C — prod wiring** *(next)*: replace all 15 GitHub secrets + add the missing
      4 (`STRAPI_URL`, `SUPABASE_DB_HOST`, `FLIPT_URL`, `FLIPT_TOKEN` when they exist);
      `ANTHROPIC_API_KEY` is optional while `claude-review.yml` stays manual-only.
      Cloudflare Pages deploy; activate workflows; branch protection; UptimeRobot
      (under `admin@`).
- [ ] **Fase D — revocation**: revoke every personal-account key (the `OLD_*` section in
      the root `.env` lists the pending ones — delete the section when done), delete the
      old Supabase project, close/detach personal accounts.
- [ ] **Fase E (parallel, slow)** — WhatsApp Cloud API under a Forge Company Meta
      Business Manager (needs CNPJ business verification; channel stays dormant until
      then).
- [x] GitHub org renamed `forge-co-tech` → **`forgecompany-tech`** (2026-07-20); local
      remotes updated. GitHub redirects the old name, but re-check webhooks/integrations
      that pin the old slug. The Sentry org slug is unrelated and was replaced separately
      in Fase B (`forge-co-tech` → `forge-company` in `apps/web/nuxt.config.ts`; check
      `.claude/AGENTS.md` still matches).
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

### 4. Always-on services — VPS + Cloudflare Tunnel + Access *(Strapi is a blocker)*
Host decided (ADR 0003): one **AWS Lightsail São Paulo 2 GB** VPS runs Strapi + NocoDB +
Flipt via Docker Compose (`infra/vps/`), fronted by Cloudflare Tunnel (no public ports) and
gated by Cloudflare Access. **Full step-by-step runbook: `infra/vps/README.md`.**
- [ ] Provision the Lightsail VM (swap + Docker + SSH-only firewall) — README Step 1.
- [ ] Fill `infra/vps/forge-services.env` on the VM: fresh Strapi secrets, prod
  `DATABASE_URL` (currently local Supabase PG), `SUPABASE_S3_*`, `NC_AUTH_JWT_SECRET` — Step 3.
  Strapi must be reachable in prod or pages render with theme but no blocks.
- [ ] Create the Cloudflare Tunnel + `cms./db./flags.forgecompany.example.com` DNS routes — Step 4.
- [ ] Add a Cloudflare Access application per hostname (policy: `@forgecompany.example.com`) — Step 5.
- [ ] Deploy + verify (Step 6–7); set `STRAPI_URL`/`FLIPT_URL` to the tunnel hostnames.
  Nuxt→Strapi server calls behind Access need an Access **service token** (see README Step 7).
- Fallback if Lightsail trial/credits run out: Oracle Always Free (if A1 capacity frees up)
  or Fly.io `gru`/Cloudflare Containers — same compose, both rejected as primary (ADR 0003).

### 5. Activate parked integrations (wired, currently no-op)
- [x] **Turnstile** — real site/secret keys in the root `.env` (test `1x…` pair gone);
  secret validated via siteverify. Run `mise run env:sync` after any further edit.
- [x] **Sentry** — DSN + org token set and validated (org `forge-company`, project
  `forge-pages`); test envelope accepted. Still to confirm in prod: a real error lands
  after deploy, and the **server** SDK works on the Workers runtime (see §3).
- [x] **PostHog** — key validated (capture → `Ok`). Still to confirm: Live Events after
  deploy.
- [x] **Resend** — sender domain `send.forgecompany.example.com` verified; function secrets
  set (`RESEND_FROM_EMAIL=leads@send.forgecompany.example.com`). Live send confirmed.
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
