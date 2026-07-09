<script setup lang="ts">
import type { TrustIconsBlock } from '@forge-pages/types'

const props = defineProps<TrustIconsBlock>()
</script>

<template>
  <section class="bg-gray-50 border-y border-gray-100">
    <div class="container mx-auto px-4 py-8 flex flex-wrap justify-center gap-x-12 gap-y-6">
      <div v-for="(item, i) in props.items" :key="i" class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--tenant-primary)] text-white text-lg"
        >
          {{ item.icon }}
        </span>
        <span class="text-sm font-medium text-gray-700">{{ item.text }}</span>
      </div>
    </div>
  </section>
</template>
