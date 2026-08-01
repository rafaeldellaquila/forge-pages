<script setup lang="ts">
import type { LandingPageConfig } from '@forge-pages/types'
import { blockComponentMap } from '~/utils/blockComponentMap'

// Tenant is resolved in server/middleware/tenant.ts; useState transfers it to the client.
const tenant = useState<LandingPageConfig | null>(
  'tenant',
  () => useRequestEvent()?.context.tenant ?? null,
)

if (!tenant.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const { data } = await useFetch('/api/blocks', { key: 'landing-page-blocks' })
const blocks = computed(() => data.value?.blocks ?? [])

const config = useRuntimeConfig()
const { trackFormView, trackFormSubmit, trackFormSuccess, trackFormError } = useTracking()

const theme = tenant.value
useHead({
  title: theme.seoTitle ?? undefined,
  meta: [
    { name: 'description', content: theme.seoDescription ?? '' },
    { property: 'og:title', content: theme.seoTitle ?? '' },
    { property: 'og:image', content: theme.seoOgImage ?? '' },
  ],
  link: theme.canonicalUrl ? [{ rel: 'canonical', href: theme.canonicalUrl }] : [],
  style: [
    {
      innerHTML: `:root {
        --tenant-primary: ${theme.primaryColor ?? '#065a82'};
        --tenant-secondary: ${theme.secondaryColor ?? '#1c7293'};
        --tenant-font: '${theme.fontFamily ?? 'Inter'}';
        --tenant-font-secondary: '${theme.secondaryFontFamily ?? theme.fontFamily ?? 'Inter'}';
      }`,
    },
  ],
})
</script>

<template>
  <main class="font-[var(--tenant-font)]">
    <template v-for="block in blocks" :key="block.__component + (block as { id?: number }).id">
      <component
        :is="blockComponentMap[block.__component]"
        v-if="blockComponentMap[block.__component]"
        v-bind="block"
        :turnstile-site-key="config.public.turnstileSiteKey || undefined"
        @view="trackFormView"
        @submit="trackFormSubmit"
        @success="trackFormSuccess"
        @error="trackFormError"
      />
    </template>
  </main>
</template>
