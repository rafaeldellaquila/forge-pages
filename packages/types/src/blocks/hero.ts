export type HeroVariant = 'default' | 'ember'

export interface HeroBlock {
  __component: 'blocks.hero'
  variant?: HeroVariant
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
