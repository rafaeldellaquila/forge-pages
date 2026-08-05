'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  r: number
  speed: number
  drift: number
  life: number
  maxLife: number
  color: string
}

const PARTICLE_COUNT = 70

/**
 * Rising embers over a block's background (ADR-0005: `effect: 'particles'`).
 *
 * Canvas 2D cannot resolve a CSS custom property, so the tenant hues are read
 * from the computed style instead of being hardcoded — a literal here would look
 * right for one tenant and silently wrong for the next (ADR-0002 rule 4).
 */
export function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const styles = getComputedStyle(canvas)
    const hues = [
      styles.getPropertyValue('--tenant-primary').trim() || '#ff6a2c',
      styles.getPropertyValue('--tenant-secondary').trim() || '#ffba4a',
    ]

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
    }
    resize()

    const spawn = (initial = false): Particle => ({
      x: Math.random() * canvas.width,
      y: initial ? Math.random() * canvas.height : canvas.height + 10,
      r: Math.random() * 2.2 + 0.6,
      speed: Math.random() * 1.3 + 0.4,
      drift: (Math.random() - 0.5) * 0.6,
      life: 0,
      maxLife: Math.random() * 260 + 180,
      color: hues[Math.random() > 0.5 ? 0 : 1],
    })

    const particles = Array.from({ length: PARTICLE_COUNT }, () => spawn(true))
    let frame = 0

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)

      for (const particle of particles) {
        particle.y -= particle.speed
        particle.x += particle.drift
        particle.life += 1

        const fade = Math.max(1 - particle.life / particle.maxLife, 0)

        context.globalAlpha = fade * 0.8
        context.beginPath()
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2)
        context.fillStyle = particle.color
        context.shadowBlur = 6
        context.shadowColor = particle.color
        context.fill()

        if (particle.life >= particle.maxLife || particle.y < -10) Object.assign(particle, spawn())
      }

      context.globalAlpha = 1
      frame = requestAnimationFrame(draw)
    }

    frame = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // No aria-hidden: an empty <canvas> exposes nothing to assistive tech anyway,
  // and hiding a potentially focusable element is itself an a11y problem.
  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-0" />
}
