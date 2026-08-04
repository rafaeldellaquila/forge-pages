<script setup lang="ts">
const config = useRuntimeConfig()

function handleMessage(event: MessageEvent) {
  if (event.origin !== config.public.strapiUrl) {
    return
  }
  // Live Preview auto-refresh is experimental in Strapi and doesn't reliably detect
  // Dynamic Zone edits (this product's entire content model) — Save-triggered
  // refresh via this listener is a best-effort convenience, not real-time WYSIWYG.
  if (event.data?.type === 'strapiUpdate') {
    refreshNuxtData()
  }
}

onMounted(() => {
  window.addEventListener('message', handleMessage)
  window.parent?.postMessage({ type: 'previewReady' }, '*')
})
onUnmounted(() => window.removeEventListener('message', handleMessage))
</script>

<template>
  <div />
</template>
