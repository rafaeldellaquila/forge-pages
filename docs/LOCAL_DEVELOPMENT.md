# Running forge-pages locally

End-to-end local setup: local Supabase (DB + Storage + Edge Functions), Strapi CMS, the
Nuxt web app, and Storybook. Everything runs on your machine — no cloud account or paid
service required. Third-party integrations (PostHog, Sentry, Turnstile, Upstash, Flipt)
degrade gracefully when their keys are absent.

---

## 1. Prerequisites

- **[mise](https://mise.jdx.dev)** — pins Node 24 + pnpm (`mise install` reads `.mise.toml`).
- **Docker** — the local Supabase stack runs in containers.
- No global Supabase CLI needed — it's a dev dependency (`pnpm exec supabase …`).

```bash
mise install          # Node 24 + pnpm
pnpm install          # workspace deps (also runs Strapi/Nuxt prepare)
```

> The `supabase`, `@swc/core`, `sharp`, `esbuild`, `@parcel/watcher`, `@sentry/cli`, and
> `core-js` build scripts are pre-approved in `pnpm-workspace.yaml` (`allowBuilds`).

---

## 2. Local Supabase (DB + Storage + Auth + Edge Functions)

Config lives in `infra/supabase/config.toml`, so **every** Supabase command needs
`--workdir infra`.

```bash
pnpm exec supabase start --workdir infra      # boots the stack (first run pulls images)
pnpm exec supabase db reset --workdir infra   # applies migrations + seed data
pnpm exec supabase status --workdir infra     # prints URLs + keys (copy these into .env)
```

Local endpoints:

| Service            | URL                              |
| ------------------ | -------------------------------- |
| API (REST/Auth)    | http://127.0.0.1:54321           |
| Postgres           | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Studio (DB UI)     | http://127.0.0.1:54323           |
| Mailpit (emails)   | http://127.0.0.1:54324           |

`db reset` applies `infra/supabase/migrations/*` then seeds `infra/supabase/seed/*` —
which creates a demo client and a **`landing_pages` row with `domain = 'localhost'`**
(status `published`). That domain is how the web app resolves the tenant (see §6).

---

## 3. Environment files

Both apps read `.env` (gitignored). Copy from the checked-in examples and fill in local
values. **Never commit real values.**

### apps/cms/.env (Strapi → local Postgres)
```bash
cp apps/cms/.env.example apps/cms/.env
```
Set:
```bash
DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=54322
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSL=false
# Generate each secret with:  openssl rand -base64 16
APP_KEYS=<rand>,<rand>
API_TOKEN_SALT=<rand>
ADMIN_JWT_SECRET=<rand>
TRANSFER_TOKEN_SALT=<rand>
JWT_SECRET=<rand>
ENCRYPTION_KEY=<rand>
```

### apps/web/.env (Nuxt → local Strapi + Supabase)
```bash
cp apps/web/.env.example apps/web/.env
```
Set (keys from `supabase status`):
```bash
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=            # created in Strapi admin, step §4
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=    # "PUBLISHABLE_KEY" from `supabase status`
SUPABASE_SECRET_KEY=         # "SECRET_KEY" from `supabase status`
# All of the below are optional locally — leave empty to skip that integration:
UPSTASH_REDIS_REST_URL=      # empty → rate limiting skipped
TURNSTILE_SECRET_KEY=        # empty → bot check skipped (form works without a token)
NUXT_PUBLIC_POSTHOG_KEY=     # phc_… → analytics on; empty → off
NUXT_PUBLIC_SENTRY_DSN=      # empty → Sentry no-op
FLIPT_URL=                   # empty → Flipt fails open (all flags enabled)
```

---

## 4. Strapi CMS

```bash
mise run dev:cms          # → http://localhost:1337/admin
```

First run:
1. Create the admin user at `/admin`.
2. **Content Manager → Landing Page → Create**: set **`domain` = `localhost`** (this must
   match the Supabase tenant domain), add a **Hero** and **CTA Form** block, then
   **Save → Publish**.
3. **Settings → API Tokens → Create**: name `nuxt-read-only`, type **Read-only** → copy the
   token into `apps/web/.env` as `STRAPI_API_TOKEN`.

> Media uploads use the S3 (Supabase Storage) provider only when `SUPABASE_S3_*` are set;
> otherwise Strapi falls back to local disk (`apps/cms/public/uploads`).

---

## 5. Nuxt web app

```bash
mise run dev:web          # → http://localhost:3000 (or 3001 if taken)
```

Restart the dev server after editing `apps/web/.env` (runtime config is read at startup).

---

## 6. How the pieces connect (multi-tenant)

```
Browser (Host: localhost:3000)
  → server/middleware/tenant.ts   strips the port → domain "localhost"
     → Supabase landing_pages WHERE domain='localhost' AND status='published'  (publishable key)
     → event.context.tenant   (camelCase via PostgREST column aliasing)
  → app/pages/index.vue        404 if no tenant; else:
     → /api/blocks (server proxy, keeps STRAPI_API_TOKEN server-side)
        → Strapi /api/landing-pages?filters[domain][$eq]=localhost&populate[blocks][populate]=*
     → renders blocks via blockComponentMap with per-tenant CSS variables + SEO head
```

**Both the Supabase `landing_pages.domain` and the Strapi entry `domain` must equal
`localhost`** — the Supabase row resolves the tenant/theme, the Strapi entry supplies the
blocks. The seed sets Supabase to `localhost`; you set Strapi to `localhost` in step §4.

Lead flow: `CtaFormBlock` → `POST /api/leads` → sanitize-html → (Turnstile + Upstash *if
configured*) → insert into Supabase `leads`. In the cloud project that insert fires the
notification Edge Function (Resend + WhatsApp); locally the row is just stored.

---

## 7. Storybook (component catalog)

```bash
mise run storybook        # → http://localhost:6006  (all 10 blocks, ≥2 variants each)
```

---

## 8. Verifying it works

```bash
curl -s localhost:3000/api/health                       # {"ok":true,...}
curl -s localhost:3000/api/flags                        # {"analyticsPosthog":true,...} (Flipt fail-open)
open http://localhost:3000                               # Hero + CTA Form render, tenant colors applied
# Submit the form → check the lead landed:
docker exec supabase_db_infra psql -U postgres -d postgres -c \
  "select name, whatsapp, intent from public.leads order by created_at desc limit 1;"
```

---

## 9. Integrations — local behavior

| Integration | Without keys | To enable locally |
| ----------- | ------------ | ----------------- |
| PostHog     | off          | set `NUXT_PUBLIC_POSTHOG_KEY` (`phc_…`) + `NUXT_PUBLIC_POSTHOG_HOST` |
| Sentry      | no-op        | set `NUXT_PUBLIC_SENTRY_DSN` |
| Turnstile   | skipped (form works) | set site + secret keys; test keys `1x00000000000000000000AA` / `1x0000000000000000000000000000000AA` always pass |
| Upstash     | rate limit skipped | set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| Flipt       | fails open (all flags true) | run a Flipt server + set `FLIPT_URL` |

---

## 10. Common tasks

```bash
mise run lint             # Biome check (whole repo)
mise run lint:fix         # Biome auto-fix
mise run typecheck        # tsc / vue-tsc / nuxt typecheck across packages
mise run gen:block <name> # scaffold a new block (type + Vue + story)
mise run gen:migration <name>   # new timestamped SQL migration
mise run dev              # Nuxt + Strapi together
```

---

## 11. Troubleshooting

- **Port 3000 busy** → Nuxt auto-uses 3001; the tenant still resolves (port is stripped).
- **`Another Nuxt dev is already running`** → kill the process on the port
  (`kill $(ss -ltnp | grep :3001 | grep -oE 'pid=[0-9]+' | cut -d= -f2)`) and restart.
- **Page 404s** → no `landing_pages` row for `localhost` (run `supabase db reset`) or it's
  not `published`.
- **Page renders but no blocks** → the Strapi entry's `domain` isn't `localhost`, or it
  isn't published.
- **Upstash `WRONGPASS`** → the REST token doesn't match the URL; copy both from the same
  DB's REST API `.env` tab (`UPSTASH_REDIS_REST_TOKEN`, ~60+ chars).
- **Strapi won't boot** → check `apps/cms/.env` DB values + that Supabase is running
  (`supabase status --workdir infra`).

---

## 12. Production build & deploy (Cloudflare Pages)

The web app targets **Cloudflare Pages** (see `docs/adr/0001-hosting-cloudflare.md`).

```bash
pnpm --filter web build:cloudflare        # NITRO_PRESET=cloudflare-pages → apps/web/dist
pnpm --filter web preview:cloudflare      # local Workers runtime preview (wrangler pages dev)
pnpm --filter web deploy:cloudflare       # wrangler pages deploy dist  (needs Cloudflare auth)
```

Config: `apps/web/wrangler.toml`. CI: `.github/workflows/deploy.yml` (inactive; needs
`CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`). Strapi/Flipt/NocoDB deployment is
deferred — see `.github/SETUP.md`.

> First deploy: verify server deps behave on the Workers runtime (`nodejs_compat` is on).
> Sentry's server SDK is Node-oriented; if it misbehaves on Workers, guard it or switch to
> `@sentry/cloudflare`.
