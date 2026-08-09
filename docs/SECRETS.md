# Secrets & Environment Variables

How env vars flow through the project, and where each value lives per environment.

## Model

- **Root `.env`** (gitignored) is the **single source of truth** for local values. There is
  no per-app fan-out: **mise auto-loads it** (`[env] _.file` in `.mise.toml`) for every task
  and the activated shell, and **Next.js reads it natively** from the project root.
- `NEXT_PUBLIC_*` vars are **inlined into the client bundle at build time**. Never put a
  secret behind that prefix, and remember a changed value needs a rebuild, not just a
  restart.
- **Local = dev, cloud = prod.** The root `.env` holds *dev* values only, plus a
  `CLOUD OPS` section with tooling credentials for this machine. Production values never
  live in local files — they are injected where they run (table below).
- Restart the dev server after editing `.env` — the values are read at process start.

Production injection points:

| Point | What it feeds |
|---|---|
| **GitHub Actions secrets** | CI, build, deploy, backup workflows (`.github/SETUP.md`) |
| **Cloudflare Workers env / secrets** | the app's server runtime in prod |
| **Supabase Vault** | DB-side secrets, if a migration ever needs one |

## Matrix

Consumers: `app` = the Next.js app (server unless marked *public*) ·
`ci` = GitHub Actions · `ops` = local CLI/tooling only.

### Supabase

| Variable | Consumer | Dev (root `.env`) | Prod |
|---|---|---|---|
| `SUPABASE_URL` | app | local stack (`http://127.0.0.1:54321`) | GH secret + CF Workers env |
| `SUPABASE_PUBLISHABLE_KEY` | app | from `supabase status` | GH secret + CF Workers env |
| `SUPABASE_SECRET_KEY` | app (server only) | from `supabase status` | GH secret + CF Workers env |
| `SUPABASE_ACCESS_TOKEN` | ops | personal access token (headless CLI + Management API auth) | — (ops only) |
| `SUPABASE_PROJECT_REF` | ops | cloud project ref (`ofpnglnnzpowlzsyfbit`) | — (ops only) |
| `SUPABASE_DB_HOST` / `SUPABASE_DB_PASSWORD` | ops, ci (backup) | cloud DB (ops) | GH secret (`backup.yml`) |

### App

| Variable | Consumer | Dev | Prod |
|---|---|---|---|
| `TURNSTILE_SECRET_KEY` | app (server) | test secret `1x0000000000000000000000000000000AA`, or empty to skip | GH secret + CF Workers env |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | app (public) | test site key `1x00000000000000000000AA`, or empty to skip | GH secret (baked at build) |

### Ops / CI only

| Variable | Consumer | Dev | Prod |
|---|---|---|---|
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | ops, ci (deploy) | ops (`wrangler`) | GH secret |
| `ANTHROPIC_API_KEY` | ci (PR review, optional) | — | GH secret |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | ops (github MCP) | fine-grained PAT | — |

## Rules

- Never commit `.env` files or log secret values.
- New variable? Add it to: root `.env.example`, this matrix, and `.github/SETUP.md`
  (if CI needs it).
- Rotation: prod keys are replaced by updating the injection point (GH secret / Cloudflare
  dashboard) — the local `.env` only ever holds dev values.
- `wrangler deploy` never reads the CI runner's shell env into the Worker's runtime — a GH
  Actions secret set as job `env:` only reaches `NEXT_PUBLIC_*` build-time inlining.
  Server-side vars (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`,
  `TURNSTILE_SECRET_KEY`) must be pushed as Worker secrets, which `deploy.yml` does via
  `cloudflare/wrangler-action`'s `secrets:` input (`wrangler secret bulk` under the hood).
- Keep root `.env` values **bare**: no surrounding quotes, no inline `#` comments — mise's
  dotenv parser captures them literally.
- Analytics needs no env var: **Cloudflare Web Analytics** is enabled per hostname in the
  Cloudflare dashboard.
- The root `.env` also carries a `PROD_*` section (cloud Supabase URL/keys staged for
  GitHub Actions secrets). Nothing in the app reads that prefix — see `docs/GO_LIVE.md`.
