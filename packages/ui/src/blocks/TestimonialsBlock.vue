<script setup lang="ts">
import type { TestimonialsBlock } from '@forge-pages/types'

const props = defineProps<TestimonialsBlock>()
</script>

<template>
  <section class="bg-gray-50">
    <div class="container mx-auto px-4 py-20">
      <h2 class="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
        {{ props.headline }}
      </h2>
      <div class="grid gap-8 md:grid-cols-3">
        <figure
          v-for="(item, i) in props.items"
          :key="i"
          class="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col"
        >
          <div v-if="item.rating" class="mb-3 text-[var(--tenant-primary)]" aria-label="rating">
            <span v-for="star in item.rating" :key="star">★</span>
          </div>
          <blockquote class="text-gray-700 flex-1">"{{ item.text }}"</blockquote>
          <figcaption class="mt-6 flex items-center gap-3">
            <img
              v-if="item.photo"
              :src="item.photo.url"
              :alt="item.photo.alternativeText ?? item.name"
              class="h-10 w-10 rounded-full object-cover"
            />
            <div>
              <div class="font-semibold text-gray-900">{{ item.name }}</div>
              <div v-if="item.role" class="text-sm text-gray-500">{{ item.role }}</div>
            </div>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>
