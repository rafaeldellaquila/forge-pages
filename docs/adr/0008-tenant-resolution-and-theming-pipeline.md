# 8. Tenant resolution and theming pipeline

Date: 2026-08-05
Status: Accepted

## Context

Fase 0 left a stub: `middleware.ts` resolved the `Host` header onto an `x-tenant-host`
request header, and `app/page.tsx` printed it. Nothing turned a `landing_pages` row into a
rendered page. Fase 1 had to decide four things at once — where the row is fetched, which
key fetches it, how per-tenant brand values reach CSS, and where a block's in-page anchor
comes from.

The starting point was CLAUDE.md §4, which described the proxy querying Supabase and
returning 404 on a miss. That shape has two costs: the page still needs the row for its
blocks (so either a second round-trip or the row serialised into a request header, which is
size-capped and fragile), and it puts the Supabase client into the Edge middleware bundle,
which on this deploy target is the constrained runtime (see the `middleware`/`proxy` trap in
CLAUDE.md §12).

## Decision

### 1. The tenant row is fetched in Server Components, not in the proxy

`middleware.ts` keeps doing exactly one thing: strip the port off `Host` and set
`x-tenant-host`. `lib/supabase.ts` exposes `getLandingPageByHost()` wrapped in React
`cache()`, and `lib/tenant.ts` adapts it to the request (`getCurrentTenant()`). Both
`app/layout.tsx` (theming, `generateMetadata`) and `app/page.tsx` (blocks) call it and share
a single query. No row → `notFound()`.

This supersedes the CLAUDE.md §4 diagram, which has been corrected.
`docs/LOCAL_DEVELOPMENT.md` §6 already described this flow.

A side effect worth stating explicitly: reading `headers()` opts both segments into dynamic
rendering. That is what makes the Host-blind ISR cache key harmless — the collision warned
about in CLAUDE.md §4 and `TECHNICAL_REVIEW_CONTEXT7.md` §1 cannot happen while the route
is dynamic. **Adding `revalidate` to the root page reintroduces it**, so it must not be
added without a per-tenant cache key.

### 2. Page reads use the publishable key

RLS already limits `anon` to `status = 'published'` rows on `landing_pages`
(`20240101000002_enable_rls.sql`). The secret key would therefore be privilege the read
path does not need. It stays reserved for writes — the Fase 2 lead insert — keeping the
blast radius of the render path as small as the policy allows.

### 3. Brand values reach CSS as custom properties on `<html>`

`app/layout.tsx` sets `--tenant-primary`, `--tenant-secondary`, `--tenant-background`,
`--tenant-font` and `--tenant-font-secondary` as an inline style. Tailwind's `@theme` block
in `globals.css` re-exports them as `--color-tenant-*` / `--font-tenant-*` so components
use ordinary utilities (`bg-tenant-primary`, `font-tenant`) and never a literal hex —
ADR-0002 rule 4 enforced by construction rather than by review.

`--tenant-background` is new and exists because two surfaces must match the page rather
than guess: the sticky header's glass fallback and the seam divider's glyph mask. It is the
flat fill colour behind the page background, produced by `resolveBackgroundBaseColor()`.

Neutrals (`--color-surface`, `--color-ink`, …) stay literal, which ADR-0005 permits since
they do not vary per tenant today. **Known gap**: the current ramp is tuned for a dark
surface. A light tenant needs a different one — revisit in Fase 3.

### 4. Fonts come from a curated registry, not a free-text field

`next/font/google` self-hosts fonts and generates `@font-face` at build time, so it needs
static literals; `landing_pages.font_family` is a runtime string. `lib/fonts.ts` resolves
that string against a fixed registry (Montserrat, JetBrains Mono, Inter, Poppins,
Merriweather) and falls back to a system stack for anything unrecognised.

Rejected alternative: emitting a `<link>` to Google Fonts built from the column. It accepts
any family with no redeploy, but adds a render-blocking third-party request per page, FOUT
and CLS, and puts an unvalidated database string into a URL. Adding a family is one entry
plus a redeploy, which is acceptable while tenants are onboarded by hand.

### 5. A block's anchor is data, not a component literal

Blocks that render an in-flow section carry an optional `anchorId`. The first
implementation hardcoded `id="manifesto"` in `DifferentialsBlock`, `id="pacotes"` in
`PricingBlock` and so on — Forge Company's own section names baked into components every
other tenant shares. It also could not work: `value-proposition` appears twice on the page
(Processo and Setores) and a component-level constant cannot give the two occurrences
different anchors, so two header menu links pointed at nothing.

`anchorId` was added to `hero`, `value-proposition`, `differentials`, `pricing` and
`cta-form` — the block types with components today. The remaining types get the field
alongside their components in Fase 3.

## Consequences

- `lib/types/blocks.ts` gains `eyebrow?: string` (`value-proposition`, `differentials`,
  `pricing`) and `anchorId?: string` (the five in-flow types). Additive and optional: no
  existing content needs migrating and no consumer breaks.
- Every block component is themed only through `--tenant-*`; a hardcoded brand colour is
  now a reviewable anomaly rather than the default path.
- The renderer is deliberately partial — `lib/schemas/blocks.ts` validates all eleven block
  types, `BlockRenderer` maps the seven with components, and a valid-but-unmapped type
  renders nothing instead of breaking the page.
- Verification must exercise the Workers runtime, not just `next dev` (CLAUDE.md §12).
  Fase 1 was checked on both, including static asset serving from `public/brand/`.
