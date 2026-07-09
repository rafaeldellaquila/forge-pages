<script setup lang="ts">
import type { StatsBlock } from '@forge-pages/types'

const props = defineProps<StatsBlock>()
</script>

<template>
  <section class="bg-[var(--tenant-primary)] text-white">
    <div class="container mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      <div v-for="(item, i) in props.items" :key="i">
        <div class="text-4xl md:text-5xl font-bold">{{ item.number }}</div>
        <div class="mt-2 text-sm uppercase tracking-wide opacity-80">{{ item.label }}</div>
      </div>
    </div>
  </section>
</template>
