# Repository Setup — GitHub Secrets & Workflows

All secrets are configured in: **Settings → Secrets and variables → Actions**.

Most workflows are created in **inactive** state (`workflow_dispatch` only). Real triggers
are present but commented out in each file — activate them when ready (see bottom).
`ci.yml` is already active on push and PR.

## Required secrets

These 11 are exactly what the workflows read — nothing else should be configured. Every
Supabase value points at the single cloud project this repo targets,
**`ofpnglnnzpowlzsyfbit`** (org Forge Company). The values are mirrored in the root `.env`
(`PROD_*` for the Supabase ones), except `NEXT_PUBLIC_SITE_URL`, which is the production
domain here and a localhost URL in local dev.

### Supabase
- `SUPABASE_URL` — Project URL
- `SUPABASE_PUBLISHABLE_KEY` — Publishable key (`sb_publishable_...`, safe for client)
- `SUPABASE_SECRET_KEY` — Secret key (`sb_secret_...`, server-side only)
- `SUPABASE_DB_HOST` — Direct database host (for the backup workflow's `pg_dump`)
- `SUPABASE_DB_PASSWORD` — Database password

### App
- `NEXT_PUBLIC_SITE_URL` — canonical production URL (e.g. `https://forgecompany.example.com`)

### Cloudflare Turnstile
- `TURNSTILE_SECRET_KEY` — server-side siteverify secret
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public widget site key (baked into the client bundle at build)

### Cloudflare (deployment — see `docs/adr/0001-hosting-cloudflare.md`)
- `CLOUDFLARE_API_TOKEN` — Workers deploy token (needs *Workers Scripts: Edit*)
- `CLOUDFLARE_ACCOUNT_ID`

### Claude (for the PR-review workflow — optional)
- `ANTHROPIC_API_KEY` — only needed if `claude-review.yml` is run

> Hosting note: the app deploys to **Cloudflare Workers** via `@opennextjs/cloudflare`
> (`opennextjs-cloudflare build` → `.open-next/`, then `wrangler deploy` with
> `wrangler.jsonc`). Vercel Pro is the documented Plan B (ADR 0001). There are no
> always-on internal services to host — content lives in Supabase and is edited in
> Supabase Studio (ADR 0007).

## Workflows

| File | Purpose | Activate by |
|---|---|---|
| `ci.yml` | Biome lint + `tsc` typecheck | already active (`push` + `pull_request`) |
| `build.yml` | `next build` on PRs | uncomment the `pull_request` trigger |
| `deploy.yml` | OpenNext build + `wrangler deploy` to Cloudflare Workers | uncomment the `push` trigger (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`) |
| `backup.yml` | daily `pg_dump` → commit to repo | uncomment the `schedule` cron |
| `claude-review.yml` | Claude reviews PR vs CLAUDE.md | uncomment the `pull_request` trigger (needs `ANTHROPIC_API_KEY`) |

### Activating a workflow
1. Edit `.github/workflows/<workflow>.yml`
2. Uncomment the `on:` trigger block (`push` / `pull_request` / `schedule`)
3. Keep or remove the `workflow_dispatch` block
4. Commit and push

## Branch protection (manual — Settings → Branches → rule for `main`)
- Require a pull request before merging (1 review)
- Dismiss stale approvals on new commits
- Require status checks to pass (`Lint & Typecheck` from `ci.yml`)
- Require branches to be up to date before merging
- Do not allow bypassing the above

Document the applied settings here once configured.
