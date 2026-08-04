import type { Background } from '../shared'

export type HeaderVariant = 'default' | 'centered'

export interface HeaderBlock {
  __component: 'blocks.header'
  variant?: HeaderVariant
  background?: Background
  logo?: { url: string; alternativeText?: string }
  menuLinks: { label: string; url: string }[]
  ctaLabel: string
  ctaWhatsapp?: string
  ctaMessage?: string
  ctaLink?: string
}
