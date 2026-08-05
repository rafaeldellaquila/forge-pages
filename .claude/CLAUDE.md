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
├── lib/                     # types/blocks.ts, schemas/blocks.ts, supabase.ts, background.ts
├── proxy.ts                 # Edge proxy (Next 16 name for middleware) — Host header → tenant
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
  → proxy.ts
    → query Supabase: SELECT * FROM landing_pages WHERE domain = host
    → if not found: return 404
    → inject tenant context (x-tenant-host header)
  → app/page.tsx (Server Component) → render blocks array
```

**Caching**: ISR is emulated by OpenNext via stale-while-revalidate (not native to Workers). The Next.js ISR cache key does **not** include the `Host` header — mitigate with explicit per-tenant revalidation rather than a bare `revalidate: N` on the root page (see `.claude/docs/TECHNICAL_REVIEW_CONTEXT7.md` §1).

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
background_type, background_color_token, background_color_custom,
background_gradient_to_token, background_gradient_to_custom, background_image_url,
divider_glyph
blocks jsonb not null default '[]'   -- typed block array, validated with Zod on fetch
created_at, updated_at
```

`background_*`/`divider_glyph` are the page-level tenant background layer (ADR-0005); per-block overrides live inline in each block's JSON (see §6).

### leads
```sql
id, landing_page_id, name, whatsapp, email, message, intent,
utm_source, utm_medium, utm_campaign,
status ('new'|'contacted'|'converted'|'lost'), created_at
```

**RLS**: All tables must have Row Level Security enabled. **API keys**: publishable key (`sb_publishable_...`, `anon` role) for client-side reads, secret key (`sb_secret_...`, `service_role`, bypasses RLS) for server-side code only. Legacy `anon`/`service_role` JWT keys are disabled. The publishable key never has write access to `landing_pages` or `clients`. Secret keys are not JWTs — send on the `apikey` header, never `Authorization: Bearer`.

## 6. Block Types (JSON, Zod-validated)

Blocks live in `landing_pages.blocks` (JSONB array). Each block type has a TypeScript interface in `lib/types/blocks.ts` and a matching Zod schema in `lib/schemas/blocks.ts`. An unrecognized `variant` falls back to `default` (ADR-0002); a failed schema on the whole page fails loudly in the Server Component rather than rendering silently broken.

| Block `type`        | Key fields                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `header`             | variant (`default`\|`centered`), background, logo, menuLinks[], ctaLabel, ctaWhatsapp, ctaMessage    |
| `hero`               | variant (`default`\|`centered`), background, badgeText, headline, subheadline, ctaPrimaryLabel/Link, ctaSecondaryLabel/Link, image, imageAlt |
| `trust-icons`        | items[]: { icon, text }                                                                                |
| `stats`              | items[]: { number, label }                                                                             |
| `value-proposition`  | headline, text, cards[]: { icon, title, description }                                                  |
| `services`           | headline, tabs[]: { label, title, text, ctaLabel, ctaLink, image }                                     |
| `differentials`      | background, headline, text, items[]: { icon, tag, text }                                               |
| `testimonials`       | headline, items[]: { name, role, photo, text, rating }                                                 |
| `cta-form`           | headline, subheadline, selectOptions[]: { label, value }, ctaLabel, whatsappNumber, whatsappMessage    |
| `footer`             | logo, description, links[], phones[], schedule, socialLinks[], copyright, privacyLink                  |
| `pricing`            | headline, subheadline, plans[], note                                                                    |

**`Background`** shape (ADR-0005): `type` (`transparent`\|`solid`\|`gradient`\|`image`\|`fine-line-texture`\|`glass`, default `transparent`), `colorToken` (`primary`\|`secondary`\|`custom`), `customColor`/`gradientToCustom`, `gradientToToken`, `image`, `effect` (`none`\|`particles`). Absent/`transparent` shows whatever's behind the block. `lib/background.ts`'s `resolveBackground()` is the single place this shape turns into CSS.

## 7. Lead Flow

```
Form submit (React Client Component)
  → Cloudflare Turnstile widget produces a token
  → POST /api/leads
    → Zod validation
    → Turnstile siteverify (server-side)
    → INSERT into leads (Supabase, secret key, server-only)
  → Lead visible in Supabase Studio (filter by landing_page_id)
```

No notification channels (email/WhatsApp) or retry queue in the MVP — deferred per ADR-0007. No rate limiting beyond Turnstile — acceptable at zero-traffic, revisit before paid-traffic launch.

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

**MVP rewrite phases** (`.claude/docs/MVP_REWRITE_CONTEXT.md`):
- [x] Fase 0 — Reset repo, infra, docs — completed 2026-08-04. Next.js 16.3.0 + React 19.2.8 + Tailwind 4.3.3 + Zod 4.4.3; flat app at root, monorepo gone. Verified: `biome check` + `tsc --noEmit` clean, `next build` and `opennextjs-cloudflare build` pass, tenant resolution by `Host` header confirmed on **both** `next dev` (:3000) and `wrangler dev` (:8787, real workerd) including port stripping. Supabase local + cloud (`ofpnglnnzpowlzsyfbit`) migrated: `blocks jsonb` added, `strapi` schema + `webhook_retries` + retry cron + lead webhook dropped, anon/authenticated grants restored to least privilege. Not yet built (Fase 1+): `lib/schemas/blocks.ts`, `lib/supabase.ts`, `lib/background.ts`, `components/blocks/*`, `app/api/leads/` — `app/page.tsx` is still a stub that prints the resolved tenant host.
- [ ] Fase 1 — Core multi-tenant + Forge Company real content
- [ ] Fase 2 — Lead capture (form → Supabase)
- [ ] Fase 3 — Second/third tenant (`dellaquila.dev`, `imobiliaria.forgecompany.example.com`)
- [ ] Fase 4 — Deploy (Cloudflare Workers, 3 domains live)
- [ ] Fase 5 — Visibility (Supabase Studio + Cloudflare Analytics)

## 12. Learnings

Historical, stack-specific learnings from the Nuxt/Vue/Strapi/NocoDB/VPS build (2026-07-08 → 2026-08-04) are archived in `docs/HISTORY.md` — several entries (Supabase key model, Turnstile/Cloudflare token validation, mise/tera quirks) remain true and useful even after the rewrite.

### 2026-08-04: Fase 0 — repo reset to Next.js 16 + Cloudflare Workers

- **Keep `middleware.ts`; do NOT migrate to Next 16's `proxy.ts`.** `next build` prints a deprecation warning telling you to switch, and switching passes `next build` — then fails `opennextjs-cloudflare build` with "Node.js middleware is not currently supported." `proxy.ts` is hardwired to the Node.js runtime (Next *throws* on a route segment config in a proxy file), and OpenNext/Cloudflare only supports Edge middleware. Next's own v16 upgrade guide says to stay on `middleware` if you need edge. The warning is a trap for this deploy target; `middleware.ts` carries a comment saying so.
- **`Headers.set()` returns `void`**, so it can't be chained off the constructor — `new Headers(h).set(...)` fails with `TS2322: Type 'void' is not assignable to type 'Headers | undefined'`. Assign, then mutate. (The original snippet in `.claude/docs/TECHNICAL_REVIEW_CONTEXT7.md` had this bug; it's corrected there now.)
- **Verify on the Workers runtime, not just `next dev`.** `next build` succeeding proves nothing about Workers — the middleware constraint above only surfaces in `opennextjs-cloudflare build`, and only `wrangler dev` exercises workerd. Both are part of the verification loop.
- **Tenant assertions need `<!-- -->` tolerance**: React emits an HTML comment between static text and an interpolated value, so `grep "Tenant host: [^<]*"` finds nothing. Match `Tenant host: <!-- -->[^<]*` (or read the RSC payload).
- **Cloud grant drift is real and RLS masks it.** `supabase db diff --linked` found `anon` *and* `authenticated` holding SELECT/INSERT/UPDATE/DELETE on all three tables, far beyond what the RLS migration grants. RLS was still blocking it (no matching anon policy), so nothing was exploitable — but table grants are the second layer and must not be wider than the policies. Fixed in `20260804000001_revoke_anon_write_grants.sql`, which also does `alter default privileges ... revoke` so new tables don't reintroduce it. **Run `supabase db diff --linked` after any cloud push** — `db push` reporting success does not mean cloud matches the migrations.
- **Guess a function name in a DROP and it silently no-ops.** The lead webhook trigger function was `on_new_lead_webhook()`, not the `notify_new_lead()` a migration guessed, so the function outlived its trigger. `drop ... if exists` reports success either way; confirm the real name (via `db diff` or `pg_proc`) before trusting the drop.
- **Always pass `--workdir infra` to `supabase`.** Without it the CLI creates a stray `./supabase/` at the repo root and links the project there (now gitignored, and the `db:migrate` task hardcodes the flag). `supabase db execute` does not exist in CLI 2.111 — seeding goes through `db reset`, driven by `config.toml`'s `[db.seed] sql_paths`.
- **Next 16 writes root `AGENTS.md` + `CLAUDE.md` on every `next dev`** (`agentRules`), containing its own "this is NOT the Next.js you know" guardrail. Kept deliberately — that block is exactly the warning that the `middleware`/`proxy` trap above needed. The project's own instructions stay in `.claude/CLAUDE.md`; set `agentRules: false` in `next.config.ts` if the duplication ever becomes a problem.
- **`pnpm run lint` fails in this environment via the rtk hook** (misroutes to eslint: `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL, Command "eslint" not found`). The script is `biome check .` and is fine — run `rtk proxy pnpm run lint` or `pnpm exec biome check .`.
- **pnpm 11 build allowlist** moved to `pnpm-workspace.yaml`'s `allowBuilds` (kept even with no workspace packages): `esbuild` and `workerd` need `true`, set via `pnpm approve-builds --all`.
