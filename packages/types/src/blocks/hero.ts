import type { Background } from '../shared'

export type HeroVariant = 'default' | 'centered'

export interface HeroBlock {
  __component: 'blocks.hero'
  variant?: HeroVariant
  background?: Background
  badgeText?: string
  headline: string
  subheadline: string
  ctaPrimaryLabel: string
  ctaPrimaryLink: string
  ctaSecondaryLabel?: string
  ctaSecondaryLink?: string
  image?: { url: string; alternativeText?: string }
  imageAlt?: string
}
