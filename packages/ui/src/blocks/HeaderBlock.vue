<script setup lang="ts">
import type { HeaderBlock } from '@forge-pages/types'
import { computed } from 'vue'
import { resolveBackground } from '../utils/background'

const props = defineProps<HeaderBlock>()

const isCentered = computed(() => props.variant === 'centered')

// A sticky header needs *some* backdrop to stay legible over scrolling content —
// unlike in-flow blocks, "no background config" here means today's white glass
// bar, not fully transparent.
const resolved = computed(() =>
  resolveBackground(
    props.background ?? { type: 'glass', colorToken: 'custom', customColor: '#ffffff' },
  ),
)

const waLink = (phone: string, message?: string): string => {
  const digits = phone.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

const ctaHref = computed(() =>
  props.ctaLink
    ? props.ctaLink
    : props.ctaWhatsapp
      ? waLink(props.ctaWhatsapp, props.ctaMessage)
      : '#',
)
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-gray-100"
    :class="resolved.classes"
    :style="resolved.style"
  >
    <div
      class="container mx-auto px-4 h-16 items-center gap-4"
      :class="isCentered ? 'grid grid-cols-[auto_1fr_auto]' : 'flex justify-between'"
    >
      <img v-if="props.logo" :src="props.logo.url" :alt="props.logo.alternativeText ?? ''" class="h-8 w-auto" />
      <nav
        v-if="props.menuLinks?.length"
        class="hidden md:flex items-center gap-6"
        :class="isCentered ? 'justify-self-center' : ''"
      >
        <a
          v-for="link in props.menuLinks"
          :key="link.url"
          :href="link.url"
          class="text-sm font-medium text-gray-700 hover:text-[var(--tenant-primary)] transition-colors"
        >
          {{ link.label }}
        </a>
      </nav>
      <a
        :href="ctaHref"
        :target="props.ctaLink ? undefined : '_blank'"
        :rel="props.ctaLink ? undefined : 'noopener'"
        class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--tenant-primary)] hover:opacity-90 transition-opacity"
        :class="isCentered ? 'justify-self-end' : ''"
      >
        {{ props.ctaLabel }}
      </a>
    </div>
  </header>
</template>
