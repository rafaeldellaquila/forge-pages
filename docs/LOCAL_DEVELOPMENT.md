# Running forge-pages locally

End-to-end local setup: the local Supabase stack (Postgres + Studio) and the Next.js app.
Everything runs on your machine — no cloud account or paid service required. Turnstile is
the only external integration, and it degrades gracefully when its keys are absent.

---

## 1. Prerequisites

- **[mise](https://mise.jdx.dev)** — pins Node 24 + pnpm (`mise install` reads `.mise.toml`).
- **Docker** — the local Supabase stack runs in containers.
- No global Supabase CLI needed — it's a dev dependency (`pnpm exec supabase …`).

```bash
mise install          # Node 24 + pnpm
pnpm install          # dependencies
```

> The `esbuild` and `workerd` build scripts are pre-approved in `pnpm-workspace.yaml`
> (`allowBuilds`).

---

## 2. Local Supabase (Postgres + Studio)

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

`db reset` applies `infra/supabase/migrations/*` then `infra/supabase/seed/*`, which creates
demo `clients` + `landing_pages` rows on `*.localhost` domains (see §5). Content itself
(`landing_pages.blocks`) is a JSONB array you edit in Studio — see §4.

---

## 3. Environment file

The **root `.env`** (gitignored) is the single source of truth. There is no per-app sync:
mise auto-loads it for every task and the activated shell, and Next.js reads it natively
from the project root. Full variable → consumer → dev/prod matrix: `docs/SECRETS.md`.

```bash
cp .env.example .env          # non-secret local defaults are pre-filled
# fill in: SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY (from `supabase status`)
```

The `onboard-local` setup script does the copy + key filling automatically.

Restart the dev server after editing `.env`. `NEXT_PUBLIC_*` values are inlined at build
time, so changing one requires a rebuild for `mise run preview` / `mise run build`.

Turnstile can stay empty locally (bot check skipped). To exercise it, use Cloudflare's
always-pass test pair: `NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA` and
`TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA`.

---

## 4. Editing content (blocks)

There is no CMS. Each tenant's page content is the `blocks` JSONB array on its
`landing_pages` row (ADR-0007):

1. Open Supabase Studio → `http://127.0.0.1:54323` → Table Editor → `landing_pages`.
2. Pick the tenant's row, open the `blocks` cell, and edit the JSON array.
3. Reload the page — the Server Component re-fetches and re-validates.

Every block needs a matching TypeScript interface in `lib/types/blocks.ts` and a Zod schema
in `lib/schemas/blocks.ts`. A block whose JSON fails its schema fails loudly at fetch time
rather than rendering silently broken.

---

## 5. The app

```bash
mise run dev          # → http://localhost:3000
```

The app resolves the tenant from the request `Host` header, so open the demo tenants by
their seeded `*.localhost` subdomains (browsers resolve those to loopback with no
`/etc/hosts` edits, and the middleware strips the port):

| Address | Tenant |
| --- | --- |
| http://forgecompany.localhost:3000 | Forge Company |
| http://forge-motos.localhost:3000 | Forge Motos |
| http://clinica.localhost:3000 | Clínica Exemplo |
| http://advocacia.localhost:3000 | Advocacia Prime |
| http://unknown.localhost:3000 | **404** (no tenant for that domain) |

---

## 6. How the pieces connect (multi-tenant)

```
Browser (Host: forgecompany.localhost:3000)
  → middleware.ts            strips the port → sets the x-tenant-host request header
  → app/page.tsx (Server Component)
     → Supabase landing_pages WHERE domain = <host> AND status = 'published'
     → 404 if no row; else validate `blocks` with lib/schemas/blocks.ts
     → render each block via the block component map, with per-tenant CSS variables + SEO metadata
```

Lead flow: the CTA form (Client Component) produces a Turnstile token → `POST /api/leads`
→ Zod validation → Turnstile siteverify → insert into Supabase `leads` with the secret key
(server-only). Read the leads back in Studio, filtered by `landing_page_id`. There are no
notification channels or rate limiting in the MVP — deferred per ADR-0007.

---

## 7. Cloudflare Workers preview

`mise run preview` builds with the OpenNext adapter and serves the result on the local
Workers runtime — the closest local approximation of production:

```bash
mise run preview      # opennextjs-cloudflare build && wrangler dev → http://localhost:8787
```

Worth running before any deploy: Workers-runtime problems (Node API gaps, `next/image`
quirks) surface here and not under `next dev`.

---

## 8. Verifying it works

```bash
curl -s -H "Host: forgecompany.localhost" http://localhost:3000/ | grep -oiE '<title>[^<]*</title>'
open http://forgecompany.localhost:3000     # blocks render, tenant colors applied
# Submit the form → check the lead landed:
docker exec supabase_db_infra psql -U postgres -d postgres -c \
  "select name, whatsapp, intent from public.leads order by created_at desc limit 1;"
```

---

## 9. Common tasks

```bash
mise run lint                   # Biome check (whole repo)
mise run lint:fix               # Biome auto-fix
mise run typecheck              # tsc --noEmit
mise run build                  # next build
mise run gen:block <name>       # scaffold a React block component
mise run gen:migration <name>   # new timestamped SQL migration
mise run clean                  # delete build artefacts
mise run reset                  # + delete node_modules and reinstall
```

`mise tasks` lists everything with descriptions.

---

## 10. Troubleshooting

- **Page 404s** → no `landing_pages` row for that host, or the row isn't `published`
  (`pnpm exec supabase db reset --workdir infra` to restore the seed).
- **Page renders but no blocks** → the row's `blocks` array is empty (`[]` is the column
  default) — add blocks in Studio (§4).
- **Blocks fail validation** → the JSON doesn't match `lib/schemas/blocks.ts`; the Zod
  error names the offending path.
- **`supabaseUrl is required` / missing key** → the dev server started before `.env` was
  filled; restart it.
- **Turnstile always fails** → the site key and secret must come from the same widget; the
  `1x…` test pair always passes.
- **Port 3000 busy** → `next dev` picks the next free port; the tenant still resolves (the
  port is stripped from the host).
- **Stale build / odd module errors after switching branches** → `mise run clean`, or
  `mise run reset` to also rebuild `node_modules` from the lockfile. Neither touches
  `.env` or the Supabase link.
- **`pnpm run lint` fails with `Command "eslint" not found`** → an environment wrapper
  misroutes the script; the real script is `biome check .`. Use `mise run lint` or
  `pnpm exec biome check .`.

---

## 11. Production build & deploy (Cloudflare Workers)

The app deploys to **Cloudflare Workers** via `@opennextjs/cloudflare`
(`docs/adr/0001-hosting-cloudflare.md`; Vercel Pro is the documented Plan B).

```bash
mise run build:cloudflare    # opennextjs-cloudflare build → .open-next/
pnpm run deploy              # build + wrangler deploy   (needs Cloudflare auth)
```

Config: `open-next.config.ts` (adapter) + `wrangler.jsonc` (Worker name, assets, bindings).
CI: `.github/workflows/deploy.yml` (inactive; needs `CLOUDFLARE_API_TOKEN` +
`CLOUDFLARE_ACCOUNT_ID`). Per-client custom hostnames and SSL come from Cloudflare for
SaaS — see `docs/ADD_CLIENT.md`.

> ISR is emulated by OpenNext via stale-while-revalidate, and the cache key does not
> include the `Host` header — prefer explicit per-tenant revalidation over a bare
> `revalidate: N` on the root page (`.claude/docs/TECHNICAL_REVIEW_CONTEXT7.md` §1).
