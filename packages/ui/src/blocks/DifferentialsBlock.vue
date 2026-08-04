<script setup lang="ts">
import type { DifferentialsBlock } from '@forge-pages/types'
import { computed } from 'vue'
import { resolveBackground } from '../utils/background'

const props = defineProps<DifferentialsBlock>()

const resolved = computed(() => resolveBackground(props.background))
const isDark = computed(() => {
  const t = props.background?.type
  return t === 'solid' || t === 'gradient' || t === 'glass' || t === 'image'
})
</script>

<template>
  <section :class="resolved.classes" :style="resolved.style">
    <div class="container mx-auto px-4 py-20">
      <div class="max-w-2xl mx-auto text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold" :class="isDark ? 'text-white' : 'text-gray-900'">
          {{ props.headline }}
        </h2>
        <p v-if="props.text" class="mt-4 text-lg" :class="isDark ? 'text-white/70' : 'text-gray-600'">
          {{ props.text }}
        </p>
      </div>
      <ul class="flex flex-col gap-4 max-w-2xl mx-auto">
        <li
          v-for="(item, i) in props.items"
          :key="i"
          class="flex items-start gap-4 rounded-lg border px-5 py-4"
          :class="isDark ? 'bg-white/5 border-white/10' : 'bg-black/[0.03] border-black/10'"
        >
          <span
            v-if="item.tag"
            class="mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide bg-[var(--tenant-secondary)] text-white"
          >
            {{ item.tag }}
          </span>
          <span
            v-else
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--tenant-secondary)] text-white"
          >
            {{ item.icon }}
          </span>
          <span :class="isDark ? 'text-white/80' : 'text-gray-700'">{{ item.text }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
