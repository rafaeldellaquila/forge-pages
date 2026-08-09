---
name: edit-landing-page
description: Update an existing tenant's landing page in forge-pages — change copy, blocks, pricing, theme, colors, fonts, or SEO on an already-created landing_pages row. Use when asked to edit, update, or change a landing page, tweak content/copy/pricing for a specific tenant or domain, change a tenant's theme or colors, or "editar a landing page de X" / "atualizar o conteúdo/tema de X". Not for creating a brand-new tenant — use create-landing-page for that.
---

# Edit a landing page (existing tenant)

Editing means changing one existing `landing_pages` row — usually its `blocks` JSONB, but
sometimes its theme/background/SEO columns. There's no diffing tool and no CMS: every edit
is a direct read-modify-write of the row. Full reference:
`docs/ADD_CLIENT.md#editing-an-existing-landing-page` (EN) /
`docs/pt-br/NOVA-LANDING-PAGE.md` (PT).

## Steps

1. **Locate the exact row** — by `domain` (unique), never by `client_id` alone (a client
   could theoretically have more than one domain). Confirm you have the right tenant before
   changing anything: `select id, domain, status from landing_pages where domain = '<domain>'`.

2. **Read the current `blocks` array in full before changing anything.** Never write a
   partial/blind update — `blocks` is one JSONB value holding every section of the page, so
   an update that isn't built from the current array silently drops every block you didn't
   include. Fetch it, edit only the block(s) that need to change, and write the whole array
   back.

3. **Pick the right edit surface**:
   - **Studio cell edit** (Table Editor, click into the `blocks` cell) — best for a small,
     one-off change on a single environment (local or prod), especially prod, where seed
     files don't apply.
   - **Seed file edit** (`infra/supabase/seed/02_landing_pages.sql`) + `pnpm exec supabase db
     reset --workdir infra` — best when the change should survive a local reset (e.g. fixing
     a demo tenant's content for good). **Ask before running `db reset`** — it wipes local
     leads and any Studio-only edits made since the last reset.
   - **Direct SQL `UPDATE`** (Studio SQL editor or `psql`) — best for a large JSON edit that's
     awkward in Studio's cell editor, e.g. `update landing_pages set blocks = '<full new
     array>'::jsonb where domain = '<domain>'`. **Ask before running this against the
     production project.**

4. **Preserve the two block-JSON conventions when editing**:
   - If the edit adds a second block of a type that already appears elsewhere on the page
     (e.g. a second `value-proposition`), give it its own `anchorId` — a duplicate or missing
     `anchorId` breaks in-page nav links silently (no error, just a dead `#fragment`).
   - If the edit touches a `background` (on `header`, `hero`, `differentials`, or the
     page-level `background_*` columns), keep colors going through `colorToken`
     (`'primary'|'secondary'|'custom'`) via `resolveBackground()` (`lib/background.ts`) rather
     than hardcoding a hex value in the JSON.

5. **Know the two ways an edit can go wrong, and check for both**:
   - A field that fails Zod validation entirely (wrong type, missing required field) fails
     **loudly** at fetch time, naming the exact path — this is easy to catch, the page won't
     render.
   - A misspelled `variant` (e.g. `"centred"` instead of `"centered"`) fails **silently** —
     it falls back to `'default'` and the page still renders, just not the way you intended.
     A clean page load is not proof the edit did what you meant; re-check the rendered result
     against what was asked for, not just "no error."

6. **Non-block fields** also live on this same row and follow the same read-modify-write
   rule: `theme_mode` (`'dark'|'light'` only — `lib/theme.ts`'s `resolveNeutralTheme()` picks
   one of two fixed neutral ramps, not a free palette), `primary_color`/`secondary_color`
   (any valid CSS color), `font_family`/`secondary_font_family` (must be a name present in
   the curated registry — check `lib/fonts.ts`, not free text), and the SEO columns
   (`seo_title`, `seo_description`, `seo_og_image`, `canonical_url`).

7. **Verify** — reload the tenant (`curl -s -H "Host: <domain>" http://localhost:3000/` or
   the real URL) and confirm the specific change is visible, not just that the page still
   loads. For a prod edit, also check that other blocks on the page are unchanged (catches an
   accidental partial-array write from step 2).

## Guardrails (from `.claude/CLAUDE.md` §10)

- Ask before: running `supabase db reset`, running any `UPDATE` against the production
  project, running or generating a migration.
- Never touch `lib/types/blocks.ts` or `lib/schemas/blocks.ts` as part of an "edit" task —
  that's a schema change affecting every tenant, a different and much bigger task requiring
  explicit sign-off.
- Never edit another tenant's row while working on this one — always scope by the exact
  `domain` from step 1.
