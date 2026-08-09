# 10. Per-tenant light/dark neutral theming

Date: 2026-08-05
Status: Accepted

## Context

`globals.css`'s `@theme` block defines the platform's neutral colors —
`--color-surface`, `--color-surface-line`, `--color-ink`, `--color-ink-dim`,
`--color-ink-muted` — as literal hex values. ADR-0002 rule 4 permits neutrals to be
literal as long as they don't vary per tenant, which was true through Fase 1: Forge
Company was the only tenant with real content, and its page is dark. The block was left
with an explicit comment flagging the gap: *"a light tenant needs a different neutral
ramp. Revisit in Fase 3."*

Fase 3 onboards `dellaquila.dev`, a developer-portfolio-style page that reads better
light than dark. Reusing the dark ramp unconditionally would mean either forcing every
future tenant dark regardless of brand, or shipping a light tenant with unreadable
dark-on-dark or light-on-dark text — the neutrals and the page background would fight
each other.

## Decision

### `theme_mode` selects one of two fixed ramps, not a free-text palette

`landing_pages.theme_mode` is `'dark' | 'light'`, default `'dark'` (every existing tenant
keeps today's rendering with no data migration). `lib/theme.ts` holds both ramps as
constants and exports `resolveNeutralTheme(themeMode)`, returning the five
`--tenant-surface*` / `--tenant-ink*` custom properties for whichever ramp applies.

This mirrors the font registry's rationale (ADR-0008 §4): a small curated set beats an
open field. Per-tenant `primaryColor`/`secondaryColor` are meant to swing widely and
`resolveBackground()` already handles arbitrary hex there — but the neutrals are what
every block's text and card surfaces sit on, and an arbitrary pair of tenant-supplied
neutral hexes has no guarantee of passing contrast against arbitrary brand colors. Two
ramps, each tuned as a set, is a deliberate constraint in exchange for that guarantee.

### The neutrals move from `@theme` literals to `--tenant-*` indirection

`app/layout.tsx` already sets `--tenant-primary`, `--tenant-secondary`, etc. as inline
styles on `<html>` per request. `resolveNeutralTheme()`'s result is merged into that same
style object, so `--tenant-surface`/`--tenant-ink`/etc. are now request-scoped exactly like
the brand colors. `globals.css`'s `@theme` block changes from:

```css
--color-surface: #2b2116;
```

to:

```css
--color-surface: var(--tenant-surface);
```

Components are unaffected — they already consume `bg-surface`, `text-ink`, etc. as
Tailwind utilities, never the custom properties directly, so the indirection is invisible
to every block built so far.

### The two ramps stay in the same warm-neutral family

Dark ramp = today's unchanged values (`#2b2116` surface … `#f3eadb` ink). Light ramp
(`#f7f5f2` surface … `#1c1a17` ink) mirrors the same elevation relationship — page
background darker/more muted than card surfaces, surfaces lighter than the page — rather
than inventing an unrelated palette. This keeps a tenant that switches modes later a
color-token change, not a redesign.

## Consequences

- `landing_pages` gains `theme_mode` (migration `20260805000002_add_theme_mode.sql`);
  `LandingPageConfig` gains `themeMode: 'dark' | 'light'`.
- `globals.css`'s "KNOWN GAP" comment is removed — the gap it flagged is closed.
- A tenant that wants a third visual mode (e.g. a specific brand-matched neutral ramp,
  not just light/dark) is out of scope until a real tenant needs it — same "curated set,
  extend on demand" posture as `lib/fonts.ts`.
- Verification must include both a dark and a light tenant rendering side by side, on
  both `next dev` and `wrangler dev` (CLAUDE.md §12) — a regression here is invisible on
  a dark-only test pass.
