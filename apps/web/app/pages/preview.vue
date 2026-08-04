<script setup lang="ts">
import type { BlockType, LandingPageConfig } from '@forge-pages/types'

const route = useRoute()
const domain = String(route.query.domain ?? '')
const documentId = String(route.query.documentId ?? '')
const secret = String(route.query.secret ?? '')
const status = route.query.status === 'draft' ? 'draft' : 'published'

if (!domain || !documentId || !secret) {
  throw createError({ statusCode: 400, statusMessage: 'Missing preview parameters' })
}

const { data, error } = await useFetch<{ blocks: BlockType[]; tenant: LandingPageConfig }>(
  '/api/preview-blocks',
  { query: { domain, documentId, secret, status }, key: `preview-${documentId}-${status}` },
)

if (error.value || !data.value) {
  throw createError({
    statusCode: error.value?.statusCode ?? 404,
    statusMessage: 'Preview not available',
  })
}

const previewData = data.value
const tenant = computed(() => previewData.tenant)
const blocks = computed(() => previewData.blocks)
useTenantHead(tenant.value)
</script>

<template>
  <div>
    <div class="sticky top-0 z-50 bg-amber-400 py-1 text-center text-xs font-semibold text-amber-950">
      Preview — {{ status === 'draft' ? 'draft' : 'published' }} content, not visible to visitors
    </div>
    <BlockRenderer :blocks="blocks" />
    <PreviewBridge />
  </div>
</template>
