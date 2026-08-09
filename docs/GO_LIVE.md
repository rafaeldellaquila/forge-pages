# forge-pages — Go-Live / Remaining Work

> Snapshot: **2026-08-05**. Living checklist of what's left before onboarding the first
> paying client, plus notes to resume in a fresh session. Update as items are completed.

---

## Where the project stands

- **MVP rewrite in progress (ADR-0007)**: Next.js 16 + React 19 + Supabase JSONB blocks +
  Cloudflare Workers. The previous Nuxt/Strapi/NocoDB/observability/VPS stack was dropped
  — anything below that looks like it "vanished" is explained in
  `docs/adr/0007-drop-strapi-nocodb-observability-vps.md` and `docs/HISTORY.md`.
- Local dev bootstraps with `bash .claude/skills/onboard-local/setup.sh` (or the
  `onboard-local` skill), then `mise run dev`.
- Company account migration Fases A + B are complete (below); Fase C (prod wiring) is in
  progress — see §2/§3 below and `.claude/rules/phase-history.md`'s Fase 4 entry for the
  detailed, continuously-updated record.

**True blocker to go live:** deploying to Cloudflare Workers with the three MVP domains
resolving, each with a real WhatsApp number. Everything else is config / hardening / ops.

### MVP phases (`.claude/docs/MVP_REWRITE_CONTEXT.md`)

| Fase | Focus | Status |
|---|---|---|
| 0 | Reset repo, infra, docs | done 2026-08-04 |
| 1 | Core multi-tenant + Forge Company real content | done 2026-08-05 |
| 2 | Lead capture (form → Supabase) | done 2026-08-05 |
| 3 | Second/third tenant (`dellaquila.dev`, `imobiliaria.forgecompany.example.com`) | done 2026-08-05 |
| 4 | Deploy (Cloudflare Workers, 3 domains live) | in progress |
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
- [x] **Repo secrets reconciled — 2026-08-04.** Matching what the workflows
  read (`.github/SETUP.md`): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
  `SUPABASE_SECRET_KEY`, `SUPABASE_DB_HOST`, `SUPABASE_DB_PASSWORD`,
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `CLOUDFLARE_API_TOKEN`,
  `CLOUDFLARE_ACCOUNT_ID`, `ANTHROPIC_API_KEY` (optional — `claude-review.yml` stays
  `workflow_dispatch`-only). Every Supabase value points at `ofpnglnnzpowlzsyfbit`.
  Confirmed via `gh secret list` on 2026-08-05: all still present.
  - `NEXT_PUBLIC_SITE_URL` was removed 2026-08-05 (repo files + the GitHub secret) —
    grepping the app found zero consumers; canonical URLs already come from the
    per-tenant `landing_pages.canonical_url` column (`app/layout.tsx`'s
    `generateMetadata`), which is the only correct source in a multi-tenant-by-domain
    app — there is no single "the site" URL to hold.
- [ ] **Activate workflows** — uncomment the `on:` triggers in `.github/workflows/`
  `build.yml`, `deploy.yml`, `backup.yml` (`ci.yml` is already active). Merging a change
  under `.github/workflows/` needs the `workflow` scope — use the `gh` CLI with the
  fine-grained PAT via `GH_TOKEN`, or the web UI.
- [ ] **Branch protection** on `main` — **deliberately skipped, 2026-08-06, revisit if
  the plan or team changes.** Neither classic branch protection nor GitHub's newer
  Rulesets can be enforced on a private repo below **GitHub Team** — confirmed via a
  direct `gh api PUT .../branches/main/protection` call (403: "Upgrade to GitHub Pro or
  make this repository public") even with admin access, and independently via GitHub's
  own community docs (rulesets have the identical restriction; Free-plan private repos
  get neither feature). The org owner declined the paid upgrade and declined making the
  repo public, so there is currently no way to get platform-enforced protection on
  `main` — `git push` directly to `main` and unreviewed merges are technically possible
  until one of those changes. Compensate with process discipline (PR review by habit)
  in the meantime. If this ever becomes unacceptable, the only two unlocks are: upgrade
  the `forgecompany-tech` org to GitHub Team, or make the repo public.

### 3. Deploy — Cloudflare Workers *(blocker)*
- [x] `opennextjs-cloudflare build` + `wrangler deploy --dry-run` — done 2026-08-05, both
  clean (all routes still `ƒ` dynamic per ADR-0008; upload 6.5 MB / 1.3 MB gzip; bindings
  `WORKER_SELF_REFERENCE`/`IMAGES`/`ASSETS` all resolved). Proves the build path, not a
  real deploy — no Worker was uploaded.
- [x] **`CLOUDFLARE_API_TOKEN` Workers scope — checked 2026-08-05, looks fine.** A direct
  `GET /accounts/{id}/workers/scripts` call succeeded (`success: true`), which a
  Pages-only token could not do. Read access is confirmed; write (`Edit`) is only
  provable by an actual deploy — the original "minted for Pages" fear looks unfounded
  but isn't 100% ruled out until the first real `wrangler deploy`.
- [ ] First real deploy: `pnpm run deploy` (`opennextjs-cloudflare build && wrangler
  deploy`), or run `deploy.yml` once via `workflow_dispatch` as a controlled first
  attempt. `deploy.yml` now pushes runtime secrets correctly (see
  `.claude/rules/phase-history.md`'s Fase 4 entry — it previously only reached
  `NEXT_PUBLIC_*` build-time inlining and would have 500'd on first Supabase access).
- [ ] Run `mise run preview` (local Workers runtime) before deploying — Workers-runtime
  problems surface there and not under `next dev`. Watch for `next/image` gaps and the
  emulated ISR cache key (`.claude/docs/TECHNICAL_REVIEW_CONTEXT7.md` §1–2).
- [ ] Plan B if OpenNext debugging exceeds ~1 day: **Vercel Pro** (ADR-0001) — deliberate,
  not improvised.
- [ ] Real tenant content for the three MVP domains: drafted and dry-run-verified
  2026-08-05, handed to the user as ready-to-paste SQL for Supabase Studio (cloud
  `clients`/`landing_pages`/`leads` were confirmed completely empty beforehand — this
  is a first insert, not a promotion). Rows land as `status = 'draft'`.
- [ ] Real WhatsApp numbers for all three tenants — still placeholders as of 2026-08-05.
- [ ] Per-client **custom hostname** + SSL via Cloudflare for SaaS for the three MVP
  domains: `forgecompany.example.com`, `dellaquila.dev`,
  `imobiliaria.forgecompany.example.com` (see ADR-0001 & `docs/ADD_CLIENT.md`). **No API
  integration code exists for this** — confirmed by reading ADR-0001, which always
  described this as "to be wired when the first client is onboarded." For exactly 3
  known domains, manual per-domain setup in the Cloudflare dashboard is the right call
  now; building Cloudflare for SaaS API automation for a fixed, small tenant count
  would be premature (CLAUDE.md §10 rules out solving problems that don't exist yet).
- [ ] Flip each promoted `landing_pages.status` to `'published'` only after both its
  WhatsApp number and its domain are real — RLS already scopes the publishable key to
  `published` rows, so a `draft` row is invisible to visitors even once DNS resolves.

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
Read .claude/CLAUDE.md, .claude/docs/MVP_REWRITE_CONTEXT.md and docs/GO_LIVE.md in full,
plus .claude/rules/phase-history.md's Fase 4 entry for the detailed record. We're mid MVP
rewrite (ADR-0007): Next.js 16 + Supabase JSONB blocks + Cloudflare Workers. Fases 0-3 are
done; we're in Fase 4 (deploy). Branch protection on main is a deliberately accepted gap
(GitHub plan limitation, not a task) — don't re-open it unless I say the plan changed.

Walk me through these, one at a time, in this order — tell me exactly what to do/click for
each, wait for me to confirm it's done before moving on:

1. WhatsApp: give me the real numbers to swap in for Forge Company, dellaquila.dev, and
   Horizonte Imóveis (currently placeholders in the seed + the draft Studio SQL).
2. Turnstile: check the widget's Hostname Management in the Cloudflare dashboard, add
   `localhost` if it's missing, then do the real human-solve browser test.
3. Paste the drafted tenant SQL into Supabase Studio's SQL editor (cloud project
   ofpnglnnzpowlzsyfbit) — rows land as status='draft'.
4. DNS + Cloudflare for SaaS: add forgecompany.example.com, dellaquila.dev, and
   imobiliaria.forgecompany.example.com as custom hostnames pointing at the Worker (manual
   dashboard setup — no API integration code exists for this yet, and building one for
   3 fixed domains would be premature).
5. Once a tenant's number and domain are both real: flip its landing_pages.status to
   'published'.

After all five: activate deploy.yml's trigger (or run it once via workflow_dispatch) and
do the first real wrangler deploy.

Ask before commits, before installing dependencies, and before running migrations.
```
