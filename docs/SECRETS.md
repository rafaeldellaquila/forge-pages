# Secrets & Environment Variables

How env vars flow through the project, and where each value lives per environment.

## Model

- **Root `.env`** (gitignored) is the **single source of truth** for local values.
  Edit it, then run `mise run env:sync` — this regenerates `apps/web/.env` and
  `apps/cms/.env` (both carry a `GENERATED` header; never edit them by hand).
- **mise auto-loads the root `.env`** (`[env] _.file` in `.mise.toml`) for every task
  and the activated shell, so CLI tooling (`supabase`, `wrangler`, backup tasks) sees
  the same values.
- **Local = dev, cloud = prod.** The root `.env` holds *dev* values only, plus a
  `CLOUD OPS` section with tooling credentials. Production values never live in local
  files — they are injected where they run (table below).
- Restart dev servers after a sync — Nuxt bakes `runtimeConfig` at startup.

Production injection points:

| Point | What it feeds |
|---|---|
| **GitHub Actions secrets** | CI, builds, deploy, backup workflows (`.github/SETUP.md`) |
| **Cloudflare Pages/Workers env** | Nuxt server runtime in prod |
| **Supabase Edge Function secrets** | `handle-lead-webhook` (`supabase secrets set --workdir infra`) |
| **Supabase Vault** | `project_url` / `secret_key` used by pg_net retry cron |
| **Strapi host dashboard** | CMS in prod (host not chosen yet — deferred) |

## Matrix

Consumers: `web` = Nuxt · `cms` = Strapi · `edge` = Supabase Edge Function ·
`ci` = GitHub Actions · `ops` = local CLI/tooling only.

### Supabase

| Variable | Consumer | Dev (root `.env`) | Prod |
|---|---|---|---|
| `SUPABASE_URL` | web | local stack (`http://127.0.0.1:54321`) | GH secret + CF Pages env |
| `SUPABASE_PUBLISHABLE_KEY` | web (public) | from `supabase status` | GH secret + CF Pages env |
| `SUPABASE_SECRET_KEY` | web (server) | from `supabase status` | GH secret + CF Pages env |
| `SUPABASE_PROJECT_REF` | ops | cloud project ref | — (ops only) |
| `SUPABASE_DB_HOST` / `SUPABASE_DB_PASSWORD` | ops, ci (backup) | cloud DB (ops) | GH secret (backup.yml) |

### Strapi

| Variable | Consumer | Dev | Prod |
|---|---|---|---|
| `STRAPI_URL` | web | `http://localhost:1337` | GH secret + CF Pages env |
| `STRAPI_API_TOKEN` | web | local read-only token | GH secret + CF Pages env |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY` | cms | generated per machine (`openssl rand -base64 16`) | Strapi host dashboard |
| `DATABASE_*` | cms | local Supabase PG (`127.0.0.1:54322`) | `DATABASE_URL` on Strapi host |
| `SUPABASE_S3_*` | cms | empty (local disk uploads) | Strapi host dashboard |

### Integrations

| Variable | Consumer | Dev | Prod |
|---|---|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | web (server) | dev Redis or empty (skip) | GH secret + CF Pages env |
| `TURNSTILE_SECRET_KEY` | web (server) | test key `1x0…AA` or empty | GH secret + CF Pages env |
| `NUXT_PUBLIC_TURNSTILE_SITE_KEY` | web (public) | test key `1x…AA` or empty | GH secret (baked at build) |
| `NUXT_PUBLIC_POSTHOG_KEY` / `_HOST` | web (public) | empty (analytics off) | GH secret (baked at build) |
| `NUXT_PUBLIC_SENTRY_DSN` | web | empty (Sentry no-op) | GH secret (baked at build) |
| `SENTRY_DSN` | cms | empty | Strapi host dashboard |
| `SENTRY_AUTH_TOKEN` | ci (source maps) | — | GH secret |
| `FLIPT_URL` / `FLIPT_TOKEN` | web (server) | empty (fails open) | GH secret + CF Pages env |
| `NUXT_PUBLIC_SITE_URL` | web, cms (CORS) | empty | GH secret + CF Pages env |

### Lead notifications (Edge Function)

| Variable | Consumer | Dev | Prod |
|---|---|---|---|
| `RESEND_API_KEY` | edge | local `functions serve` env | Supabase function secrets |
| `RESEND_FROM_EMAIL` | edge | — | verified sender, e.g. `leads@send.forgecompany.example.com` |
| `RESEND_NOTIFICATION_EMAIL` | edge | — | `contato@forgecompany.example.com` |
| `WHATSAPP_ACCESS_TOKEN` / `_PHONE_NUMBER_ID` / `_NOTIFICATION_NUMBER` | edge | empty (channel skipped) | Supabase function secrets |
| `project_url` / `secret_key` | pg_net retry cron | local Vault (seeded) | Supabase Vault |

### Ops / CI only

| Variable | Consumer | Dev | Prod |
|---|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | ops | personal access token (headless CLI + Management API auth) | — (ops only) |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | ops, ci (deploy) | ops | GH secret |
| `ANTHROPIC_API_KEY` | ci (PR review) | — | GH secret |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | ops | fine-grained PAT | — |
| `STRAPI_MCP_ADMIN_TOKEN` | ops | Strapi admin token, empty → strapi-mcp unauthenticated | — (ops only) |

## Rules

- Never commit `.env` files or log secret values.
- New variable? Add it to: root `.env.example`, the `env:sync` allowlist in `.mise.toml`
  (if an app consumes it), this matrix, and `.github/SETUP.md` (if CI needs it).
- Rotation: prod keys are replaced by updating the injection point (GH secret /
  dashboard) — local `.env` only ever holds dev values.
- The `OLD_*` section in the root `.env` holds personal-account values pending
  revocation during the Forge Company migration (see `docs/GO_LIVE.md`) — delete the
  section once revoked.
- The `PROD_*` section in the root `.env` holds the new cloud (prod) Supabase
  URL/keys, staged for injection as GitHub secrets in migration Fase C. Nothing local
  reads them (`local = dev`); they are not synced to the app `.env` files.
