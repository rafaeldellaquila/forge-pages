import type { LandingPageConfig } from '@forge-pages/types'
import { resolveBackground } from '@forge-pages/ui'

const toCss = (style: Record<string, string>): string =>
  Object.entries(style)
    .map(([prop, value]) => `${prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${value};`)
    .join(' ')

export function useTenantHead(theme: LandingPageConfig) {
  const backgroundColorVar =
    theme.background?.colorToken === 'secondary'
      ? 'var(--tenant-secondary)'
      : 'var(--tenant-primary)'
  const resolvedBackground = resolveBackground(theme.background)

  useHead({
    title: theme.seoTitle ?? undefined,
    meta: [
      { name: 'description', content: theme.seoDescription ?? '' },
      { property: 'og:title', content: theme.seoTitle ?? '' },
      { property: 'og:image', content: theme.seoOgImage ?? '' },
    ],
    link: theme.canonicalUrl ? [{ rel: 'canonical', href: theme.canonicalUrl }] : [],
    style: [
      {
        innerHTML: `:root {
          --tenant-primary: ${theme.primaryColor ?? '#065a82'};
          --tenant-secondary: ${theme.secondaryColor ?? '#1c7293'};
          --tenant-font: '${theme.fontFamily ?? 'Inter'}';
          --tenant-font-secondary: '${theme.secondaryFontFamily ?? theme.fontFamily ?? 'Inter'}';
          --tenant-background: ${theme.background?.customColor ?? (theme.background ? backgroundColorVar : '#ffffff')};
        }
        body { ${toCss(resolvedBackground.style)} }`,
      },
    ],
  })
}
