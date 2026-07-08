export interface ServicesBlock {
  __component: 'blocks.services'
  headline: string
  tabs: {
    label: string
    title: string
    text: string
    ctaLabel?: string
    ctaLink?: string
    image?: { url: string; alternativeText?: string }
  }[]
}
