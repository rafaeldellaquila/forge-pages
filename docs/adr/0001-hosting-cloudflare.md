# 1. Web hosting on Cloudflare; Koyeb and Domainee dropped

Date: 2026-07-09
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

The product is a multi-tenant SaaS: one Nuxt app serving many client domains, each needing
SSL. Bot protection is already **Cloudflare Turnstile**, so Cloudflare is in the stack.

## Decision

- **Web app (Nuxt 4) → Cloudflare Workers/Pages** via Nitro's `cloudflare` preset. Free,
  commercial use permitted, global edge, and **Cloudflare for SaaS** provisions SSL for
  each client custom hostname at no cost.
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

- Nitro build target becomes `cloudflare` for production (`nuxt.config` preset or
  `NITRO_PRESET=cloudflare` at deploy). ISR/route rules map to Cloudflare cache.
- Custom-domain onboarding uses the Cloudflare for SaaS API instead of Domainee (to be
  wired when the first client is onboarded).
- Strapi/Flipt/NocoDB remain local-only until a paid host is chosen; the app degrades
  gracefully without them (Flipt fails open; Strapi content is fetched server-side).
- Turnstile + hosting + SSL are consolidated under one Cloudflare account.
- Secrets/config that referenced Koyeb/Domainee are removed from the repo.
