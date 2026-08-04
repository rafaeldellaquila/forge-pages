import type { Background, BackgroundColorToken } from '@forge-pages/types'

export interface ResolvedBackground {
  style: Record<string, string>
  classes: string[]
}

const resolveColor = (
  token: BackgroundColorToken | undefined,
  custom: string | undefined,
): string => {
  if (token === 'custom') return custom ?? 'var(--tenant-primary)'
  if (token === 'secondary') return 'var(--tenant-secondary)'
  return 'var(--tenant-primary)'
}

/**
 * Turns a block/page `Background` config into a style object + class list.
 * `type` defaults to 'transparent' — absent config means "show whatever's behind it"
 * (the page background for in-flow blocks, current scroll content for a sticky Header).
 */
export function resolveBackground(bg?: Background | null): ResolvedBackground {
  const type = bg?.type ?? 'transparent'
  const color = resolveColor(bg?.colorToken, bg?.customColor)

  switch (type) {
    case 'solid':
      return { style: { backgroundColor: color }, classes: [] }

    case 'gradient': {
      const to = resolveColor(bg?.gradientToToken, bg?.gradientToCustom)
      return { style: { backgroundImage: `linear-gradient(135deg, ${color}, ${to})` }, classes: [] }
    }

    case 'image':
      return {
        style: bg?.image
          ? {
              backgroundImage: `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url(${bg.image.url})`,
            }
          : {},
        classes: ['bg-cover', 'bg-center'],
      }

    case 'fine-line-texture': {
      const line = `color-mix(in srgb, ${color} 12%, transparent)`
      return {
        style: {
          backgroundImage: `repeating-linear-gradient(115deg, ${line} 0px, ${line} 1px, transparent 1px, transparent 3px)`,
        },
        classes: [],
      }
    }

    case 'glass':
      return {
        style: { backgroundColor: `color-mix(in srgb, ${color} 75%, transparent)` },
        classes: ['backdrop-blur-md'],
      }

    default:
      return { style: {}, classes: [] }
  }
}
