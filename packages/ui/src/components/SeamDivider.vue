<script setup lang="ts">
defineProps<{
  /** Optional glyph centered on the line (e.g. '⚒') — omit for a plain line */
  glyph?: string | null
}>()
</script>

<template>
  <div
    class="relative mx-auto h-px max-w-[1400px]"
    style="background: linear-gradient(90deg, transparent, var(--tenant-primary) 15%, var(--tenant-primary) 85%, transparent); opacity: 0.35"
  >
    <span
      v-if="glyph"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--tenant-background,white)] px-3 text-sm text-[var(--tenant-primary)]"
    >
      {{ glyph }}
    </span>
  </div>
</template>
