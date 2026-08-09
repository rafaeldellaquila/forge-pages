# forge-pages — CLAUDE.md

> This file is the single source of truth for the forge-pages project.
> Read it in full before any task. Never contradict decisions made here.
> When in doubt, ask before acting.

## 1. Product Overview

**forge-pages** is a multi-tenant SaaS platform that sells landing pages as a product to clients. Each client gets a landing page served on their own domain (e.g. `lp.cliente.com.br`). A single Next.js app serves all clients — the tenant is resolved from the `Host` header on every request. Content (blocks, copy, colors) lives as a typed JSON array in Supabase, edited directly via Supabase Studio (no CMS). Leads captured on landing pages are inserted straight into Supabase; the founder views them in Supabase Studio.

**GitHub org**: `forgecompany-tech`
**Repository**: `forgecompany-tech/forge-pages`
**Language standard**: All code, comments, variables, functions, filenames, database columns, API fields, and git messages in **English**. User-facing content (landing page text) in Portuguese.

**MVP rewrite (2026-08-04, ADR-0007)**: this project previously ran Nuxt 4 + Vue + Strapi 5 + NocoDB + PostHog + Sentry + Flipt + a VPS — dropped for a leaner MVP (zero paying clients at the time; cost/complexity had stalled progress). Historical learnings from that stack: `docs/HISTORY.md`. Full rationale: `docs/adr/0007-drop-strapi-nocodb-observability-vps.md` and `.claude/docs/MVP_REWRITE_CONTEXT.md`.

## 2. Full Stack

| Layer                | Tool                          | Notes                                                    |
| -------------------- | ------------------------------ | --------------------------------------------------------- |
| Frontend             | Next.js 16 (App Router)        | Multi-tenant by domain, Edge Middleware, Turbopack        |
| Component framework  | React 19 (Server + Client Components) |                                                     |
| Styling              | Tailwind CSS v4                | CSS-native, no config file                                |
| Validation           | Zod 4                          | `lib/schemas/blocks.ts` — validates JSON blocks at fetch  |
| Database             | Supabase (PostgreSQL)          | Blocks stored as `jsonb`, content edited via Studio        |
| Hosting (web)        | Cloudflare Workers             | `@opennextjs/cloudflare`; Vercel Pro is the documented Plan B (see ADR-0001) |
| Custom domains / SSL | Cloudflare for SaaS            | Free per-domain SSL                                        |
| Analytics            | Cloudflare Web Analytics       | Free, zero-config, no cookie banner                        |
| Bot protection       | Cloudflare Turnstile           | Invisible CAPTCHA, free                                     |
| Package manager      | pnpm                           | Single app, no workspace                                    |
| Runtime manager      | mise-en-place                  | Node 24 LTS fixed                                           |
| Linting + formatting | Biome                          | Replaces ESLint + Prettier                                  |
| Git hooks            | Husky + lint-staged            | Biome on staged files only                                  |
| TypeScript           | strict mode                    | No `any` allowed                                            |

**Deferred (not in the MVP, not discarded — see ADR-0007)**: error tracking (Sentry), feature flags (Flipt), rate limiting (Upstash), lead-notification channels (Resend email, WhatsApp Cloud API), a non-technical admin UI. Re-add only when the product's traffic/scale actually needs them.

**Decided and closed — do not suggest alternatives for:**

- Firebase (decided: Supabase)
- Strapi / Directus / Nuxt Content (decided 2026-08-04: Supabase JSONB — see ADR-0007)
- Vue / Nuxt (decided 2026-08-04: React / Next.js — see ADR-0007)
- NocoDB (decided 2026-08-04: Supabase Studio — see ADR-0007)
- A dedicated VPS for always-on services (decided 2026-08-04: none needed — see ADR-0007)
- ESLint / Prettier (decided: Biome)
- Yarn / npm (decided: pnpm)
- Koyeb / Domainee (decided 2026-07-09: Cloudflare Workers + Cloudflare-for-SaaS SSL — see ADR-0001)

## 3. Repo Structure

```
forge-pages/
├── app/                     # Next.js 16 App Router (layout.tsx, page.tsx, api/leads/)
├── components/blocks/       # React block components (Hero, Pricing, CtaForm, ...)
├── lib/                     # types/, schemas/, supabase.ts (read), leads.ts (write), turnstile.ts, background.ts, theme.ts
├── middleware.ts            # Edge middleware — Host header → x-tenant-host (NOT proxy.ts, see §12)
├── open-next.config.ts / wrangler.jsonc   # Cloudflare Workers config (OpenNext adapter)
├── infra/supabase/          # migrations/, seed/
├── docs/                    # adr/, HISTORY.md (archived Nuxt/Strapi learnings)
├── .github/workflows/       # CI (workflow_dispatch only until activated)
├── .mise.toml, .husky/, biome.json
├── .env.example             # Keys only, no values
└── CLAUDE.md, AGENTS.md
```

## 4. Architecture: Multi-Tenant by Domain

```
Visitor → Cloudflare (SSL) → Workers (Next.js, OpenNext)
  → middleware.ts  (edge; NOT proxy.ts — see §12)
    → strip port from Host → inject x-tenant-host header
  → app/layout.tsx + app/page.tsx (Server Components)
    → getCurrentTenant() → getLandingPageByHost(host), wrapped in React cache()
      → SELECT … FROM landing_pages WHERE domain = host AND status = 'published'
      → publishable key (RLS already scopes anon to published rows)
    → no row: notFound()
    → layout: tenant CSS vars + fonts + generateMetadata; page: render blocks
```

The middleware deliberately does **not** query Supabase: the page needs the same row for
its blocks, so querying twice (or serialising the row into a header) buys nothing and puts
the Supabase client in the edge bundle. One `cache()`d query serves layout and page (ADR-0008).

**Caching**: ISR is emulated by OpenNext via stale-while-revalidate (not native to Workers). The Next.js ISR cache key does **not** include the `Host` header. Reading `headers()` keeps both root segments dynamic (`next build` reports `/` as `ƒ`), so the collision cannot occur today — **adding `revalidate` to the root page reintroduces it** and needs a per-tenant cache key first (see `.claude/docs/TECHNICAL_REVIEW_CONTEXT7.md` §1).

## 5. Database Schema (Supabase / PostgreSQL)

### clients
```sql
id, name, email, whatsapp, created_at
```

### landing_pages
```sql
id, client_id, domain (unique), render_mode ('blocks'|'custom', default 'blocks'), status ('draft'|'published'|'archived')
seo_title, seo_description, seo_og_image, canonical_url
primary_color, secondary_color, font_family, secondary_font_family
theme_mode ('dark'|'light', default 'dark')
background_type, background_color_token, background_color_custom,
background_gradient_to_token, background_gradient_to_custom, background_image_url,
divider_glyph
blocks jsonb not null default '[]'   -- typed block array, validated with Zod on fetch
created_at, updated_at
```

`background_*`/`divider_glyph` are the page-level tenant background layer (ADR-0005); per-block overrides live inline in each block's JSON (see §6). `theme_mode` selects the neutral color ramp (ADR-0010).

### leads
```sql
id, landing_page_id, domain, name, whatsapp, email, message, intent,
utm_source, utm_medium, utm_campaign,
status ('new'|'contacted'|'converted'|'lost'), created_at
```

`domain` is the Host the lead arrived on, snapshotted at insert from the same resolved row as `landing_page_id` — provenance a human can read in Studio, not a cached join (it deliberately does not follow a later domain change). `landing_page_id` stays the ownership key; nothing reads `domain` to decide anything.

**RLS**: All tables must have Row Level Security enabled. **API keys**: publishable key (`sb_publishable_...`, `anon` role) for client-side reads, secret key (`sb_secret_...`, `service_role`, bypasses RLS) for server-side code only. Legacy `anon`/`service_role` JWT keys are disabled. The publishable key never has write access to `landing_pages` or `clients`. Secret keys are not JWTs — send on the `apikey` header, never `Authorization: Bearer`.

## 6. Block Types (JSON, Zod-validated)

Blocks live in `landing_pages.blocks` (JSONB array), typed in `lib/types/blocks.ts` and validated in `lib/schemas/blocks.ts`. All eleven types have components; `BlockRenderer` maps every one. Full type table, the `Background` shape, `anchorId` convention, and theming detail: `.claude/rules/blocks.md`.

## 7. Lead Flow

```
LeadForm (Client Component, inside the Server Component CtaFormBlock)
  → Cloudflare Turnstile widget (explicit render) produces a token
  → POST /api/leads
    → getCurrentTenant()  ← Host header; 404 before any write if unclaimed
    → leadInputSchema.safeParse  (unknown keys stripped)
    → intent ∈ this tenant's own cta-form selectOptions
    → verifyTurnstile()  (siteverify; fails CLOSED in production)
    → insertLead(tenant, …)  (Supabase secret key, server-only; stores id + domain)
  → Lead visible in Supabase Studio (readable by `domain`, keyed by landing_page_id)
```

**The trust boundary is the point** (ADR-0009): the client controls its own contact details and nothing else — `landing_page_id` and `domain` both come from the one `Host` resolution, `intent` must be a value the tenant offers, unknown body keys are stripped, rejections echo no fields (the body is all PII), and `anon` no longer has INSERT on `leads`.

No notification channels (email/WhatsApp) or retry queue in the MVP — deferred per ADR-0007. No rate limiting beyond Turnstile — the Zod length caps are the only bound on request size; acceptable at zero-traffic, revisit before paid-traffic launch.

## 8. Code Conventions

### File naming
- React components: `PascalCase.tsx` (e.g. `HeroBlock.tsx`)
- Hooks: `camelCase` with `use` prefix
- Route handlers: `kebab-case` folder + `route.ts` (App Router convention)
- Migrations: timestamp prefix (e.g. `20240101000000_create_leads.sql`)
### React components
- Server Components by default; `'use client'` only where interactivity requires it (forms, Turnstile widget)
- Props must be typed with interfaces from `lib/types/blocks.ts`
- No inline styles except where a runtime value can't be a Tailwind class (tenant colors, backgrounds — see ADR-0005)
- No `console.log` in production code
### Git
- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- **Always ask before committing**

### Environment variables
- Root `.env` (gitignored) is the single source of truth — mise auto-loads it and Next.js reads it natively from the project root (the old `env:sync` fan-out died with the monorepo)
- Root `.env.example` is the only example file (local defaults pre-filled, secrets empty)
- `NEXT_PUBLIC_*` vars are inlined into the client bundle — never put a secret behind that prefix
- Keep `.env` values **bare**: no surrounding quotes, no inline `#` comments — mise's dotenv parser captures both verbatim as part of the value. Put the note on its own line above the key (`.env.example` follows this)
- Prod values never live in local files: GitHub Actions secrets, Cloudflare env, Supabase Vault
- New variable → update root `.env.example` and `docs/SECRETS.md`; `.github/SETUP.md` if CI consumes it

## 9. Security Checklist

Apply to every new endpoint, form, or database operation:

- [ ] Input validated with Zod
- [ ] Supabase RLS policy exists for affected tables
- [ ] No secrets in code (Biome enforces via `security/noSecrets`)
- [ ] Turnstile verified on all public-facing forms
- [ ] Secret key (`sb_secret_...`) only in server-side code — never in client bundles or `NEXT_PUBLIC_*`

## 10. Guardrails

**Always ask before**: creating/deleting files outside the expected structure, running or generating database migrations, installing new dependencies, git commits/branches, touching `.env` values, modifying `lib/types/blocks.ts` interfaces (impacts every block consumer), any destructive or irreversible operation.

**Never**: use `any` in TypeScript (use `unknown` and narrow); commit `.env` files with real values; add a block without a matching type in `lib/types/blocks.ts` and schema in `lib/schemas/blocks.ts`; use the Supabase secret key in client-side code or `NEXT_PUBLIC_*` vars; use legacy `anon`/`service_role` JWT keys; use `console.log` in production; suggest Firebase, Strapi, Directus, Nuxt Content, Vue, ESLint, Prettier, or Yarn; skip the security checklist for a new form/endpoint; run `pnpm install` without asking first.

## 11. Current Project State

> Update this section at the end of each phase.

**Fases 1–6 (Nuxt/Strapi stack) — SUPERSEDED.** See ADR-0007 and `docs/HISTORY.md` for what shipped and why it was dropped.

**MVP rewrite phases** (`.claude/docs/MVP_REWRITE_CONTEXT.md`). Full per-phase build + verification detail: `.claude/rules/phase-history.md`.
- [x] Fase 0 — Reset repo, infra, docs — completed 2026-08-04.
- [x] Fase 1 — Core multi-tenant + Forge Company real content — completed 2026-08-05.
- [x] Fase 2 — Lead capture (form → Supabase) — completed 2026-08-05.
- [x] Fase 3 — Second/third tenant — completed 2026-08-05.
- [ ] Fase 4 — Deploy (Cloudflare Workers, 3 domains live) — in progress since 2026-08-05;
      punch list in `.claude/rules/phase-history.md`'s Fase 4 entry.
- [ ] Fase 5 — Visibility (Supabase Studio + Cloudflare Analytics)

## 12. Learnings

Per-phase learnings live in `.claude/rules/learnings.md` (Fase 0 and Fase 1 recorded there). Read it before touching the render path, the Cloudflare build, or the block system — it holds the traps that cost time.

Historical learnings from the Nuxt/Vue/Strapi/NocoDB/VPS build (2026-07-08 → 2026-08-04) are archived in `docs/HISTORY.md` — several entries (Supabase key model, Turnstile/Cloudflare token validation, mise/tera quirks) remain true after the rewrite.
