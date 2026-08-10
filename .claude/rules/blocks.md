# forge-pages — Block Types

> Detail split out of `.claude/CLAUDE.md` §6 (Fase 3) to keep that file under its
> 200-line budget. Read this before adding, editing, or rendering a block type.

Blocks live in `landing_pages.blocks` (JSONB array). Each block type has a TypeScript
interface in `lib/types/blocks.ts` and a matching Zod schema in `lib/schemas/blocks.ts`.
An unrecognized `variant` falls back to `default` (ADR-0002); a failed schema on the
whole page fails loudly in the Server Component rather than rendering silently broken.

**`anchorId?: string`** (ADR-0008) is the block's fragment target for in-page nav. It is
data, never a literal in a component — the same block type can appear more than once per
page and each occurrence needs its own anchor. Every in-flow block type carries it:
`hero`, `value-proposition`, `differentials`, `pricing`, `cta-form` (ADR-0008), and
`trust-icons`, `stats`, `services`, `testimonials` (ADR-0008's deferred half, added
Fase 3).

**All eleven types have components.** Zod validates all eleven; `BlockRenderer` maps
every one. A valid but unmapped type still renders nothing rather than breaking the
page — that fallback stays in place for any future block type added ahead of its
component.

| Block `type`        | Key fields                                                                                          |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| `header`             | variant (`default`\|`centered`), background, logo, menuLinks[], ctaLabel, ctaWhatsapp, ctaMessage    |
| `hero`               | variant (`default`\|`centered`), background, badgeText, headline, subheadline, ctaPrimaryLabel/Link, ctaSecondaryLabel/Link, image, imageAlt |
| `trust-icons`        | items[]: { icon, text }                                                                                |
| `stats`              | items[]: { number, label }                                                                             |
| `value-proposition`  | headline, text, cards[]: { icon, title, description }                                                  |
| `services`           | variant (`default`\|`image-left`), headline, tabs[]: { label, title, text, ctaLabel, ctaLink, image } — the one block with client-side state (tab switching, `components/blocks/shared/ServiceTabs.tsx`). When a tab's `image` is absent the grid collapses to one column regardless of `variant`. |
| `differentials`      | background, headline, text, items[]: { icon, tag, text }                                               |
| `testimonials`       | headline, items[]: { name, role, photo, text, rating }                                                 |
| `cta-form`           | headline, subheadline, selectOptions[]: { label, value }, ctaLabel, whatsappNumber, whatsappMessage    |
| `footer`             | logo, description, links[], phones[], schedule, socialLinks[], copyright, privacyLink                  |
| `pricing`            | headline, subheadline, plans[], note                                                                    |

**`Background`** shape (ADR-0005): `type` (`transparent`\|`solid`\|`gradient`\|`image`\|`fine-line-texture`\|`glass`, default `transparent`), `colorToken` (`primary`\|`secondary`\|`custom`), `customColor`/`gradientToCustom`, `gradientToToken`, `image`, `effect` (`none`\|`particles`). Absent/`transparent` shows whatever's behind the block. `lib/background.ts`'s `resolveBackground()` is the single place this shape turns into CSS.

**Neutral theming** (ADR-0010): `landing_pages.theme_mode` (`'dark'`\|`'light'`, default
`'dark'`) selects one of two fixed neutral ramps via `lib/theme.ts`'s
`resolveNeutralTheme()`, merged into the same `--tenant-*` custom properties
`app/layout.tsx` already sets per request. Components never see `theme_mode` — they
consume `bg-surface`/`text-ink`/etc. Tailwind utilities, which resolve through the ramp
transparently.
