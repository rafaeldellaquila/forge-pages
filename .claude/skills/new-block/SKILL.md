# Skill: New Block

Use this skill when asked to create a new landing page block.
Before starting, read this file in full.

---

## What "a block" means in this project

A block is a reusable landing page section. It lives in 4 places simultaneously:

| File | Purpose |
|---|---|
| `packages/types/src/blocks/<name>.ts` | TypeScript interface — the contract |
| `packages/ui/src/blocks/<Name>Block.vue` | Vue component — the UI |
| `packages/ui/src/blocks/<Name>Block.stories.ts` | Storybook story — isolated preview |
| Strapi Content-Type Builder | CMS schema — how content editors fill it |

All 4 must exist for the block to be complete. Never create one without the others.

---

## Step 1 — Define the TypeScript interface FIRST

File: `packages/types/src/blocks/<camelCaseName>.ts`

Rules:
- `__component` must match the Strapi component UID exactly: `'blocks.<kebab-name>'`
- All optional fields use `?` — never `| undefined` on required fields
- Nested repeatable items get their own named interface
- Media fields use `{ url: string; alternativeText?: string }` shape

Example:
```ts
// packages/types/src/blocks/stats.ts

export interface StatItem {
  number: string   // string, not number — allows "+500", "98%", "30+"
  label: string
}

export interface StatsBlock {
  __component: 'blocks.stats'
  items: StatItem[]
}
```

After creating the interface:
1. Export it from `packages/types/src/blocks/index.ts`
2. Add it to the `BlockType` union in `packages/types/src/blocks/block-type.ts`

Run `mise run typecheck` — must pass before moving to Step 2.

---

## Step 2 — Vue component

File: `packages/ui/src/blocks/<PascalName>Block.vue`

**Canonical template** — always use HeroBlock.vue as the reference:

```vue
<script setup lang="ts">
import type { StatsBlock } from '@forge-pages/types'

const props = defineProps<StatsBlock>()
</script>

<template>
  <section class="py-16 bg-white">
    <div class="container mx-auto px-4">
      <!-- implementation here -->
    </div>
  </section>
</template>
```

Rules:
- `<script setup lang="ts">` always
- `defineProps<BlockInterface>()` — typed directly from `packages/types`
- Tailwind classes only — no `<style>` blocks, no inline style objects
- Brand colors: `var(--tenant-primary)` and `var(--tenant-secondary)` (injected by Nuxt middleware)
- Optional fields wrapped in `v-if`
- Images: always include `loading="lazy"` (except Hero which uses `loading="eager"`)
- No `console.log` anywhere

After creating:
1. Export from `packages/ui/src/index.ts`
2. Register in `apps/web/utils/blockComponentMap.ts` with the Strapi UID as key

---

## Step 3 — Storybook story

File: `packages/ui/src/blocks/<PascalName>Block.stories.ts`

Minimum 2 stories: `Default` and one variant (e.g. with/without optional field).

```ts
import type { Meta, StoryObj } from '@storybook/vue3'
import StatsBlock from './StatsBlock.vue'

const meta: Meta<typeof StatsBlock> = {
  title: 'Blocks/Stats',
  component: StatsBlock,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.stats',
    items: [
      { number: '+500', label: 'clientes atendidos' },
      { number: '30+', label: 'anos de mercado' },
      { number: '98%', label: 'satisfação' },
    ],
  },
}

export const TwoItems: Story = {
  args: {
    __component: 'blocks.stats',
    items: [
      { number: '+200', label: 'projetos entregues' },
      { number: '5★', label: 'avaliação média' },
    ],
  },
}
```

---

## Step 4 — Strapi schema (provide instructions, don't execute)

Print the JSON schema for the Strapi content type so the user can add it manually in the Strapi Content-Type Builder, or paste it into `apps/cms/src/components/blocks/<name>.json`.

Match exactly the field names from the TypeScript interface (snake_case in Strapi, camelCase in TS — Strapi API returns camelCase automatically).

```json
{
  "collectionName": "components_blocks_stats",
  "info": {
    "displayName": "Stats",
    "icon": "chart-bar",
    "description": "Row of key statistics/numbers"
  },
  "attributes": {
    "items": {
      "type": "component",
      "repeatable": true,
      "component": "shared.stat-item",
      "min": 1,
      "max": 6
    }
  }
}
```

If the block has nested repeatable items, also provide the shared sub-component schema.

---

## Checklist before marking block as done

- [ ] TypeScript interface created in `packages/types/src/blocks/<name>.ts`
- [ ] Exported from `packages/types/src/blocks/index.ts`
- [ ] Added to `BlockType` union in `packages/types/src/blocks/block-type.ts`
- [ ] Vue component uses `defineProps<BlockInterface>()` — no loose types
- [ ] Vue component exported from `packages/ui/src/index.ts`
- [ ] Registered in `apps/web/utils/blockComponentMap.ts`
- [ ] Storybook story has at least 2 variants
- [ ] Strapi JSON schema provided / added to `apps/cms/src/components/blocks/`
- [ ] `mise run typecheck` passes
- [ ] `mise run lint` passes
- [ ] `mise run storybook` shows the new block

---

## Common mistakes to avoid

- Using `any` in props — always type from `packages/types`
- Creating Strapi schema before the TS interface — interface is the source of truth
- Forgetting to register in `blockComponentMap.ts` — block renders nothing silently
- Using hardcoded colors instead of `var(--tenant-primary)` — breaks theming
- Skipping the story — it's required for design review
