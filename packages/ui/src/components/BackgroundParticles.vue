<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{
  /** Hex/rgb color override — defaults to reading --tenant-primary from the document */
  primaryColor?: string
  /** Hex/rgb color override — defaults to reading --tenant-secondary from the document */
  secondaryColor?: string
}>()

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

// Canvas fillStyle can't resolve CSS custom properties, so brand colors are
// read once (as computed, already-resolved values) and converted to r,g,b.
const toRgbTriplet = (color: string): string => {
  const probe = document.createElement('span')
  probe.style.color = color
  document.body.appendChild(probe)
  const computed = getComputedStyle(probe).color
  document.body.removeChild(probe)
  const match = computed.match(/\d+(\.\d+)?/g)
  return match ? match.slice(0, 3).join(',') : '255,255,255'
}

const resolveHue = (override: string | undefined, cssVar: string, fallback: string): string => {
  const raw = override ?? getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim()
  return toRgbTriplet(raw || fallback)
}

const makeParticle = (canvas: HTMLCanvasElement, hueA: string, hueB: string): Particle => ({
  x: Math.random() * canvas.width,
  y: canvas.height + 10,
  r: Math.random() * 2.2 + 0.6,
  speed: Math.random() * 1.3 + 0.4,
  drift: (Math.random() - 0.5) * 0.6,
  life: 0,
  maxLife: Math.random() * 260 + 180,
  hue: Math.random() > 0.5 ? hueA : hueB,
})

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const hueA = resolveHue(props.primaryColor, '--tenant-primary', '#FF6A2C')
  const hueB = resolveHue(props.secondaryColor, '--tenant-secondary', '#FFBA4A')

  const resize = (): void => {
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
  }
  resize()
  window.addEventListener('resize', resize)

  const particles: Particle[] = []
  for (let i = 0; i < 70; i++) {
    const p = makeParticle(canvas, hueA, hueB)
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
      if (p.life >= p.maxLife || p.y < -10) Object.assign(p, makeParticle(canvas, hueA, hueB))
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
  <canvas ref="canvasEl" class="pointer-events-none absolute inset-0 h-full w-full" />
</template>
