# 12. Block additions from competitor landing page research

Date: 2026-08-19
Status: Accepted

## Context

The block system had shipped its original 11 types (Fase 1–3) with no process for
finding gaps other than the tenants already on the platform. To find real patterns
worth adding, 8 live landing pages the user picked (car/moto dealers, a hair-transplant
clinic, a dental clinic, a doctor, a furniture B2B site, a VIP-list opt-in, and a
construction company) were studied — text-summarized via `WebFetch`, then
screenshot-verified for the sections tied to the chosen additions (via the documented
`playwright-core` + cached Chromium workaround, the MCP server's `chrome` channel not
being installed in this environment — see `.claude/rules/learnings.md`).

Patterns found with no home in the existing 11 types: FAQ/accordion, a
product/inventory grid, a numbered process/steps flow, a comparison table, a
before/after image gallery, a multi-location block, and a persistent floating WhatsApp
button present on nearly every reference site.

## Decision

### Process/steps is a new `variant` on `value-proposition`, not a new block type

`value-proposition`'s `cards[]` already carries `icon`, `title`, `description`, and a
`stepLabel?` field built specifically for "step 1/2/3" framing — the only thing the
references had that this type didn't was a vertical/stacked layout instead of a grid.
Per ADR-0002's rule ("a variant is a property, never a new block type; break this only
when a layout needs a field the others structurally cannot share"), this doesn't clear
that bar. `ValuePropositionVariant = 'default' | 'timeline'` reuses every existing
field; `'timeline'` renders the same `cards[]` as a vertical numbered flow with a
connecting line instead of a grid. This is the type's second layout, so per ADR-0002/
ADR-0005 it stays a single file with an inline branch — the two-level component split
is deferred until a third layout exists.

### Five genuinely new block types

FAQ, product/inventory grid, comparison table, before/after gallery, and locations
each need fields no existing type has (question/answer pairs, priced items with specs,
paired us-vs-them columns, paired images, addresses) — these are new block types, not
variants, following the same rule above from the other direction.

- **`faq`**: two-column layout (eyebrow/headline + accordion), mirroring
  `differentials`'s composition. Needs one new client component for open/close state
  (same pattern as `services`' `ServiceTabs.tsx`).
- **`product-grid`**: a card grid with optional price/specs/badge — distinct from
  `pricing` (subscription-style plans) and `services` (tabs), matched to the
  reference sites selling physical inventory (cars, motorcycles, furniture).
- **`comparison-table`**: two (or more) columns, each with its own list of positive/
  negative rows and an optional `featured` flag — reuses the same
  featured-column idea as `pricing.plans[].featured` rather than inventing a new one.
- **`before-after`**: ships as a **static grid**, not the carousel the reference site
  used — same composition as the existing `testimonials` grid, no new client-side
  interaction pattern to maintain. Matches this codebase's repeated "ship the minimal
  real-need version, defer the rest" posture (ADR-0002/0005/0010 all do this). A
  carousel is a clean future variant if a client needs more pairs than a grid holds
  comfortably.
- **`locations`**: a card grid (icon, city, address) for multi-unit tenants (clinics,
  franchises).

None of the five gets a `background` field — today only `header`/`hero`/
`differentials` have one, and `pricing`/`testimonials` (the closest structural
precedents for these five) don't either. No new length caps were added to their Zod
schemas — the existing 11 types have none, and fixing that pre-existing gap is out of
scope for this round.

### The floating WhatsApp button is tenant-level page chrome, not a block

Unlike every block type, it has no position in the content flow, no `anchorId`, and
doesn't participate in seam rendering — it's a fixed, always-visible element, the same
category as `favicon_url`/`seo_*` (ADR-0011's precedent for tenant-scoped, non-block
config). It's three new nullable `landing_pages` columns
(`whatsapp_float_enabled`, `whatsapp_float_number`, `whatsapp_float_message`), read in
`app/layout.tsx` next to the rest of the tenant config, rendered by a small client
component mounted at the layout root — not a `BlockRenderer` case.

## Consequences

- `lib/types/blocks.ts`/`lib/schemas/blocks.ts` gain one variant and, as each ships,
  one new discriminated-union member per new type — each addition is its own PR,
  following the mechanical flow `.claude/rules/blocks.md` and `mise run gen:block`
  already establish.
- `HeaderBlock.tsx`'s existing `wa.me` link-building logic is extracted into
  `lib/whatsapp.ts`'s `buildWhatsappLink()` — `product-grid`'s per-item
  `ctaWhatsapp`/`ctaMessage` fields became its second consumer first, ahead of the
  floating button.
- The floating WhatsApp button is the one addition needing a migration; it ships last
  in this sequence, after the five self-contained block types.
- `.claude/rules/blocks.md`'s block-type table and `.claude/CLAUDE.md` §6 get updated
  incrementally as each type ships, same as every prior block addition.
