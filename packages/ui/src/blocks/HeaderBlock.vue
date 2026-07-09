<script setup lang="ts">
import type { HeaderBlock } from '@forge-pages/types'

const props = defineProps<HeaderBlock>()

const waLink = (phone: string, message?: string): string => {
  const digits = phone.replace(/\D/g, '')
  const base = `https://wa.me/${digits}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
    <div class="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
      <img v-if="props.logo" :src="props.logo.url" :alt="props.logo.alternativeText ?? ''" class="h-8 w-auto" />
      <nav v-if="props.menuLinks?.length" class="hidden md:flex items-center gap-6">
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
        :href="waLink(props.ctaWhatsapp, props.ctaMessage)"
        target="_blank"
        rel="noopener"
        class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--tenant-primary)] hover:opacity-90 transition-opacity"
      >
        {{ props.ctaLabel }}
      </a>
    </div>
  </header>
</template>
