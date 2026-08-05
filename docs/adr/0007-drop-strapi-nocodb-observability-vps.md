# 7. Drop Strapi, NocoDB, observability stack, and the VPS — MVP rewrite to Next.js + Supabase JSONB

Date: 2026-08-04
Status: Accepted

## Context

By 2026-08-04, `forge-pages` had a complete, working Nuxt 4 + Vue + Strapi 5 + NocoDB +
PostHog + Sentry + Flipt stack (6 phases shipped), with a São Paulo VPS planned to host
the always-on services. But there were **zero paying clients**,
and the operational surface — a CMS, a lead-management UI, three observability/flagging
services, and a VPS to keep patched — had grown large relative to the product's actual
validated need: prove that a landing-page-as-a-service model works, using the founder's
own agency (Forge Company) as the first real tenant.

A "Grill Me" session on 2026-08-04 (`docs/GO_LIVE.md`-adjacent, see
`.claude/docs/MVP_REWRITE_CONTEXT.md`) concluded that cost and complexity — not product
risk — were the actual blockers to shipping. The multi-tenant-by-domain architecture, the
Supabase schema, and the block/variant content model (ADR-0002, ADR-0005) were all sound
and validated; what needed cutting was everything downstream of "how is content edited and
where does the app run."

## Decision

- **Drop Strapi entirely.** Blocks become a typed JSON array (`landing_pages.blocks
  jsonb`), validated with Zod at fetch time (`lib/schemas/blocks.ts`) instead of a CMS
  schema. The sole editor (the founder, technical) edits JSON directly in Supabase Studio.
  The CMS-preview and Strapi-schema-isolation decisions become moot with no Strapi to
  preview or isolate.
- **Drop NocoDB.** Leads are viewed directly in Supabase Studio, filtered by
  `landing_page_id`. No separate partner-facing lead UI in the MVP.
- **Drop PostHog, Sentry, Flipt.** Replaced by **Cloudflare Web Analytics** (free,
  zero-config, no cookie banner) for visit tracking. Error tracking and feature flags are
  deferred, not replaced — re-add if/when the product needs them, not before.
- **Drop the VPS and Cloudflare Tunnel/Access for internal services** — there
  are no more always-on internal services to host.
- **Drop the webhook/retry lead-notification chain** (`webhook_retries` table, pg_cron
  retry job, Resend/WhatsApp Cloud API notifications). The MVP lead flow is a direct
  insert into `leads` from a route handler (`POST /api/leads`); notification channels
  are deferred fast-follows, not part of Phase 0–5.
- **Replace Nuxt 4 + Vue with Next.js 16 + React 19**, hosted the same way ADR-0001
  already decided (Cloudflare Workers, now via `@opennextjs/cloudflare` instead of Nitro's
  `cloudflare` preset), with Vercel Pro as the same documented Plan B.
- **Collapse the pnpm workspace monorepo into a single flat Next.js app** at the repo
  root (`app/`, `components/blocks/`, `lib/`) — `apps/*` and `packages/*` are removed;
  there is exactly one deployable unit now, so a workspace buys nothing.
- **What does NOT change**: the Supabase multi-tenant-by-domain resolution (`Host` header
  → `landing_pages` row), the `clients`/`landing_pages`/`leads` schema shape, RLS policy
  design, the publishable/secret key model, Cloudflare Turnstile bot protection, and the
  block/variant content model from ADR-0002 (still valid, framework-agnostic). ADR-0002
  and ADR-0005 are updated in place (v2 headers) to reflect React/JSON instead of
  Vue/Strapi — their actual decisions are unchanged.

## Consequences

- `apps/cms/`, `packages/ui/`, `packages/types/`, `pnpm-workspace.yaml`, `.changeset/` are
  deleted. `packages/types/src/blocks/*.ts` content is ported to `lib/types/blocks.ts`
  (the interfaces were already framework-agnostic).
- **ADR-0003, ADR-0004 and ADR-0006 are deleted**, and their numbers are retired — the gap
  in the sequence is deliberate, not a missing file. They documented CMS hosting on a VPS,
  Strapi's Content Manager preview, and Strapi's Postgres schema isolation: all three
  describe systems that no longer exist, so keeping them as "Superseded" only added
  archaeology for future readers. Their full text remains in git history.
- `.claude/CLAUDE.md` is rewritten for the new stack. `docs/HISTORY.md` keeps only the
  learnings that still hold for the surviving parts of the stack — the Supabase key model,
  CLI quirks, Postgres grant rules, Cloudflare/Turnstile token validation and mise/dotenv
  gotchas. Everything tied to the retired tools went with them.
- Security/observability trade-off, explicitly accepted for the MVP: no error tracking,
  no feature flags, no rate limiting beyond Turnstile in the initial lead-capture flow
  (Upstash rate limiting is deferred along with the rest of the observability stack) —
  acceptable at zero-traffic, must be revisited before any paid-traffic launch.
- Onboarding a new client after this ADR is: one row in `landing_pages` (with a `blocks`
  JSON array), one custom hostname in Cloudflare for SaaS — no CMS entry, no VPS-hosted
  service to touch.
