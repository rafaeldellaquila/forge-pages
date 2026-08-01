<script setup lang="ts">
import type { PricingBlock } from '@forge-pages/types'

const props = defineProps<PricingBlock>()
</script>

<template>
  <section class="bg-white">
    <div class="container mx-auto px-4 py-20">
      <div class="max-w-2xl mx-auto text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold text-gray-900">{{ props.headline }}</h2>
        <p v-if="props.subheadline" class="mt-4 text-lg text-gray-600">{{ props.subheadline }}</p>
      </div>
      <div class="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto items-start">
        <div
          v-for="(plan, i) in props.plans"
          :key="i"
          class="relative p-8 rounded-2xl border shadow-sm"
          :class="
            plan.featured
              ? 'border-[var(--tenant-primary)] shadow-lg md:scale-105'
              : 'border-gray-100'
          "
        >
          <span
            v-if="plan.badge"
            class="absolute -top-3 left-8 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white bg-[var(--tenant-primary)]"
          >
            {{ plan.badge }}
          </span>
          <p v-if="plan.eyebrow" class="text-sm font-semibold text-[var(--tenant-secondary)] mb-2">
            {{ plan.eyebrow }}
          </p>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">{{ plan.title }}</h3>
          <p v-if="plan.description" class="text-gray-600 mb-4">{{ plan.description }}</p>
          <p class="text-2xl font-bold text-gray-900 mb-6">{{ plan.price }}</p>
          <ul class="grid gap-3 mb-8">
            <li v-for="(feature, fi) in plan.features" :key="fi" class="flex items-start gap-2 text-gray-700">
              <span class="mt-1 text-[var(--tenant-secondary)]">✓</span>
              <span>{{ feature.text }}</span>
            </li>
          </ul>
          <a
            :href="plan.ctaLink"
            class="block w-full text-center px-6 py-3 rounded-lg font-semibold text-white bg-[var(--tenant-primary)] hover:opacity-90 transition-opacity"
          >
            {{ plan.ctaLabel }}
          </a>
        </div>
      </div>
      <p v-if="props.note" class="mt-10 text-center text-sm text-gray-500 max-w-2xl mx-auto">
        {{ props.note }}
      </p>
    </div>
  </section>
</template>
