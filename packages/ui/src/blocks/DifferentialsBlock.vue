<script setup lang="ts">
import type { DifferentialsBlock } from '@forge-pages/types'

const props = defineProps<DifferentialsBlock>()
</script>

<template>
  <section class="bg-white">
    <div class="container mx-auto px-4 py-20">
      <div class="max-w-2xl mx-auto text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900">{{ props.headline }}</h2>
        <p v-if="props.text" class="mt-4 text-lg text-gray-600">{{ props.text }}</p>
      </div>
      <ul class="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
        <li v-for="(item, i) in props.items" :key="i" class="flex items-start gap-4">
          <span
            v-if="item.tag"
            class="mt-1 shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide bg-[var(--tenant-secondary)] text-white"
          >
            {{ item.tag }}
          </span>
          <span
            v-else
            class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tenant-secondary)] text-white"
          >
            {{ item.icon }}
          </span>
          <span class="text-gray-700">{{ item.text }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
