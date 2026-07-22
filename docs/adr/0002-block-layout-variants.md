# 2. Block layout variants as a property, and the Figma naming contract

Date: 2026-07-21
Status: Accepted

## Context

Every block type currently renders exactly one layout: `__component` maps 1:1 to a Vue
component in `blockComponentMap`. Selling landing pages to many clients requires offering
several layouts for the same block — a Hero with the image on the right, a centered Hero,
a full-bleed Hero — without changing what a Hero *is*.

Layouts will be designed in Figma and translated to code. That translation is the part
that decides whether this scales: without a fixed contract between the two, every new
layout is an interpretation, and the result varies run to run.

Two forces shape the decision:

1. **Multi-tenant theming.** Brand colors are per-client CSS custom properties
   (`--tenant-primary`, `--tenant-secondary`, `--tenant-font`), injected per request from
   `landing_pages`. Nothing brand-colored may be hardcoded.
2. **Content and code deploy independently.** Strapi content is edited by non-technical
   partners; a variant can be selected in the CMS before the code that renders it exists.

## Decision

### 1. A layout variant is a property of a block, not a new block type

Each block keeps **one** data contract and gains an optional `variant` field. Variants are
purely presentational: same fields in, different arrangement out.

```ts
export type HeroVariant = 'default' | 'centered' | 'full-bleed'

export interface HeroBlock {
  __component: 'blocks.hero'
  variant?: HeroVariant
  headline: string
  // …unchanged
}
```

Rejected alternative: one Strapi component per layout (`blocks.hero-centered`). It makes
switching layouts destroy the editor's content, turns `BlockType` into a union of near
duplicate interfaces, and multiplies the Strapi schema by the number of layouts.

**When to break this rule**: if a layout needs a field the others cannot use (a Hero with
video needs `videoUrl`), and that field does not fit as an optional addition to the shared
contract, it is a new block — not a variant. For a layout built for exactly one client,
use the escape hatch that already exists: `render_mode: 'custom'`.

### 2. `default` is reserved and is the fallback

Every block's current layout becomes `default`. The field is optional, so **existing
content needs no migration** — absent means `default`.

Resolution must fall back rather than fail: an unknown variant (content published ahead of
the deploy that renders it) falls back to `default`. A missing block renders nothing, as
today; a missing *variant* must never blank out a section that has content.

### 3. The Figma naming contract

These rules exist so translation is mechanical. They are the actual interface between
design and code, and they are binding in both directions.

| # | Rule |
|---|------|
| 1 | Component Set name = the block UID suffix in PascalCase — `blocks.hero` → `Hero`, `blocks.cta-form` → `CtaForm` |
| 2 | Variant property is named `variant`; its values are kebab-case and match the TS union member for member, `default` included |
| 3 | Layer name = prop name, character for character, camelCase — `headline`, `ctaPrimaryLabel`, `badgeText`. Not `Título`, not `H1` |

Composite fields:

| Concept | Figma | Code |
|---|---|---|
| Optional field | layer `badgeText` + boolean property `hasBadge` | `badgeText?: string` |
| Image | layer `image` | `image?: { url, alternativeText }` |
| Repeatable list | frame `items` holding instances named `item` | `items[]` |
| Field within a list item | layers `icon`, `text` inside `item` | `items[].icon`, `items[].text` |

The `items`/`item` pair is what marks a list unambiguously; repeating the instance in the
frame shows it is repeatable without relying on the reader to infer it.

### 4. Brand color and typography bind to Figma Variables, never to literals

Figma Variables mirror the CSS custom properties by name:

```
tenant/primary    → var(--tenant-primary)
tenant/secondary  → var(--tenant-secondary)
tenant/font       → var(--tenant-font)
```

Every brand-colored fill, stroke and text style binds to one of these. Neutrals (body
gray, borders, shadows) may be literal — they do not vary per tenant today.

This is the highest-risk rule in the document: a hardcoded hex produces a page that looks
correct for the client it was designed for and silently wrong for the next one. It fails
no test and throws no error.

### 5. Code Connect is an optional reinforcement, gated by the Figma plan

Code Connect maps each Component Set to its Vue component and its properties to props, so
the design reads as "this component already exists, called this way" instead of being
reconstructed from pixels. It requires a Figma Dev/Full seat on an Organization or
Enterprise plan — unavailable on the current Starter plan, including over the MCP.

While the plan is Starter, the naming contract (rules 1–3) is the operative translation
mechanism: it already makes the Figma→Vue mapping mechanical on its own. When a paid seat
exists, add a `.figma.ts` per Component Set and publish it as reinforcement — it is not a
prerequisite for designing variants.

## Consequences

- `packages/types`: each block interface gains `variant?: <Block>Variant` and exports the
  union. Additive and optional — no existing consumer breaks.
- `apps/cms`: each block schema gains an `enumeration` attribute `variant`, surfaced to
  editors as a dropdown. This alters component tables in Postgres.
- `packages/ui`: blocks with more than one layout move into a per-block directory
  (`blocks/hero/HeroDefault.vue`, `HeroCentered.vue`, …). Blocks with a single layout stay
  flat until they gain a second — the directory is created when it earns its keep.
- `apps/web`: `blockComponentMap` becomes a two-level lookup keyed by UID then variant,
  with the `default` fallback in rule 2.
- Storybook gains one story per variant and becomes the review surface for comparing a
  built variant against its Figma frame.
- Adding a layout after this is: Figma variant → Vue file → TS union member → Strapi enum
  value (+ a `.figma.ts` entry once Code Connect is available). Mechanical steps, no
  schema redesign.
- Figma Variables must exist before the first variant is designed, otherwise rule 4 has
  nothing to bind to.
