# 1. Web hosting on Cloudflare; Koyeb and Domainee dropped

Date: 2026-07-09 (v2: 2026-08-04 — framework changed from Nuxt/Nitro to Next.js/OpenNext, see ADR-0007)
Status: Accepted

## Context

CLAUDE.md originally specified **Koyeb** ("free tier, Node.js persistent") for hosting
and **Domainee** for per-client custom-domain SSL. Two problems surfaced before any
deployment:

1. **Koyeb no longer offers a usable free tier** — it moved to paid instances, so the
   "free tier" assumption is invalid and we are not ready to pay during development.
2. **Domainee** (`api.domainee.io`) could not be verified — no confirmed API contract or
   account — and its only job (per-domain SSL) overlaps with functionality Cloudflare
   already provides for free.

The product is a multi-tenant SaaS: one app serving many client domains, each needing
SSL. Bot protection is already **Cloudflare Turnstile**, so Cloudflare is in the stack.

**2026-08-04 update**: the frontend framework changed from Nuxt 4 to Next.js 16 (ADR-0007
— MVP rewrite, Vue/Strapi dropped). This ADR's hosting decision (Cloudflare, Domainee
dropped) is unchanged; only the build adapter differs — Nitro's `cloudflare` preset
doesn't apply to Next.js, so the equivalent is `@opennextjs/cloudflare` (1.20.2), which
builds to `.open-next/` and deploys via `wrangler.jsonc` + `wrangler deploy`. See
`.claude/docs/TECHNICAL_REVIEW_CONTEXT7.md` §2 for the verified setup.

## Decision

- **Web app (Next.js 16) → Cloudflare Workers** via `@opennextjs/cloudflare`. Free,
  commercial use permitted, global edge, and **Cloudflare for SaaS** provisions SSL for
  each client custom hostname at no cost.
- **Vercel Pro (R$ 110/mo) is the documented Plan B**: if `next/image`/ISR gaps on
  Workers cost more than ~1 day of debugging, switch without guilt — landing pages are
  mostly static, so this is expected to be a non-issue, but the fallback is deliberate,
  not improvised.
- **Drop Domainee** entirely. Cloudflare for SaaS custom hostnames replaces it. The
  Phase 5 Domainee code (`server/utils/domainee.ts`, `server/api/admin/domains.post.ts`,
  `adminApiToken`) is removed.
- **Defer deployment of always-on services** (Strapi CMS, Flipt, NocoDB). Free hosting for
  persistent Node/containers is weak (Render free sleeps; Fly/Railway are credit-based).
  These run locally during development and get a small paid host once there are paying
  clients.
- **No cost is incurred now.** CI/CD (Phase 6) is GitHub-side only; deployment is a later,
  opt-in step.

## Consequences

- Build target is `npx opennextjs-cloudflare build` (produces `.open-next/`) + `wrangler
  deploy`, replacing the retired Nitro `cloudflare` preset. ISR is emulated via
  stale-while-revalidate (not native) — acceptable for landing pages, revisit if traffic
  ever demands persistent KV/R2 incremental cache.
- Custom-domain onboarding uses the Cloudflare for SaaS API instead of Domainee (to be
  wired when the first client is onboarded).
- Strapi/Flipt/NocoDB/VPS are dropped entirely, not deferred — see
  ADR-0007. Content lives in Supabase JSONB instead.
- Turnstile + hosting + SSL are consolidated under one Cloudflare account.
- Secrets/config that referenced Koyeb/Domainee are removed from the repo.
