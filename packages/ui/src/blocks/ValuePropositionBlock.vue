<script setup lang="ts">
import type { ValuePropositionBlock } from '@forge-pages/types'

const props = defineProps<ValuePropositionBlock>()
</script>

<template>
  <section class="bg-white">
    <div class="container mx-auto px-4 py-20">
      <div class="max-w-2xl mx-auto text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900">{{ props.headline }}</h2>
        <p v-if="props.text" class="mt-4 text-lg text-gray-600">{{ props.text }}</p>
      </div>
      <div class="grid gap-8 md:grid-cols-3">
        <div
          v-for="(card, i) in props.cards"
          :key="i"
          class="p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <span
            v-if="card.stepLabel"
            class="block mb-3 text-xs font-semibold tracking-widest uppercase text-[var(--tenant-secondary)]"
          >
            {{ card.stepLabel }}
          </span>
          <span
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--tenant-secondary)] text-white text-xl mb-4"
          >
            {{ card.icon }}
          </span>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ card.title }}</h3>
          <p class="text-gray-600">{{ card.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
