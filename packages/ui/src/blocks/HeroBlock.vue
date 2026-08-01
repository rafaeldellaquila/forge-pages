<script setup lang="ts">
import type { HeroBlock } from '@forge-pages/types'
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<HeroBlock>()

const isEmber = props.variant === 'ember'

const canvasEl = ref<HTMLCanvasElement | null>(null)
let rafId = 0

interface Particle {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  life: number
  maxLife: number
  hue: string
}

const makeParticle = (canvas: HTMLCanvasElement): Particle => ({
  x: Math.random() * canvas.width,
  y: canvas.height + 10,
  r: Math.random() * 2.2 + 0.6,
  speed: Math.random() * 1.3 + 0.4,
  drift: (Math.random() - 0.5) * 0.6,
  life: 0,
  maxLife: Math.random() * 260 + 180,
  hue: Math.random() > 0.5 ? '255,106,44' : '255,186,74',
})

onMounted(() => {
  if (!isEmber || !canvasEl.value) return
  const canvas = canvasEl.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const resize = (): void => {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const particles: Particle[] = []
  for (let i = 0; i < 70; i++) {
    const p = makeParticle(canvas)
    p.y = Math.random() * canvas.height
    particles.push(p)
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReduced) return

  const animate = (): void => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const p of particles) {
      p.y -= p.speed
      p.x += p.drift
      p.life++
      const fade = 1 - p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${p.hue}, ${Math.max(fade, 0) * 0.8})`
      ctx.shadowBlur = 6
      ctx.shadowColor = `rgba(${p.hue}, 0.8)`
      ctx.fill()
      if (p.life >= p.maxLife || p.y < -10) Object.assign(p, makeParticle(canvas))
    }
    rafId = requestAnimationFrame(animate)
  }
  rafId = requestAnimationFrame(animate)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    cancelAnimationFrame(rafId)
  })
})
</script>

<template>
  <section
    v-if="isEmber"
    class="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-[#141009] text-center"
  >
    <canvas ref="canvasEl" class="pointer-events-none absolute inset-0 h-full w-full" />
    <div class="relative z-10 container mx-auto px-4 py-16 max-w-2xl">
      <span
        v-if="props.badgeText"
        class="inline-block mb-4 px-4 py-1 rounded-full text-sm font-semibold bg-[var(--tenant-primary)] text-white"
      >
        {{ props.badgeText }}
      </span>
      <h1
        :class="
          props.image
            ? 'sr-only'
            : 'text-4xl md:text-5xl font-bold text-white mb-4 leading-tight'
        "
      >
        {{ props.headline }}
      </h1>
      <img
        v-if="props.image"
        :src="props.image.url"
        :alt="props.imageAlt ?? props.image.alternativeText ?? props.headline"
        class="mx-auto mb-8 h-auto w-full max-w-md"
        loading="eager"
      />
      <p class="text-xl text-[#C9BFAC] mb-8">{{ props.subheadline }}</p>
      <div class="flex flex-wrap justify-center gap-4">
        <a
          :href="props.ctaPrimaryLink"
          class="px-8 py-4 rounded-lg font-semibold text-[#141009] bg-[var(--tenant-primary)] hover:opacity-90 transition-opacity"
        >
          {{ props.ctaPrimaryLabel }}
        </a>
        <a
          v-if="props.ctaSecondaryLabel && props.ctaSecondaryLink"
          :href="props.ctaSecondaryLink"
          class="px-8 py-4 rounded-lg font-semibold border-2 border-[#3D3123] text-[#F3EADB] hover:bg-white/5 transition-colors"
        >
          {{ props.ctaSecondaryLabel }}
        </a>
      </div>
    </div>
  </section>

  <section v-else class="relative min-h-[80vh] flex items-center bg-white">
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
