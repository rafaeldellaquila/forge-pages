// The single place a `Background` becomes CSS (ADR-0005). Every block component
// and the root layout go through resolveBackground() — nothing else may build a
// background style by hand.
//
// Runtime values (tenant hex, resolved gradients, image URLs) can't go through
// Tailwind's static utilities, so the output is an inline style object. Colors
// resolve to the --tenant-* custom properties rather than literals, so a block
// styled for one tenant is never wrong for the next (ADR-0002 rule 4).

import type { CSSProperties } from 'react'
import type { Background, BackgroundColorToken } from '@/lib/types/blocks'

export interface ResolvedBackground {
  style: CSSProperties
  className: string
}

const EMPTY: ResolvedBackground = { style: {}, className: '' }

function resolveColor(token: BackgroundColorToken | undefined, custom: string | undefined) {
  if (token === 'custom') return custom ?? 'transparent'
  if (token === 'secondary') return 'var(--tenant-secondary)'
  if (token === 'primary') return 'var(--tenant-primary)'
  return custom ?? 'var(--tenant-primary)'
}

/** `color-mix` keeps the alpha math in CSS, where the custom property is resolvable. */
function withAlpha(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

/**
 * The flat fill colour behind a background, with no gradient, texture or image.
 * The root layout publishes it as `--tenant-background` so surfaces that must
 * match the page (the sticky header's glass, the seam divider's glyph mask) have
 * a colour to reference instead of guessing.
 */
export function resolveBackgroundBaseColor(background: Background | null | undefined): string {
  if (!background?.type || background.type === 'transparent') return 'transparent'
  return resolveColor(background.colorToken, background.customColor)
}

export function resolveBackground(background: Background | null | undefined): ResolvedBackground {
  if (!background?.type || background.type === 'transparent') return EMPTY

  const color = resolveColor(background.colorToken, background.customColor)

  switch (background.type) {
    case 'solid':
      return { style: { backgroundColor: color }, className: '' }

    case 'gradient': {
      const to = resolveColor(background.gradientToToken, background.gradientToCustom)
      return {
        style: { backgroundImage: `linear-gradient(135deg, ${color}, ${to})` },
        className: '',
      }
    }

    case 'image':
      return {
        style: background.image
          ? {
              backgroundImage: `url(${background.image.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : {},
        className: '',
      }

    // Base fill, a soft top-lit glow in the tenant's primary, and a 3px hairline
    // weave — the page-level treatment the Forge Company port needs.
    case 'fine-line-texture':
      return {
        style: {
          backgroundColor: color,
          backgroundImage: [
            `radial-gradient(ellipse 80% 50% at 50% -10%, ${withAlpha('var(--tenant-primary)', 8)}, transparent)`,
            'repeating-linear-gradient(115deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)',
          ].join(', '),
        },
        className: '',
      }

    // Translucent surface for stacked/sticky elements; the blur is a class so it
    // picks up Tailwind's vendor-prefixed output.
    case 'glass':
      return {
        style: { backgroundColor: withAlpha(color, 75) },
        className: 'backdrop-blur-[10px]',
      }
  }
}

/**
 * Header is the one block that must stay legible over scrolling content, so it
 * falls back to a surface instead of `transparent` like every other block
 * (ADR-0005). The color is the tenant's own page background rather than a
 * literal, so the fallback is correct for a dark and a light tenant alike.
 */
export const HEADER_BACKGROUND_FALLBACK: Background = {
  type: 'glass',
  colorToken: 'custom',
  customColor: 'var(--tenant-background)',
}
