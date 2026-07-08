# forge-pages — CLAUDE.md

> This file is the single source of truth for the forge-pages project.
> Read it in full before any task. Never contradict decisions made here.
> When in doubt, ask before acting.

---

## 1. Product Overview

**forge-pages** is a multi-tenant SaaS platform that sells landing pages as a product to clients. Each client gets a landing page served on their own domain (e.g. `lp.cliente.com.br`). A single Nuxt 3 app serves all clients — the tenant is resolved from the `Host` header on every request. Content is managed via Strapi 5 CMS using Dynamic Zone (block-based composition). Leads captured on landing pages are stored in Supabase, notified via Resend (email) and WhatsApp Cloud API, and managed via NocoDB by non-technical partners.

**GitHub org**: `forge-co-tech`
**Repository**: `forge-co-tech/forge-pages`
**Language standard**: All code, comments, variables, functions, filenames, database columns, API fields, and git messages in **English**. User-facing content (landing page text) in Portuguese.

---

## 2. Full Stack

| Layer                  | Tool                                       | Notes                              |
| ---------------------- | ------------------------------------------ | ---------------------------------- |
| Frontend               | Nuxt 3 (SSR + ISR)                         | Multi-tenant by domain             |
| Styling                | Tailwind CSS v4                            | CSS-native, no config file         |
| CMS                    | Strapi 5                                   | Dynamic Zone for blocks            |
| Database               | Supabase (PostgreSQL)                      | + Storage + Edge Functions + Auth  |
| Hosting                | Koyeb                                      | Free tier, Node.js persistent      |
| Custom domains / SSL   | Domainee                                   | SSL per client domain              |
| Lead management        | NocoDB                                     | Pointed at Supabase Postgres       |
| Analytics              | PostHog                                    | Cloud free tier                    |
| Error tracking         | Sentry                                     | Free tier, 5k errors/month         |
| Feature flags          | Flipt                                      | Self-hosted on Koyeb               |
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

- Next.js (decided: Nuxt 3)
- Firebase (decided: Supabase)
- Directus / Nuxt Content (decided: Strapi 5)
- ESLint / Prettier (decided: Biome)
- Yarn / npm (decided: pnpm)

---

## 3. Monorepo Structure

```
forge-pages/
├── apps/
│   ├── web/                    # Nuxt 3 — multi-tenant frontend
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

**RLS**: All tables must have Row Level Security enabled. Service role key used only in Edge Functions (server-side). Anon key never has write access to `landing_pages` or `clients`.

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
- [ ] Service role key only in server-side / Edge Functions

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
- Do not use Supabase service role key in client-side or Nuxt public runtime config
- Do not use `console.log` in production — use Sentry
- Do not suggest Firebase, Directus, Nuxt Content, ESLint, Prettier, Yarn, or Next.js
- Do not skip the security checklist for any new form or endpoint
- Do not run `pnpm install` without asking first
- Do not create files named `.env`, `.env.local`, `.env.production` with real values

---

## 14. Current Project State

> Update this section at the end of each phase.

- [ ] Phase 1 — Scaffolding (monorepo, tooling, base config)
- [ ] Phase 2 — Infra (Supabase migrations, Edge Functions, pg_cron)
- [ ] Phase 3 — CMS (Strapi 5, block content types, Dynamic Zone)
- [ ] Phase 4 — Frontend (Nuxt 3, tenant middleware, block components, Storybook)
- [ ] Phase 5 — Integrations (PostHog, Sentry, Turnstile, Upstash, Resend, WhatsApp, Flipt)
- [ ] Phase 6 — CI/CD (GitHub Actions, backup workflow, Dependabot)

**Project not yet initialized. Starting from Phase 1.**

---

## 15. Learnings

### 2026-07-08: Phase 1 deviations from the phase prompt
- **Biome v2 (2.5.3)** instead of the prompt's `^1.9.0` (user decision): `--apply` → `--write` everywhere (package.json scripts, lint-staged, `.mise.toml` `lint:fix`); config migrated via `biome migrate` (`files.ignore` → `files.includes` with negated globs, `organizeImports` → `assist.actions.source.organizeImports`, `rules.recommended` → `rules.preset`); `css.parser.tailwindDirectives: true` required to parse Tailwind v4 `@theme` blocks; secrets rule is now stable `security/noSecrets` (the prompt's `noSecretInSource` never existed in Biome).
- **`packages/types`**: `"typescript": "workspace:*"` from the prompt is invalid (TypeScript is not a workspace package) — pinned `^5.6.0` matching root.
- **`.npmrc` at root** pins `registry=https://registry.npmjs.org/`: the machine's global npm config points to a private CodeArtifact registry (work account) that 401s; this project uses public packages only.
- **pnpm 11** requires `allowBuilds: { '@biomejs/biome': true }` in `pnpm-workspace.yaml` for Biome's postinstall (the package.json `pnpm.onlyBuiltDependencies` field is not honored).
