<script setup lang="ts">
import type { HeroBlock } from '@forge-pages/types'
import { computed } from 'vue'
import BackgroundParticles from '../components/BackgroundParticles.vue'
import { resolveBackground } from '../utils/background'

const props = defineProps<HeroBlock>()

const isCentered = computed(() => props.variant === 'centered')
const hasParticles = computed(() => props.background?.effect === 'particles')
const resolved = computed(() => resolveBackground(props.background))

// Fills that put an actual color/image behind the text need light text; the
// presentation's 'centered' look is dark by convention, but text color should follow
// the actual resolved background, not the layout variant — a tenant could pick
// 'centered' with a light background too.
const isDark = computed(() => {
  const t = props.background?.type
  return t === 'solid' || t === 'gradient' || t === 'glass' || t === 'image'
})
</script>

<template>
  <section
    class="relative min-h-[80vh] flex items-center overflow-hidden"
    :class="[resolved.classes, isCentered ? 'justify-center text-center' : '']"
    :style="resolved.style"
  >
    <BackgroundParticles v-if="hasParticles" />
    <div
      class="relative z-10 container mx-auto px-4 py-16"
      :class="isCentered ? 'max-w-2xl' : 'grid md:grid-cols-2 gap-12 items-center'"
    >
      <div>
        <span
          v-if="props.badgeText"
          class="inline-block mb-4 px-4 py-1 rounded-full text-sm font-semibold bg-[var(--tenant-primary)] text-white"
        >
          {{ props.badgeText }}
        </span>
        <h1
          class="text-4xl md:text-5xl font-bold mb-4 leading-tight"
          :class="isDark ? 'text-white' : 'text-gray-900'"
        >
          {{ props.headline }}
        </h1>
        <img
          v-if="props.image && isCentered"
          :src="props.image.url"
          :alt="props.imageAlt ?? props.image.alternativeText ?? props.headline"
          class="mx-auto mb-8 h-auto w-full max-w-md"
          loading="eager"
        />
        <p class="text-xl mb-8" :class="isDark ? 'text-white/70' : 'text-gray-600'">
          {{ props.subheadline }}
        </p>
        <div class="flex flex-wrap gap-4" :class="isCentered ? 'justify-center' : ''">
          <a
            :href="props.ctaPrimaryLink"
            class="px-8 py-4 rounded-lg font-semibold text-white bg-[var(--tenant-primary)] hover:opacity-90 transition-opacity"
          >
            {{ props.ctaPrimaryLabel }}
          </a>
          <a
            v-if="props.ctaSecondaryLabel && props.ctaSecondaryLink"
            :href="props.ctaSecondaryLink"
            class="px-8 py-4 rounded-lg font-semibold border-2 transition-colors"
            :class="
              isDark
                ? 'border-white/20 text-white hover:bg-white/5'
                : 'border-[var(--tenant-primary)] text-[var(--tenant-primary)] hover:bg-gray-50'
            "
          >
            {{ props.ctaSecondaryLabel }}
          </a>
        </div>
      </div>
      <div v-if="props.image && !isCentered">
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
