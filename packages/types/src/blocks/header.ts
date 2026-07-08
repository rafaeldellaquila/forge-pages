export interface HeaderBlock {
  __component: 'blocks.header'
  logo?: { url: string; alternativeText?: string }
  menuLinks: { label: string; url: string }[]
  ctaLabel: string
  ctaWhatsapp: string
  ctaMessage?: string
}
