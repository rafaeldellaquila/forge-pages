<script setup lang="ts">
import type { ServicesBlock } from '@forge-pages/types'
import { ref } from 'vue'

const props = defineProps<ServicesBlock>()

const active = ref(0)
</script>

<template>
  <section class="bg-gray-50">
    <div class="container mx-auto px-4 py-20">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-10">
        {{ props.headline }}
      </h2>

      <div v-if="props.tabs?.length" class="flex flex-wrap justify-center gap-3 mb-10">
        <button
          v-for="(tab, i) in props.tabs"
          :key="i"
          type="button"
          class="px-5 py-2 rounded-full text-sm font-semibold transition-colors"
          :class="
            i === active
              ? 'bg-[var(--tenant-primary)] text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-[var(--tenant-primary)]'
          "
          @click="active = i"
        >
          {{ tab.label }}
        </button>
      </div>

      <div
        v-for="(tab, i) in props.tabs"
        v-show="i === active"
        :key="i"
        class="grid md:grid-cols-2 gap-10 items-center"
      >
        <div>
          <h3 class="text-2xl font-bold text-gray-900 mb-3">{{ tab.title }}</h3>
          <p class="text-gray-600 mb-6">{{ tab.text }}</p>
          <a
            v-if="tab.ctaLabel && tab.ctaLink"
            :href="tab.ctaLink"
            class="inline-block px-6 py-3 rounded-lg font-semibold text-white bg-[var(--tenant-primary)] hover:opacity-90 transition-opacity"
          >
            {{ tab.ctaLabel }}
          </a>
        </div>
        <img
          v-if="tab.image"
          :src="tab.image.url"
          :alt="tab.image.alternativeText ?? tab.title"
          class="w-full h-auto rounded-xl shadow-lg"
          loading="lazy"
        />
      </div>
    </div>
  </section>
</template>
