<script setup lang="ts">
import type { LandingPageConfig } from '@forge-pages/types'

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

useTenantHead(tenant.value)
</script>

<template>
  <BlockRenderer :blocks="blocks" :divider-glyph="tenant?.dividerGlyph" />
</template>
