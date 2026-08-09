---
name: create-landing-page
description: Onboard a new client by creating their landing page (tenant) in forge-pages — a new clients row, a new landing_pages row keyed by domain, and its blocks JSONB content. Use when asked to create a new landing page, onboard a new client, add a tenant, set up a new domain, or "criar um cliente novo" / "cadastrar uma landing page nova". Covers both local (*.localhost) and production onboarding.
---

# Create a landing page (new tenant)

A landing page is **one row** in `landing_pages`, keyed on `domain`, referencing one
`clients` row via `client_id`. There is no CMS and no per-client deploy — content is the
`blocks` JSONB array, validated by `lib/schemas/blocks.ts` and rendered by
`components/blocks/`. Full reference: `docs/ADD_CLIENT.md` (EN) /
`docs/pt-br/NOVA-LANDING-PAGE.md` (PT) — this skill operationalizes it; read one of those
first if anything below is unclear.

## Steps

1. **Gather the client's brand and content before writing any JSON**: name/email/whatsapp
   (for the `clients` row); `primary_color`/`secondary_color`/`font_family`/
   `secondary_font_family` (curated fonts only — check `lib/fonts.ts` for the registry, not
   free text); `theme_mode` (`'dark'` or `'light'` — picks a fixed neutral ramp per ADR-0010,
   see `lib/theme.ts`); SEO fields (`seo_title`, `seo_description`, `canonical_url`); and the
   actual page copy (headline, sections, pricing, testimonials, etc.).

2. **Decide the environment**:
   - Local (`*.localhost`, e.g. `novocliente.localhost`) — either insert directly via
     Supabase Studio (`http://127.0.0.1:54323`) for a quick one-off, or add rows to
     `infra/supabase/seed/01_clients.sql` and `infra/supabase/seed/02_landing_pages.sql` so
     the tenant survives `pnpm exec supabase db reset --workdir infra` — **ask before running
     `db reset`**, it wipes local leads and any Studio-made edits.
   - Production (`ofpnglnnzpowlzsyfbit`) — insert via Studio or its SQL editor with the real
     domain and `status = 'published'`. **Ask before inserting into the prod project.**

3. **Build the `blocks` array.** It's an ordered JSON array; each entry has a `type`
   discriminator plus that type's fields. Do not guess field names — the 11 valid types and
   their exact shapes are in `lib/types/blocks.ts` (TypeScript) and
   `lib/schemas/blocks.ts` (Zod, source of truth for validation), summarized in
   `.claude/rules/blocks.md`. Copy `infra/supabase/seed/02_landing_pages.sql`'s Forge Company
   row (the one real client, `domain = 'forgecompany.example.com'`) as a starting template rather
   than writing block JSON from scratch — it exercises `header`, `hero`, `differentials`,
   `value-proposition` (twice, with distinct `anchorId`s), `pricing`, `cta-form`, `footer`.

4. **Respect the two conventions block JSON must follow**:
   - `anchorId` (on every in-flow block type except `header`/`footer`) is **data, not a
     component literal** — required whenever the same block type appears more than once on
     one page (e.g. two `value-proposition` blocks need two distinct `anchorId`s or their
     nav links collide).
   - `background` (on `header`, `hero`, `differentials` only, plus the page-level
     `background_*` columns) is resolved by the single function `resolveBackground()` in
     `lib/background.ts` — colors go through `colorToken` (`'primary'|'secondary'|'custom'`),
     never a literal hex inline in the block.

5. **Validate before considering it done.** A block that fails Zod validation fails loudly
   at fetch time, naming the JSON path (e.g. `blocks.4.plans.0.price`) — that's a feature, not
   a bug to work around. An unrecognized `variant` silently falls back to `'default'` instead
   of erroring, so a typo'd variant won't be caught this way — re-check variant spelling by
   eye against the type definition.

6. **Verify**:
   ```bash
   curl -s -H "Host: <domain>" http://localhost:3000/ | grep -oiE '<title>[^<]*</title>'
   ```
   Then load the page and confirm the intended blocks render with the right theme — an empty
   `blocks` array (`[]`, the column default) renders a themed but contentless page, which
   looks like success on a title-only check.

7. **Production only** — after the row is live, note that the client's custom domain still
   needs Cloudflare for SaaS: a Custom Hostname on the zone (free per-domain SSL) plus the
   client's own `CNAME`. See `docs/adr/0001-hosting-cloudflare.md`. This skill covers the
   database side only; hand off DNS/SSL steps explicitly rather than assuming they're done.

## Guardrails (from `.claude/CLAUDE.md` §10)

- Ask before: running `supabase db reset`, inserting into the production project, running or
  generating any migration, creating files outside `infra/supabase/seed/`.
- Never touch `lib/types/blocks.ts` or `lib/schemas/blocks.ts` without asking first — they
  affect every tenant's page, not just the one being created.
- A genuinely new **block type** (not a new tenant) is a different, bigger task: new
  interface + schema + component. `mise run gen:block <name>` scaffolds the component and
  prints the rest — don't attempt it as part of "just adding a client."
