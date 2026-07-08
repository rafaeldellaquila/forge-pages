# Phase 4 — Frontend (Nuxt 3)

> **Before starting**: Read `CLAUDE.md` in full. Phases 1–3 must be complete.
> **Commit strategy**: Ask before every commit. Use Conventional Commits.
> **Scope**: `apps/web` and `packages/ui`. No Strapi changes in this phase.

---

## Objective

Build the Nuxt 3 multi-tenant frontend. By the end of this phase: a visitor hitting any configured domain sees the correct landing page rendered from Strapi blocks. The lead form captures, validates, sanitizes, and submits leads to Supabase. Storybook shows all blocks in isolation. TypeScript strict passes.

---

## Prerequisites

1. Phases 1–3 complete and validated
2. Strapi running locally at `http://localhost:1337`
3. Supabase project accessible
4. `STRAPI_API_TOKEN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` available in environment

---

## Tasks — execute in this exact order

### 1. Initialize Nuxt 3 in apps/web

Ask for confirmation, then from the repo root:

```bash
pnpm dlx nuxi@latest init apps/web \
  --package-manager pnpm \
  --no-install \
  --typescript
```

Update `apps/web/package.json` to add workspace dependencies:

```json
{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "typecheck": "nuxt typecheck"
  },
  "dependencies": {
    "@forge-pages/types": "workspace:*",
    "@forge-pages/ui": "workspace:*"
  },
  "devDependencies": {
    "@nuxt/devtools": "latest",
    "@nuxtjs/tailwindcss": "^6.12.0",
    "@nuxtjs/sentry": "^8.0.0",
    "nuxt": "^3.13.0",
    "nuxt-security": "^2.0.0",
    "vue": "^3.5.0",
    "vue-router": "^4.4.0"
  }
}
```

Ask for confirmation, then: `pnpm install`

---

### 2. Nuxt config

Create `apps/web/nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-security',
    '@nuxtjs/sentry',
  ],

  // Multi-tenant ISR: cache each tenant page for 1 hour
  routeRules: {
    '/**': { isr: 3600 },
  },

  // Tailwind v4 — point to shared config
  tailwindcss: {
    cssPath: '../../packages/config/tailwind.css',
  },

  // Security headers
  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com'],
        'frame-src': ["'self'", 'https://challenges.cloudflare.com'],
        'img-src': ["'self'", 'data:', '*.supabase.co'],
        'connect-src': ["'self'", 'https://app.posthog.com', process.env.SUPABASE_URL ?? ''],
      },
      xFrameOptions: 'DENY',
      xContentTypeOptions: 'nosniff',
      referrerPolicy: 'strict-origin-when-cross-origin',
    },
    rateLimiter: false, // handled by Upstash in server routes
  },

  // Sentry
  sentry: {
    dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
  },

  // Runtime config — public keys only (never secrets)
  runtimeConfig: {
    // Private (server-side only)
    strapiUrl: process.env.STRAPI_URL,
    strapiApiToken: process.env.STRAPI_API_TOKEN,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY,
    upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY,
    // Public (exposed to client)
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY,
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
      posthogKey: process.env.NUXT_PUBLIC_POSTHOG_KEY,
      posthogHost: process.env.NUXT_PUBLIC_POSTHOG_HOST,
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },
})
```

---

### 3. TypeScript config for apps/web

Create `apps/web/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "paths": {
      "@forge-pages/types": ["../../packages/types/src/index.ts"],
      "@forge-pages/ui": ["../../packages/ui/src/index.ts"]
    }
  },
  "include": [
    ".nuxt/nuxt.d.ts",
    "**/*.ts",
    "**/*.vue"
  ]
}
```

---

### 4. Multi-tenant server middleware

Create `apps/web/server/middleware/tenant.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import type { LandingPageConfig } from '@forge-pages/types'

declare module 'h3' {
  interface H3EventContext {
    tenant: LandingPageConfig | null
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const host = getHeader(event, 'host') ?? ''

  // Strip port for local development
  const domain = host.replace(/:\d+$/, '')

  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
  )

  const { data } = await supabase
    .from('landing_pages')
    .select(`
      id,
      client_id,
      domain,
      render_mode,
      status,
      seo_title,
      seo_description,
      seo_og_image,
      canonical_url,
      primary_color,
      secondary_color,
      font_family
    `)
    .eq('domain', domain)
    .eq('status', 'published')
    .single()

  event.context.tenant = data as LandingPageConfig | null
})
```

---

### 5. Main landing page route

Create `apps/web/pages/index.vue`:

```vue
<script setup lang="ts">
import type { BlockType } from '@forge-pages/types'

const event = useRequestEvent()
const tenant = event?.context.tenant

// 404 if no tenant found for this domain
if (!tenant) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}

// Fetch blocks from Strapi
const config = useRuntimeConfig()
const { data: page } = await useFetch<{ data: { attributes: { blocks: BlockType[] } } }>(
  `${config.strapiUrl}/api/landing-pages`,
  {
    query: {
      filters: { domain: { $eq: tenant.domain } },
      populate: { blocks: { populate: '*' } },
    },
    headers: {
      Authorization: `Bearer ${config.strapiApiToken}`,
    },
  },
)

const blocks = page.value?.data?.[0]?.attributes?.blocks ?? []

// Apply tenant theme as CSS variables
useHead({
  title: tenant.seoTitle ?? undefined,
  meta: [
    { name: 'description', content: tenant.seoDescription ?? undefined },
    { property: 'og:image', content: tenant.seoOgImage ?? undefined },
  ],
  style: [
    {
      innerHTML: `:root {
        --tenant-primary: ${tenant.primaryColor ?? '#065a82'};
        --tenant-secondary: ${tenant.secondaryColor ?? '#1c7293'};
        --tenant-font: '${tenant.fontFamily ?? 'Inter'}';
      }`,
    },
  ],
})
</script>

<template>
  <main>
    <template v-for="block in blocks" :key="block.__component + block.id">
      <component
        :is="blockComponentMap[block.__component]"
        v-if="blockComponentMap[block.__component]"
        v-bind="block"
      />
    </template>
  </main>
</template>
```

Create `apps/web/utils/blockComponentMap.ts`:
```ts
import HeaderBlock from '@forge-pages/ui/blocks/HeaderBlock.vue'
import HeroBlock from '@forge-pages/ui/blocks/HeroBlock.vue'
import TrustIconsBlock from '@forge-pages/ui/blocks/TrustIconsBlock.vue'
import StatsBlock from '@forge-pages/ui/blocks/StatsBlock.vue'
import ValuePropositionBlock from '@forge-pages/ui/blocks/ValuePropositionBlock.vue'
import ServicesBlock from '@forge-pages/ui/blocks/ServicesBlock.vue'
import DifferentialsBlock from '@forge-pages/ui/blocks/DifferentialsBlock.vue'
import TestimonialsBlock from '@forge-pages/ui/blocks/TestimonialsBlock.vue'
import CtaFormBlock from '@forge-pages/ui/blocks/CtaFormBlock.vue'
import FooterBlock from '@forge-pages/ui/blocks/FooterBlock.vue'

export const blockComponentMap: Record<string, unknown> = {
  'blocks.header': HeaderBlock,
  'blocks.hero': HeroBlock,
  'blocks.trust-icons': TrustIconsBlock,
  'blocks.stats': StatsBlock,
  'blocks.value-proposition': ValuePropositionBlock,
  'blocks.services': ServicesBlock,
  'blocks.differentials': DifferentialsBlock,
  'blocks.testimonials': TestimonialsBlock,
  'blocks.cta-form': CtaFormBlock,
  'blocks.footer': FooterBlock,
}
```

---

### 6. packages/ui — initialize

Create `packages/ui/package.json`:
```json
{
  "name": "@forge-pages/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build:storybook": "storybook build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@forge-pages/types": "workspace:*",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@storybook/vue3": "^8.3.0",
    "@storybook/vue3-vite": "^8.3.0",
    "@storybook/addon-essentials": "^8.3.0",
    "typescript": "workspace:*",
    "vite": "^5.4.0"
  }
}
```

Create `packages/ui/src/index.ts`:
```ts
// Block components
export { default as HeaderBlock } from './blocks/HeaderBlock.vue'
export { default as HeroBlock } from './blocks/HeroBlock.vue'
export { default as TrustIconsBlock } from './blocks/TrustIconsBlock.vue'
export { default as StatsBlock } from './blocks/StatsBlock.vue'
export { default as ValuePropositionBlock } from './blocks/ValuePropositionBlock.vue'
export { default as ServicesBlock } from './blocks/ServicesBlock.vue'
export { default as DifferentialsBlock } from './blocks/DifferentialsBlock.vue'
export { default as TestimonialsBlock } from './blocks/TestimonialsBlock.vue'
export { default as CtaFormBlock } from './blocks/CtaFormBlock.vue'
export { default as FooterBlock } from './blocks/FooterBlock.vue'
```

---

### 7. Block components in packages/ui

Create all 10 blocks as Vue SFCs in `packages/ui/src/blocks/`.

**Reference implementation — HeroBlock.vue** (use this as the canonical template for all blocks):

```vue
<script setup lang="ts">
import type { HeroBlock } from '@forge-pages/types'

const props = defineProps<HeroBlock>()
</script>

<template>
  <section class="relative min-h-[80vh] flex items-center bg-white">
    <div class="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
      <!-- Text content -->
      <div>
        <span
          v-if="props.badgeText"
          class="inline-block mb-4 px-4 py-1 rounded-full text-sm font-semibold bg-[var(--tenant-primary)] text-white"
        >
          {{ props.badgeText }}
        </span>
        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          {{ props.headline }}
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          {{ props.subheadline }}
        </p>
        <div class="flex flex-wrap gap-4">
          <a
            :href="props.ctaPrimaryLink"
            class="px-8 py-4 rounded-lg font-semibold text-white bg-[var(--tenant-primary)] hover:opacity-90 transition-opacity"
          >
            {{ props.ctaPrimaryLabel }}
          </a>
          <a
            v-if="props.ctaSecondaryLabel && props.ctaSecondaryLink"
            :href="props.ctaSecondaryLink"
            class="px-8 py-4 rounded-lg font-semibold border-2 border-[var(--tenant-primary)] text-[var(--tenant-primary)] hover:bg-gray-50 transition-colors"
          >
            {{ props.ctaSecondaryLabel }}
          </a>
        </div>
      </div>
      <!-- Image -->
      <div v-if="props.image">
        <img
          :src="props.image.url"
          :alt="props.imageAlt ?? props.image.alternativeText ?? ''"
          class="w-full h-auto rounded-xl shadow-2xl"
          loading="eager"
        />
      </div>
    </div>
  </section>
</template>
```

Create all remaining 9 block components following the same pattern:
- Each receives typed props via `defineProps<BlockType>()`
- Uses Tailwind classes only (no inline styles except CSS variables for theme)
- Uses `var(--tenant-primary)` and `var(--tenant-secondary)` for brand colors
- Handles all optional fields with `v-if`

---

### 8. Lead form server route (with security)

Create `apps/web/server/api/leads.post.ts`:

```ts
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'
import sanitizeHtml from 'sanitize-html'
import type { LeadInput } from '@forge-pages/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const tenant = event.context.tenant

  if (!tenant) {
    throw createError({ statusCode: 404, message: 'Tenant not found' })
  }

  // 1. Parse body
  const body = await readBody<LeadInput>(event)

  // 2. Sanitize all string fields — strip ALL HTML tags
  const sanitize = (value: string | undefined): string | undefined =>
    value ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }) : undefined

  const sanitized = {
    name: sanitize(body.name) ?? '',
    whatsapp: sanitize(body.whatsapp) ?? '',
    email: sanitize(body.email),
    message: sanitize(body.message),
    intent: sanitize(body.intent),
  }

  // 3. Basic validation
  if (!sanitized.name || !sanitized.whatsapp) {
    throw createError({ statusCode: 400, message: 'name and whatsapp are required' })
  }

  // 4. Turnstile verification
  const turnstileRes = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: config.turnstileSecretKey,
        response: body.turnstileToken ?? '',
      }),
    },
  )
  const turnstileData = await turnstileRes.json() as { success: boolean }
  if (!turnstileData.success) {
    throw createError({ statusCode: 400, message: 'Bot verification failed' })
  }

  // 5. Rate limit via Upstash Redis (3 per IP per hour)
  const redis = new Redis({
    url: config.upstashRedisRestUrl,
    token: config.upstashRedisRestToken,
  })

  const ip = getRequestIP(event) ?? 'unknown'
  const rateLimitKey = `lead:${tenant.id}:${ip}`
  const count = await redis.incr(rateLimitKey)

  if (count === 1) {
    await redis.expire(rateLimitKey, 3600)
  }

  if (count > 3) {
    throw createError({ statusCode: 429, message: 'Too many requests' })
  }

  // 6. Insert lead (Supabase webhook fires automatically)
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseServiceRoleKey,
  )

  const { data, error } = await supabase
    .from('leads')
    .insert({
      landing_page_id: tenant.id,
      name: sanitized.name,
      whatsapp: sanitized.whatsapp,
      email: sanitized.email ?? null,
      message: sanitized.message ?? null,
      intent: sanitized.intent ?? null,
      utm_source: sanitize(body.utmSource) ?? null,
      utm_medium: sanitize(body.utmMedium) ?? null,
      utm_campaign: sanitize(body.utmCampaign) ?? null,
    })
    .select('id')
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to save lead' })
  }

  return { ok: true, leadId: data.id }
})
```

Install required packages (ask first):
```bash
pnpm --filter web add sanitize-html @upstash/redis @supabase/supabase-js
pnpm --filter web add -D @types/sanitize-html
```

---

### 9. Health check endpoint

Create `apps/web/server/api/health.get.ts`:
```ts
export default defineEventHandler(async () => {
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    service: 'forge-pages-web',
  }
})
```

---

### 10. Storybook setup in packages/ui

Create `packages/ui/.storybook/main.ts`:
```ts
import type { StorybookConfig } from '@storybook/vue3-vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
}

export default config
```

Create `packages/ui/.storybook/preview.ts`:
```ts
import type { Preview } from '@storybook/vue3'
import '../../config/tailwind.css'

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#f4f8fb' },
        { name: 'dark', value: '#0a1628' },
      ],
    },
  },
  decorators: [
    (story) => ({
      components: { story },
      template: `
        <div style="--tenant-primary: #065a82; --tenant-secondary: #1c7293; --tenant-font: Inter">
          <story />
        </div>
      `,
    }),
  ],
}

export default preview
```

---

### 11. Stories for each block

Create one story per block in `packages/ui/src/blocks/`.
**Reference — HeroBlock.stories.ts**:

```ts
import type { Meta, StoryObj } from '@storybook/vue3'
import HeroBlock from './HeroBlock.vue'

const meta: Meta<typeof HeroBlock> = {
  title: 'Blocks/Hero',
  component: HeroBlock,
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    __component: 'blocks.hero',
    headline: 'Sua moto nova está aqui',
    subheadline: 'Mais de 30 anos de experiência no mercado de motos',
    ctaPrimaryLabel: 'Ver catálogo',
    ctaPrimaryLink: '#servicos',
    ctaSecondaryLabel: 'Saiba mais',
    ctaSecondaryLink: '#sobre',
    badgeText: '+30 anos de mercado',
  },
}

export const WithImage: Story = {
  args: {
    ...Default.args,
    image: {
      url: 'https://placehold.co/600x400',
      alternativeText: 'Moto exemplo',
    },
  },
}

export const WithoutBadge: Story = {
  args: {
    ...Default.args,
    badgeText: undefined,
  },
}
```

Create stories for all 10 blocks following the same pattern.

---

## Validation checklist before closing Phase 4

- [ ] `mise run dev:web` starts without errors on port 3000
- [ ] Visiting `localhost:3000` resolves the seed tenant (set up in Phase 2 seed)
- [ ] Blocks from Strapi render on the page
- [ ] CSS variables from tenant theme apply (primary/secondary colors)
- [ ] SEO meta tags in `<head>` match tenant config
- [ ] Lead form submits successfully:
  - Turnstile fires (in dev, use test key `1x00000000000000000000AA`)
  - Rate limit applies after 3 submissions
  - HTML injection in `name` field is stripped
  - Lead appears in Supabase dashboard
- [ ] Health endpoint responds: `curl localhost:3000/api/health`
- [ ] `mise run storybook` opens Storybook with all 10 blocks
- [ ] Each block has at least 2 story variants
- [ ] `mise run typecheck` passes for `apps/web` and `packages/ui`
- [ ] `mise run lint` passes with no errors

---

## Commit at the end of Phase 4

Ask for confirmation:
```bash
git add apps/web/ packages/ui/
git commit -m "feat(frontend): Nuxt 3 multi-tenant frontend with block rendering

- Multi-tenant middleware resolving tenant by Host header
- ISR cache (1h) with CSS variable theme injection per tenant
- 10 block Vue components in packages/ui (all typed via packages/types)
- Lead form: sanitize-html, Turnstile verification, Upstash rate limit (3/IP/hour)
- Supabase insert triggers Edge Function webhook automatically
- Health check endpoint /api/health
- Storybook with stories for all 10 blocks
- nuxt-security module with CSP and security headers"

git push origin main
```

---

## Update CLAUDE.md

Mark Phase 4 as complete in section 14.

---

## Next step

```
docs/prompts/PHASE_5_INTEGRATIONS.md
```
