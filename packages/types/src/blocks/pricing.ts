export interface PricingBlock {
  __component: 'blocks.pricing'
  headline: string
  subheadline?: string
  plans: {
    badge?: string
    eyebrow?: string
    title: string
    description?: string
    price: string
    features: { text: string }[]
    ctaLabel: string
    ctaLink: string
    featured?: boolean
  }[]
  note?: string
}
