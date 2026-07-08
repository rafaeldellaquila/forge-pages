export interface HeroBlock {
  __component: 'blocks.hero'
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
