<script setup lang="ts">
import type { BlockType } from '@forge-pages/types'
import { SeamDivider } from '@forge-pages/ui'
import { blockComponentMap } from '~/utils/blockComponentMap'

const props = defineProps<{ blocks: BlockType[]; dividerGlyph?: string | null }>()

const config = useRuntimeConfig()
const { trackFormView, trackFormSubmit, trackFormSuccess, trackFormError } = useTracking()
</script>

<template>
  <main class="font-[var(--tenant-font)]">
    <template v-for="(block, index) in blocks" :key="block.__component + (block as { id?: number }).id">
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
      <SeamDivider v-if="index < props.blocks.length - 1" :glyph="props.dividerGlyph" />
    </template>
  </main>
</template>
