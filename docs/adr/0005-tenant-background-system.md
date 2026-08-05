# 5. Tenant background system: page-level + per-block override

Date: 2026-08-04 (v2: 2026-08-04 — Vue/Strapi → React/Supabase JSONB, see ADR-0007; the
`Background` shape and resolution rules are unchanged)
Status: Accepted

## Context

Landing pages had no background customization at any layer: `LandingPageConfig` and
every block interface carried only `primaryColor`/`secondaryColor`/`fontFamily`. Every
block hardcoded its own background (`bg-white`, `bg-white/90`, `bg-gray-900`), and the
one precedent for a per-tenant visual effect — `HeroBlock`'s `variant: 'default' |
'ember'` — hardcoded literal hex colors for its particle canvas instead of using
`--tenant-*` vars, a direct violation of ADR-0002 rule 4.

Forge Company's own landing page (the reference: `forge_company_apresentacao-sem-precos.html`)
needed a dark textured page background, a semi-transparent "glass" header, a hero with a
particle effect, and a `.seam` divider between sections — none of which the system could
express for any tenant, not just Forge Company.

## Decision

### One `Background` shape, two places it's read from

```ts
export type BackgroundType = 'transparent' | 'solid' | 'gradient' | 'image' | 'fine-line-texture' | 'glass'
export type BackgroundColorToken = 'primary' | 'secondary' | 'custom'

export interface Background {
  type?: BackgroundType
  colorToken?: BackgroundColorToken
  customColor?: string
  gradientToToken?: BackgroundColorToken
  gradientToCustom?: string
  image?: { url: string; alternativeText?: string }
  effect?: 'none' | 'particles'
}
```

- **Page level**: `LandingPageConfig.background`, sourced from `landing_pages` columns
  (`background_type`, `background_color_token`, `background_color_custom`,
  `background_gradient_to_token`, `background_gradient_to_custom`,
  `background_image_url`) — the same table `primary_color`/`secondary_color` already
  live in. The tenant middleware assembles the nested object after the query returns,
  since PostgREST can't alias flat columns into nested JSON in a `select()` string.
- **Block level**: an optional `background` field (same shape, part of each block's Zod
  schema) on the `header`, `hero`, `differentials` block types, stored inline in the
  `landing_pages.blocks` JSONB array. Absent, or `type: 'transparent'`, means "show
  whatever's behind it" — the page background for an in-flow block, or literally
  whatever content is currently scrolled under a sticky Header.

`type` is a **superset** covering two related but separate questions raised during
review: content fill (`solid | gradient | image | fine-line-texture`) and surface
treatment for stacked/sticky elements (`transparent | glass`). They're folded into one
enum rather than two fields because both answer "what does this block's own background
look like," and splitting them would let a block declare contradictory states (e.g.
`type: 'image'` + `surface: 'transparent'`).

Colors are **token-constrained**: `primary | secondary | custom`, nudging editors toward
brand-consistent choices (continuing ADR-0002 rule 4) while `custom` stays available as
an escape hatch for colors that aren't part of the two-color brand system (Forge
Company's near-black `#141009` is neither its primary nor secondary — it's `custom`).

### The particle effect is a background property, not a layout variant

`HeroVariant` is now purely layout (`'default' | 'centered'`); the old `'ember'` value
is retired. The particle effect lives on `Background.effect: 'none' | 'particles'` and
is rendered by a reusable `<BackgroundParticles>` client component
(`components/blocks/shared/`) — any block with a background could opt in, not just
Hero. This also fixes the ADR-0002 violation: particle hues now resolve from the
tenant's actual `--tenant-primary`/`--tenant-secondary` computed values (read via
`getComputedStyle`, since Canvas 2D can't resolve a CSS custom property string) instead
of literal hex.

### Resolution is one shared function

`resolveBackground(bg)` (`lib/background.ts`) maps a `Background` to a `{ style,
className }` pair for React's `style`/`className` props — used identically by every
block component and by the root layout for the page-level `body` rule. Runtime values
(custom hex, resolved gradients, image URLs) can't go through Tailwind's static utility
classes, so background rendering uses inline styles, the same way `--tenant-primary`
already flows through a runtime-injected `<style>` tag. `glass` and `fine-line-texture`
use `color-mix(in srgb, <color> X%, transparent)` rather than hex/rgba math in JS.

### Sticky Header keeps a component-level default, not the shape's default

Every other block's "no background config" means `type: 'transparent'`. Header is the
one exception: as a `sticky` element, showing nothing would make it illegible over
scrolling content, so the Header component falls back to `{ type: 'glass', colorToken:
'custom', customColor: '#ffffff' }` when `background` is unset — reproducing today's
`bg-white/90 backdrop-blur` look exactly, so existing/undecorated tenants are
unaffected.

### Deferred: per-block-directory split (ADR-0002 consequence)

ADR-0002 anticipated that a block with more than one layout would move into a
directory (`blocks/hero/HeroDefault.tsx`, `HeroCentered.tsx`, …) with a two-level
`blockComponentMap`. Header and Hero now both have two variants (`default`/`centered`)
and still use a single file with internal branching — the same shortcut the original
`ember` variant already used. This is accepted deliberately for the same reason as
before: the split earns its keep at a *third* layout, not a second. Revisit when any
block needs one.

## Consequences

- New Supabase migration adding the `background_*` columns to `landing_pages`;
  `lib/types/blocks.ts` gains `shared.ts`-equivalent exports (`Background` and friends)
  shared by every block's Zod schema.
- Supabase Studio edits `customColor`/`gradientToCustom` as plain hex text (no dedicated
  color-picker widget in the MVP's JSON editor — acceptable since the sole editor is
  technical; revisit if a non-technical admin UI is ever built, per
  `MVP_REWRITE_CONTEXT.md` §2).
- Footer's hardcoded `bg-gray-900` (no tenant vars at all) is a known, separate gap —
  deliberately out of scope here, left for a fast-follow.
