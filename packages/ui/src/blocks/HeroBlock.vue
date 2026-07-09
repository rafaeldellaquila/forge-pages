<script setup lang="ts">
import type { HeroBlock } from '@forge-pages/types'

const props = defineProps<HeroBlock>()
</script>

<template>
  <section class="relative min-h-[80vh] flex items-center bg-white">
    <div class="container mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">
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
