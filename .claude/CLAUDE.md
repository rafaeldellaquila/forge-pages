# forge-pages — CLAUDE.md

> This file is the single source of truth for the forge-pages project.
> Read it in full before any task. Never contradict decisions made here.
> When in doubt, ask before acting.

---

## 1. Product Overview

**forge-pages** is a multi-tenant SaaS platform that sells landing pages as a product to clients. Each client gets a landing page served on their own domain (e.g. `lp.cliente.com.br`). A single Nuxt 4 app serves all clients — the tenant is resolved from the `Host` header on every request. Content is managed via Strapi 5 CMS using Dynamic Zone (block-based composition). Leads captured on landing pages are stored in Supabase, notified via Resend (email) and WhatsApp Cloud API, and managed via NocoDB by non-technical partners.

**GitHub org**: `forge-co-tech`
**Repository**: `forge-co-tech/forge-pages`
**Language standard**: All code, comments, variables, functions, filenames, database columns, API fields, and git messages in **English**. User-facing content (landing page text) in Portuguese.

---

## 2. Full Stack

| Layer                  | Tool                                       | Notes                              |
| ---------------------- | ------------------------------------------ | ---------------------------------- |
| Frontend               | Nuxt 4 (SSR + ISR)                         | Multi-tenant by domain             |
| Styling                | Tailwind CSS v4                            | CSS-native, no config file         |
| CMS                    | Strapi 5                                   | Dynamic Zone for blocks            |
| Database               | Supabase (PostgreSQL)                      | + Storage + Edge Functions + Auth  |
| Hosting (web)          | Cloudflare Workers/Pages                   | Free, commercial-OK, Nitro `cloudflare` preset (see ADR 0001) |
| Custom domains / SSL   | Cloudflare (for SaaS)                      | Free per-domain SSL; replaces Domainee |
| Hosting (Strapi/Flipt/NocoDB) | Deferred                            | Always-on services — no good free tier; run local until paid |
| Lead management        | NocoDB                                     | Pointed at Supabase Postgres       |
| Analytics              | PostHog                                    | Cloud free tier                    |
| Error tracking         | Sentry                                     | Free tier, 5k errors/month         |
| Feature flags          | Flipt                                      | Self-hosted (deploy deferred)      |
| Rate limiting          | Upstash Redis                              | Shared instance, free tier         |
| Bot protection         | Cloudflare Turnstile                       | Invisible CAPTCHA, free            |
| Email notifications    | Resend                                     | 3k emails/month free               |
| WhatsApp notifications | WhatsApp Cloud API                         | 1k conversations/month free        |
| Backup                 | GitHub Actions + pg_dump                   | Daily cron, commit to private repo |
| Monitoring             | UptimeRobot                                | Free, 5-min checks                 |
| Package manager        | pnpm                                       | Workspaces monorepo                |
| Runtime manager        | mise-en-place                              | Node 24 LTS fixed                  |
| Linting + formatting   | Biome                                      | Replaces ESLint + Prettier         |
| Component catalog      | Storybook                                  | In packages/ui                     |
| Versioning             | Changesets                                 | Monorepo changelog                 |
| Git hooks              | Husky + lint-staged                        | Biome on staged files only         |
| TypeScript             | strict mode                                | No `any` allowed                   |
| Component framework    | Vue 3 (Composition API + `<script setup>`) |                                    |

**Decided and closed — do not suggest alternatives for:**

- Next.js (decided: Nuxt 4)
- Firebase (decided: Supabase)
- Directus / Nuxt Content (decided: Strapi 5)
- ESLint / Prettier (decided: Biome)
- Yarn / npm (decided: pnpm)
- Koyeb / Domainee (decided 2026-07-09: Cloudflare Workers/Pages for web + Cloudflare-for-SaaS SSL — Koyeb dropped its free tier; see ADR 0001. Strapi/Flipt/NocoDB hosting deferred.)

---

## 3. Monorepo Structure

```
forge-pages/
├── apps/
│   ├── web/                    # Nuxt 4 — multi-tenant frontend
│   └── cms/                    # Strapi 5 — content management
├── packages/
│   ├── ui/                     # Vue components + Storybook
│   ├── types/                  # Shared TypeScript interfaces
│   └── config/                 # Shared Biome, Tailwind, Changesets config
├── infra/
│   ├── supabase/
│   │   ├── migrations/         # SQL files (timestamp prefix)
│   │   ├── seed/               # Dev seed data
│   │   └── functions/          # Supabase Edge Functions (Deno)
│   └── flipt/                  # feature-flags.yaml
├── .github/
│   ├── workflows/              # CI (workflow_dispatch only until activated)
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   └── prompts/                # Phase prompts for Claude Code sessions
├── .mise.toml                  # Node 24 LTS, pnpm version, task runners
├── .husky/                     # Git hooks
├── biome.json                  # Root Biome config (shared)
├── pnpm-workspace.yaml
├── .changeset/
│   └── config.json
├── .env.example                # Keys only, no values
├── CLAUDE.md                   # This file
└── AGENTS.md                   # MCP and agent configuration
```

---

## 4. Architecture: Multi-Tenant by Domain

Every HTTP request resolves the tenant from the `Host` header:

```
Visitor → Domainee (SSL) → Koyeb (Nuxt SSR)
  → server/middleware/tenant.ts
    → query Supabase: SELECT * FROM landing_pages WHERE domain = host
    → if not found: return 404
    → inject tenant context into request
  → render page from blocks (or custom component if render_mode = 'custom')
```

**ISR cache**: Pages are cached for 1 hour and revalidated in background.

```ts
// nuxt.config.ts
routeRules: { '/**': { isr: 3600 } }
```

Strapi webhook triggers Nuxt cache invalidation on content publish.

**render_mode**:

- `blocks` — page composed from Dynamic Zone blocks (default)
- `custom` — dedicated Vue component for fully custom layouts (rare)

---

## 5. Database Schema (Supabase / PostgreSQL)

### clients

```sql
id              uuid primary key default gen_random_uuid()
name            text not null
email           text not null
whatsapp        text not null
created_at      timestamptz default now()
```

### landing_pages

```sql
id              uuid primary key default gen_random_uuid()
client_id       uuid references clients(id) on delete cascade
domain          text not null unique
render_mode     text not null default 'blocks' check (render_mode in ('blocks','custom'))
status          text not null default 'draft' check (status in ('draft','published','archived'))
seo_title       text
seo_description text
seo_og_image    text
canonical_url   text
primary_color   text
secondary_color text
font_family     text
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

### leads

```sql
id              uuid primary key default gen_random_uuid()
landing_page_id uuid references landing_pages(id) on delete cascade
name            text not null
whatsapp        text not null
email           text
message         text
intent          text
utm_source      text
utm_medium      text
utm_campaign    text
status          text not null default 'new' check (status in ('new','contacted','converted','lost'))
created_at      timestamptz default now()
```

### webhook_retries

```sql
id              uuid primary key default gen_random_uuid()
lead_id         uuid references leads(id) on delete cascade
channel         text not null check (channel in ('email','whatsapp'))
attempts        int not null default 0
last_error      text
next_retry_at   timestamptz
resolved_at     timestamptz
created_at      timestamptz default now()
```

**RLS**: All tables must have Row Level Security enabled. **API keys**: this project uses the new Supabase key model only — publishable key (`sb_publishable_...`, maps to the `anon` DB role) for client-side reads, secret key (`sb_secret_...`, maps to `service_role`, bypasses RLS) for Edge Functions and server-side code. Legacy `anon`/`service_role` JWT keys are disabled. The publishable key never has write access to `landing_pages` or `clients`. Secret keys are not JWTs: send them on the `apikey` header, never `Authorization: Bearer`; in SQL (`pg_net`/webhooks) read them from Vault, never hardcode.

---

## 6. Strapi Block Types (Dynamic Zone)

All blocks live in the `blocks` Dynamic Zone of the `LandingPage` content type.
Each block must have a corresponding TypeScript interface in `packages/types/src/blocks/`.

| Block UID                  | Key fields                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `blocks.header`            | logo, menu_links[], cta_label, cta_whatsapp, cta_message                                                                          |
| `blocks.hero`              | badge_text, headline, subheadline, cta_primary_label, cta_primary_link, cta_secondary_label, cta_secondary_link, image, image_alt |
| `blocks.trust-icons`       | items[]: { icon, text }                                                                                                           |
| `blocks.stats`             | items[]: { number, label }                                                                                                        |
| `blocks.value-proposition` | headline, text, cards[]: { icon, title, description }                                                                             |
| `blocks.services`          | headline, tabs[]: { label, title, text, cta_label, cta_link, image }                                                              |
| `blocks.differentials`     | headline, text, items[]: { icon, text }                                                                                           |
| `blocks.testimonials`      | headline, items[]: { name, role, photo, text, rating }                                                                            |
| `blocks.cta-form`          | headline, subheadline, select_options[]: { label, value }, cta_label, whatsapp_number, whatsapp_message                           |
| `blocks.footer`            | logo, description, links[], phones[], schedule, social_links[], copyright, privacy_link                                           |

---

## 7. Lead Flow

```
Form submit (Nuxt)
  → sanitize-html (allowedTags: []) — strip all HTML tags
  → Upstash Redis rate limit (3 submissions / IP / hour)
  → Cloudflare Turnstile verification
  → POST /api/leads (Nuxt server route)
    → INSERT into leads (Supabase)
    → Database Webhook fires automatically
      → Supabase Edge Function: handle-lead-webhook
        → call Resend API (email notification)
        → call WhatsApp Cloud API (notification)
        → on any failure: INSERT into webhook_retries
  → pg_cron job: every 5 minutes, retry failed webhooks (max 3 attempts)
```

---

## 8. Shared TypeScript Types (`packages/types`)

All contracts between Strapi, Nuxt, and Edge Functions must be typed here.
**Never** duplicate type definitions across apps.

Key exports:

- `BlockType` — union of all block interfaces
- `LandingPageConfig` — tenant config resolved from DB
- `Lead` — lead payload (form → DB)
- `LeadStatus` — `'new' | 'contacted' | 'converted' | 'lost'`
- `RenderMode` — `'blocks' | 'custom'`
- One interface per block (e.g. `HeroBlock`, `FooterBlock`, etc.)

---

## 9. Feature Flags (Flipt)

Flipt is self-hosted on Koyeb. Use feature flags for:

- Rolling out new block types to specific clients
- A/B testing layout variants
- Enabling/disabling integrations without deploys

Config lives in `infra/flipt/feature-flags.yaml`.
SDK: `@flipt-io/flipt` (Node.js) used in both Nuxt server routes and Strapi.

---

## 10. Code Conventions

### File naming

- Vue components: `PascalCase.vue` (e.g. `HeroBlock.vue`)
- Composables: `camelCase` with `use` prefix (e.g. `useTenant.ts`)
- Server routes: `kebab-case` (e.g. `submit-lead.post.ts`)
- Migrations: timestamp prefix (e.g. `20240101000000_create_leads.sql`)
- Stories: `ComponentName.stories.ts`

### Vue components

- Always use `<script setup lang="ts">`
- Props must be typed with interfaces from `packages/types`
- No inline styles — use Tailwind classes only
- No `console.log` — use Sentry for errors

### Git

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- Scope optional but encouraged: `feat(web): add hero block`
- **Always ask before committing**

### Environment variables

- `.env.example` contains all keys with empty values and comments
- Real values are **never** in the repo
- Dev: export from shell or mise env hooks pointing to external source
- Prod: injected by Koyeb / Supabase dashboards

---

## 11. Security Checklist

Apply to every new endpoint, form, or database operation:

- [ ] Input sanitized (`sanitize-html` with `allowedTags: []`)
- [ ] Rate limit applied (Upstash Redis)
- [ ] CORS restricted to known origins in Strapi and Nuxt
- [ ] Supabase RLS policy exists for affected tables
- [ ] No secrets in code (Biome enforces via `security/noSecrets` rule)
- [ ] Turnstile verified on all public-facing forms
- [ ] Secret key (`sb_secret_...`) only in server-side / Edge Functions — never in client code

---

## 12. What Claude Must Always Ask Before Doing

- Creating or deleting files outside the expected structure
- Running or generating database migrations
- Installing new npm/pnpm dependencies
- Making git commits or creating branches
- Any operation touching `.env` values
- Modifying `packages/types` interfaces (impacts all apps)
- Any destructive or irreversible operation

---

## 13. What NOT To Do

- Do not use `any` in TypeScript — use `unknown` and narrow, or define a proper type
- Do not add `.env` files with real values to the repo
- Do not add new blocks without a corresponding type in `packages/types`
- Do not use the Supabase secret key (`sb_secret_...`) in client-side or Nuxt public runtime config
- Do not use legacy `anon`/`service_role` JWT keys — this project uses publishable/secret keys only
- Do not use `console.log` in production — use Sentry
- Do not suggest Firebase, Directus, Nuxt Content, ESLint, Prettier, Yarn, or Next.js
- Do not skip the security checklist for any new form or endpoint
- Do not run `pnpm install` without asking first
- Do not create files named `.env`, `.env.local`, `.env.production` with real values

---

## 14. Current Project State

> Update this section at the end of each phase.

- [x] Phase 1 — Scaffolding (monorepo, tooling, base config) — completed 2026-07-08, commit `1bc6ae6`
- [x] Phase 2 — Infra (Supabase migrations, Edge Functions, pg_cron) — completed 2026-07-08, deployed to `wsfteewohhchwewwxnpn` and E2E-verified
- [x] Phase 3 — CMS (Strapi 5, block content types, Dynamic Zone) — completed 2026-07-08, Strapi 5.50.0 booting locally against local Supabase Postgres, all 10 blocks + 9 shared components live, API route registered
- [x] Phase 4 — Frontend (Nuxt 4, tenant middleware, block components, Storybook) — completed 2026-07-09, multi-tenant page rendering blocks with per-tenant theming, lead capture E2E-verified against local Strapi + Supabase, Storybook builds all 10 blocks
- [x] Phase 5 — Integrations (PostHog, Sentry, Turnstile, Flipt) — completed 2026-07-09, PostHog funnel + Sentry (@sentry/nuxt) + Flipt fail-open + Turnstile widget wired; Upstash/Resend/WhatsApp already done in Phases 2/4. UptimeRobot + NocoDB remain manual dashboard setup.
- [x] Phase 6 — CI/CD (GitHub Actions, backup workflow, Dependabot) — completed 2026-07-09, all `.github/` workflows created inactive (`workflow_dispatch`); hosting pivoted to Cloudflare (ADR 0001), Domainee removed.

**All 6 phases complete.** Deployment (Cloudflare for web; Strapi/Flipt/NocoDB deferred) and the manual dashboard setup (UptimeRobot, NocoDB, branch protection, GitHub secrets) remain before first client onboarding — see `.github/SETUP.md` and ADR 0001.

---

## 15. Learnings

### 2026-07-08: Phase 1 deviations from the phase prompt
- **Biome v2 (2.5.3)** instead of the prompt's `^1.9.0` (user decision): `--apply` → `--write` everywhere (package.json scripts, lint-staged, `.mise.toml` `lint:fix`); config migrated via `biome migrate` (`files.ignore` → `files.includes` with negated globs, `organizeImports` → `assist.actions.source.organizeImports`, `rules.recommended` → `rules.preset`); `css.parser.tailwindDirectives: true` required to parse Tailwind v4 `@theme` blocks; secrets rule is now stable `security/noSecrets` (the prompt's `noSecretInSource` never existed in Biome).
- **`packages/types`**: `"typescript": "workspace:*"` from the prompt is invalid (TypeScript is not a workspace package) — pinned `^5.6.0` matching root.
- **`.npmrc` at root** pins `registry=https://registry.npmjs.org/`: the machine's global npm config points to a private CodeArtifact registry (work account) that 401s; this project uses public packages only.
- **pnpm 11** requires `allowBuilds: { '@biomejs/biome': true }` in `pnpm-workspace.yaml` for Biome's postinstall (the package.json `pnpm.onlyBuiltDependencies` field is not honored).

### 2026-07-08: Phase 2 learnings
- **RLS policies alone don't grant access**: Supabase no longer auto-grants DML privileges on new tables — `anon`/`service_role` had only TRUNCATE/REFERENCES/TRIGGER. Migration `20240101000002_enable_rls.sql` now has an explicit GRANTS section (least privilege: anon = SELECT landing_pages + INSERT leads; service_role = full DML). Without it, the anon lead INSERT fails with `permission denied` despite the policy existing.
- **Supabase CLI** installed as root devDependency (`supabase ^2.109.1`, needs `allowBuilds` entry). Local commands use `--workdir infra` since config lives at `infra/supabase/config.toml`.
- **`[db.seed]` with `sql_paths = ["./seed/*.sql"]`** added to config.toml — without it `supabase db reset` ignores the `seed/` directory.
- **Edge Function**: `Deno.env.get(...)!` replaced with `?? ''` (Biome errors on non-null assertions); `noConsole` disabled via biome.json override for `infra/supabase/functions/**` (console is the logging mechanism in Edge Functions).

### 2026-07-08: Supabase cloud setup — new API keys (user decision)
- **New API keys only**: publishable (`sb_publishable_...`) replaces anon, secret (`sb_secret_...`) replaces service_role. Env vars renamed to `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`. Legacy JWT keys to be disabled in the dashboard once nothing uses them.
- **Edge Functions** read the secret via `JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')).default` (auto-injected JSON object keyed by key name); legacy var kept as fallback for local `functions serve`.
- **pg_net/pg_cron/webhooks**: new keys are not JWTs — send on `apikey` header (Bearer → Invalid JWT). Retry-cron migration reads `project_url` and `secret_key` from Vault (`vault.create_secret(...)` once per environment).
- **Cloud project**: `forge-pages` (`wsfteewohhchwewwxnpn`, sa-east-1, **Postgres 17** — config.toml bumped from 15; originally created as `forge-page`, renamed in dashboard 2026-07-08 — the ref is immutable and unaffected). CLI must always run with `--workdir infra`; a `supabase link` from repo root created a stray `supabase/` dir + an orphan `remote_schema` entry in the cloud migration history (repaired with `supabase migration repair --status reverted`).
- **Deployed and E2E-verified 2026-07-08**: migrations pushed; Edge Function live with `verify_jwt = false` (new keys are not JWTs) + in-code `apikey` guard; Vault secrets `project_url`/`secret_key` set; Database Webhook `on-new-lead` (leads INSERT → handle-lead-webhook, `apikey` header) created in dashboard; legacy JWT keys disabled; full chain tested (publishable-key lead insert → webhook → Resend email, retry path exercised). `RESEND_FROM_EMAIL` temporarily `onboarding@resend.dev` until a sender domain is verified in Resend. WhatsApp channel dormant until `WHATSAPP_*` secrets are set (function skips unconfigured channels).

### 2026-07-08: Dependency version audit (pre-Phase 3)
- **Policy**: run `rtk proxy pnpm outdated -r` at the start of each phase; stay on latest stable unless an ecosystem peer blocks it — record any hold-back here with the reason.
- **typescript 5.9.3 → 6.0.3**: our tsconfig is already modern (NodeNext, ES2022), unaffected by TS 6 removals of legacy targets/resolution; `vue-tsc` peers `>=5`. Fallback if Strapi 5 misbehaves in Phase 3: pin `^5.9` in `apps/cms` only.
- **lint-staged 15.5.2 → 17.0.8**: requires Node ≥22.22 (we run 24 LTS); config format unchanged.
- **Already latest**: biome 2.5.3, @changesets/cli 2.31.0, husky 9.1.7, supabase 2.109.1, pnpm 11.10.0, Node 24 (active LTS until Oct 2026 — Node 26 LTS lands then).
- **Nuxt 4** (4.4.8, current stable) adopted as the frontend target (user decision, pre-code so zero migration cost); docs and Phase 4 prompt updated from Nuxt 3. Note Nuxt 4 default directory structure uses `app/`.

### 2026-07-08: Phase 3 learnings (Strapi 5 CMS)
- **camelCase field names (user decision)**: Strapi component/content-type attributes are camelCase (`ctaPrimaryLabel`, `menuLinks`, `seoOgImage`…) to match `packages/types` **exactly** — the prompt's snake_case JSON was overridden. Strapi's generated `types/generated/*.d.ts` confirmed field-for-field parity, so the REST API needs no snake→camel transform in Nuxt.
- **Local Supabase as Strapi DB (user decision)**: `apps/cms/.env` points at the local stack (`127.0.0.1:54322`, `DATABASE_SSL=false`), keeping `strapi_*` tables out of the cloud project. Cloud connection deferred; set `DATABASE_URL` for prod.
- **Upload provider**: the prompt's `@strapi/provider-upload-supabase` **does not exist on npm**; the only `strapi-provider-upload-supabase` is a dead 2022 Strapi-v4 package. Switched to the official `@strapi/provider-upload-aws-s3@5.50.0` (version-locked to core) pointed at Supabase Storage's S3 endpoint (`SUPABASE_S3_*` env vars, `forcePathStyle: true`). Bucket creation + credentials are a Phase 5 task; local disk upload is the fallback until then.
- **`create-strapi` non-interactive**: needs `--install` (not just `--use-pnpm`) or it hangs on the "Install dependencies?" prompt and crashes (`ERR_USE_AFTER_CLOSE`). Flags used: `--typescript --use-pnpm --install --skip-cloud --no-example --no-git-init`.
- **pnpm `allowBuilds`**: Strapi requires `@swc/core`, `core-js-pure`, `esbuild`, `sharp` set to `true` in `pnpm-workspace.yaml` (pnpm 11 leaves placeholder `set this to true or false` entries on first install).
- **`apps/cms/tsconfig.json` does NOT extend `tsconfig.base.json`**: base uses `NodeNext` + `verbatimModuleSyntax` + `exactOptionalPropertyTypes`, incompatible with Strapi's CommonJS compilation. Kept Strapi's generated tsconfig and only added a `paths` alias for `@forge-pages/types` (types-only package → all imports are `import type`, erased at runtime).
- **`apps/cms/biome.json`** needs `"root": false` (Biome 2 rejects nested root configs) and an `overrides` for `config/**` disabling `noNonNullAssertion` + `useNodejsImportProtocol` — Strapi's generated `config/admin.ts`/`database.ts` use `env(...)!` and bare `'path'`; keeping them pristine is `@strapi/upgrade`-safe. `noConsole` off cms-wide (Strapi logs via console).
- **`--no-git-init` skips Strapi's `.gitignore`** — created `apps/cms/.gitignore` for `types/generated`, `.strapi-updater.json`, `.cache`, `exports`, etc. (root `.gitignore` already covers `.strapi`, `.tmp`, `dist`, `build`, uploads, `.env`).
- **CORS**: Strapi 5.50 warns `enabled: true` on `strapi::cors` is insecure/deprecated — removed it, kept `{ headers, origin }` restricted to `localhost:3000` + `NUXT_PUBLIC_SITE_URL`.
- **KNOWN DEVIATION — `FooterBlock.phones`**: `packages/types` types it as `string[]`, but Strapi can't model a repeatable scalar. Modeled as a repeatable `shared.phone` component (`{ label?, number }[]`) for editor UX, so the API returns objects, not strings. **Phase 4 must reconcile**: either map `.number` in the Nuxt renderer or update the type (needs approval — touches `packages/types`).
- **Manual admin steps still pending (prompt Tasks 11 & 13, browser-only)**: create a test landing page (Hero + CTA Form), create the read-only `STRAPI_API_TOKEN` for Nuxt, and verify the live `?populate=blocks` API JSON. Admin user already registered locally. *(Done 2026-07-09: entry published, token in root `.env`, camelCase API shape confirmed against `packages/types`.)*

### 2026-07-09: Phase 4 learnings (Nuxt 4 frontend)
- **Prompt was Nuxt 3 / Tailwind v3 / Strapi v4 — corrected to our stack**: Nuxt 4.4.8 (`app/` dir, Vite 7), Tailwind v4 via `@tailwindcss/vite` plugin in `nuxt.config` `vite.plugins` (NOT `@nuxtjs/tailwindcss`), Strapi 5 flattened responses (`data[0].blocks`, no `.attributes`).
- **`nuxi init` non-interactive** needs `-t minimal` (template is a required arg) + `--no-install --no-gitInit`.
- **Tenant middleware** reads `landing_pages` with the **publishable** key (anon has SELECT + RLS published policy); column casing fixed via PostgREST aliasing in `.select('seoTitle:seo_title, …')` so the row matches camelCase `LandingPageConfig` (the prompt's `as LandingPageConfig` cast on snake_case was a lie). Lead insert uses the **secret** key server-side — the new `sb_secret_` key works fine through supabase-js (the Phase 2 Bearer/JWT caveat only applies to raw pg_net HTTP).
- **Strapi fetch is proxied** through `server/api/blocks.get.ts` (not fetched from the page) so `STRAPI_API_TOKEN` never reaches the client and there's no server/client `useFetch` key mismatch. Deep populate `populate[blocks][populate]=*` returns nested component data (shallow `populate=blocks` does not).
- **`@forge-pages/ui` ships raw `.vue`** — added to Nuxt `build.transpile`; Storybook `viteFinal` must push `@vitejs/plugin-vue` + `@tailwindcss/vite` explicitly (pnpm strict resolution stops `@storybook/vue3-vite` from auto-adding them). `storybook build` needs `CI=true`/`--disable-telemetry` to stay non-interactive. Stories import types from `@storybook/vue3` (needs to be a direct devDep).
- **`packages/ui` tsconfig** extends base but overrides `lib` to include `DOM`/`DOM.Iterable` (base is ES2022-only; components use `fetch`). `exactOptionalPropertyTypes` (from base) forbids `foo: undefined` in story args — omit the field instead of setting it undefined.
- **Dual Vite versions**: Storybook 8 pulled Vite 6 into `packages/ui`; pin `apps/web` to `vite@^7` (matches Nuxt 4) so `@tailwindcss/vite`'s plugin type matches Nuxt's expected `PluginOption` under `nuxt typecheck`.
- **Biome ignore globs must be `**/`-prefixed** in this monorepo (`!**/.nuxt`, `!**/types/generated`, `!**/storybook-static`, …) — bare `!.nuxt` only matches the repo root, leaving nested generated dirs to blow up `biome check .`. Added `noConsole: off` override for `apps/web/server/**` (server logging) and disabled `noUnusedVariables`/`noUnusedImports`/`useVueMultiWordComponentNames` for `**/*.vue` (Biome can't see template-only usage).
- **nuxt-security** provides an `xssValidator` that **rejects** request bodies containing HTML/script with 400 — a defense layer on top of the route's `sanitize-html`. Verified: `<script>` payload → 400 before the handler; clean lead → inserted.
- **Integrations deferred to Phase 5** (user decision): Turnstile + Upstash run only when their keys are set (graceful skip + `console.warn`); `@sentry/nuxt` module not added yet; PostHog keys wired in `runtimeConfig`/CSP only.
- **Local dev domain alignment**: host `localhost:3000/3001` → port stripped → `localhost`. Seed `02_landing_pages.sql` domain changed `localhost:3000` → `localhost`; the Strapi entry `domain` was set to `localhost` directly in the DB (the read-only Nuxt token can't PUT) so the block fetch matches.

### 2026-07-09: Phase 5 learnings (integrations)
- **Upstash rate limit verified with real keys** (Phase 4 wiring): 3/IP/hr → 4th 429. Gotcha: the code reads `UPSTASH_REDIS_REST_TOKEN` — a `.env` typo (`UPSTASH_API_TOKEN`) silently no-ops the limiter. The REST token is ~60+ chars (not the 36-char DB password/management token) and pairs with the REST URL; `WRONGPASS` means URL/token mismatch.
- **PostHog**: use the **public Project API Key** (`phc_…`), region host (`https://us.i.posthog.com` / `eu`). `posthog-js` client plugin gated on the Flipt `analytics.posthog` flag via `/api/flags`. Funnel tracking is **event-based**: `CtaFormBlock` (framework-agnostic, in `packages/ui`) `defineEmits(view/submit/success/error)`; `index.vue` binds those on the dynamic `<component>` to `useTracking()` — keeps `packages/ui` free of Nuxt composables (Storybook-safe). Nuxt plugins must return a consistent type — mixing bare `return` with `return { provide }` fails typecheck; use `return {}` on early exits.
- **Sentry**: use **`@sentry/nuxt`** (`@sentry/nuxt/module` + `sentry.client.config.ts`/`sentry.server.config.ts`), NOT the prompt's deprecated `@nuxtjs/sentry` (no Nuxt 4 support). `Sentry.init` with `dsn: undefined` is a safe no-op. `@sentry/cli` + `core-js` need `allowBuilds` entries.
- **Turnstile widget** wired **vanilla** (load `challenges.cloudflare.com/turnstile/v0/api.js`, `window.turnstile.render`) inside `CtaFormBlock` gated on an optional `turnstileSiteKey` prop passed from `index.vue` — the `@nuxtjs/turnstile` `<NuxtTurnstile>` component can't live in the framework-agnostic UI package. Server verify (Phase 4) unchanged. Verified with Cloudflare **test keys** (`1x…AA` site / `1x0…AA` secret always pass): submit → 200; real secret without a token → 400. Real keys kept commented in `apps/web/.env` until activated.
- **Flipt**: `@flipt-io/flipt@1.5` API is `new FliptClient({ url, authenticationStrategy: new ClientTokenAuthentication(token) })` + `client.evaluation.boolean({ namespaceKey:'default', flagKey, entityId, context })` → `{ enabled }` (NOT the prompt's `authentication:{clientToken}`). `server/utils/flipt.ts` **fails open** (returns true on error); `infra/flipt/feature-flags.yaml` committed; `/api/flags` is the real consumer (gates PostHog). Live eval needs a running Flipt server (Koyeb/Docker) — deferred.
- **Domainee** was implemented in Phase 5 then **removed in Phase 6** — hosting pivoted to Cloudflare (ADR 0001), whose for-SaaS custom-hostname API provisions SSL for free, so Domainee (paid, unverified `api.domainee.io`) is no longer needed. The `adminApiToken`/admin-domains endpoint went with it.
- **Biome ignores extended**: `!**/.strapi-updater.json` + `!.claude` (Strapi update cache + Claude settings are generated/tooling, not source).
- **Manual, not in repo**: UptimeRobot monitors + NocoDB partner workspace (dashboard setup per the phase prompt).
