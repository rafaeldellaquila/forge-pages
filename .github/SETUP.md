# Repository Setup — GitHub Secrets & Workflows

All secrets are configured in: **Settings → Secrets and variables → Actions**.

Workflows are created in **inactive** state (`workflow_dispatch` only). Real triggers are
present but commented out in each file — activate them when ready (see bottom).

## Required secrets

### Supabase
- `SUPABASE_URL` — Project URL
- `SUPABASE_PUBLISHABLE_KEY` — Publishable key (`sb_publishable_...`, safe for client)
- `SUPABASE_SECRET_KEY` — Secret key (`sb_secret_...`, server-side only)
- `SUPABASE_DB_HOST` — Direct database host (for the backup workflow's `pg_dump`)
- `SUPABASE_DB_PASSWORD` — Database password

### Strapi
- `STRAPI_URL` — Production Strapi URL
- `STRAPI_API_TOKEN` — Read-only API token

### Upstash
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Cloudflare Turnstile
- `TURNSTILE_SECRET_KEY`
- `NUXT_PUBLIC_TURNSTILE_SITE_KEY`

### PostHog
- `NUXT_PUBLIC_POSTHOG_KEY` — public Project API Key (`phc_...`)
- `NUXT_PUBLIC_POSTHOG_HOST` — region host (`https://us.i.posthog.com` or `.../eu...`)

### Sentry
- `NUXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` — for source-map uploads (prod only)

### Flipt
- `FLIPT_URL`
- `FLIPT_TOKEN`

### Cloudflare (deployment — when the web app is deployed; see docs/adr/0001-hosting-cloudflare.md)
- `CLOUDFLARE_API_TOKEN` — Workers/Pages deploy token
- `CLOUDFLARE_ACCOUNT_ID`

### Claude (for the PR-review workflow)
- `ANTHROPIC_API_KEY`

> Hosting note: the web app targets **Cloudflare Workers/Pages** (Nitro `cloudflare`
> preset). Koyeb and Domainee are no longer used (ADR 0001). Strapi/Flipt/NocoDB
> deployment is deferred — no secrets needed for them until a host is chosen.

## Workflows

| File | Purpose | Activate by |
|---|---|---|
| `ci.yml` | Biome lint + `tsc` typecheck | uncomment the `push`/`pull_request` trigger |
| `build.yml` | `nuxt build` on PRs | uncomment the `pull_request` trigger |
| `backup.yml` | daily `pg_dump` → commit to repo | uncomment the `schedule` cron |
| `claude-review.yml` | Claude reviews PR vs CLAUDE.md | uncomment the `pull_request` trigger (needs `ANTHROPIC_API_KEY`) |
| `deploy.yml` | build (`cloudflare-pages` preset) + deploy web to Cloudflare Pages | uncomment the `push` trigger (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`) |

### Activating a workflow
1. Edit `.github/workflows/<workflow>.yml`
2. Uncomment the `on:` trigger block (`push` / `pull_request` / `schedule`)
3. Keep or remove the `workflow_dispatch` block
4. Commit and push

## Branch protection (manual — Settings → Branches → rule for `main`)
- Require a pull request before merging (1 review)
- Dismiss stale approvals on new commits
- Require status checks to pass (add `Lint & Typecheck` once `ci.yml` is active)
- Require branches to be up to date before merging
- Do not allow bypassing the above

Document the applied settings here once configured.
