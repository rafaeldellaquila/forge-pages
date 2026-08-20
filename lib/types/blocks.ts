// Data contract for the `landing_pages.blocks` JSONB array. Every block is
// discriminated by `type`. Each interface here needs a matching Zod schema in
// lib/schemas/blocks.ts — the two are edited together (see CLAUDE.md §10).

export type BackgroundType =
  | 'transparent'
  | 'solid'
  | 'gradient'
  | 'image'
  | 'fine-line-texture'
  | 'glass'

export type BackgroundColorToken = 'primary' | 'secondary' | 'custom'

export interface Background {
  type?: BackgroundType
  colorToken?: BackgroundColorToken
  customColor?: string
  gradientToToken?: BackgroundColorToken
  gradientToCustom?: string
  image?: { url: string; alternativeText?: string }
  effect?: 'none' | 'particles'
}

export type RenderMode = 'blocks' | 'custom'
export type LandingPageStatus = 'draft' | 'published' | 'archived'
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost'

export interface LandingPageConfig {
  id: string
  clientId: string
  domain: string
  renderMode: RenderMode
  status: LandingPageStatus
  seoTitle: string | null
  seoDescription: string | null
  seoOgImage: string | null
  canonicalUrl: string | null
  faviconUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
  fontFamily: string | null
  secondaryFontFamily: string | null
  themeMode: 'dark' | 'light'
  background: Background | null
  dividerGlyph: string | null
  whatsappFloatEnabled: boolean
  whatsappFloatNumber: string | null
  whatsappFloatMessage: string | null
  blocks: BlockType[]
}

export interface Lead {
  id: string
  landingPageId: string
  /** Host the lead arrived on, snapshotted at insert time. Not a live join. */
  domain: string
  name: string
  whatsapp: string
  email: string | null
  message: string | null
  intent: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  status: LeadStatus
  createdAt: string
}

export interface LeadInput {
  name: string
  whatsapp: string
  email?: string
  message?: string
  intent?: string
  turnstileToken: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

export type HeaderVariant = 'default' | 'centered'

export interface HeaderBlock {
  type: 'header'
  variant?: HeaderVariant
  background?: Background
  logo?: { url: string; alternativeText?: string }
  menuLinks: { label: string; url: string }[]
  ctaLabel: string
  ctaWhatsapp?: string
  ctaMessage?: string
  ctaLink?: string
}

export type HeroVariant = 'default' | 'centered'

export interface HeroBlock {
  type: 'hero'
  /**
   * Fragment target for in-page navigation (`#processo`), so a header menu can
   * link to this block. Belongs to the content, not the component: the same
   * block type is used more than once per page and each occurrence needs its own
   * anchor. Blocks whose components land in Fase 3 gain this field with them.
   */
  anchorId?: string
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

export interface TrustIconsBlock {
  type: 'trust-icons'
  anchorId?: string
  items: { icon: string; text: string }[]
}

export interface StatsBlock {
  type: 'stats'
  anchorId?: string
  items: { number: string; label: string }[]
}

export type ValuePropositionVariant = 'default' | 'timeline'

export interface ValuePropositionBlock {
  type: 'value-proposition'
  anchorId?: string
  variant?: ValuePropositionVariant
  eyebrow?: string
  headline: string
  text?: string
  cards: { icon: string; title: string; description: string; stepLabel?: string }[]
}

export type ServicesVariant = 'default' | 'image-left'

export interface ServicesBlock {
  type: 'services'
  anchorId?: string
  variant?: ServicesVariant
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

export interface DifferentialsBlock {
  type: 'differentials'
  anchorId?: string
  background?: Background
  eyebrow?: string
  headline: string
  text?: string
  items: { icon?: string; tag?: string; text: string }[]
}

export interface TestimonialsBlock {
  type: 'testimonials'
  anchorId?: string
  headline: string
  items: {
    name: string
    role?: string
    photo?: { url: string; alternativeText?: string }
    text: string
    rating?: number
  }[]
}

export interface CtaFormBlock {
  type: 'cta-form'
  anchorId?: string
  headline: string
  subheadline?: string
  selectOptions: { label: string; value: string }[]
  ctaLabel: string
  whatsappNumber: string
  whatsappMessage?: string
}

export interface FooterBlock {
  type: 'footer'
  logo?: { url: string; alternativeText?: string }
  description?: string
  links: { label: string; url: string }[]
  phones: { label?: string; number: string }[]
  schedule?: string
  socialLinks: { platform: string; url: string }[]
  copyright: string
  privacyLink?: string
}

export interface PricingBlock {
  type: 'pricing'
  anchorId?: string
  eyebrow?: string
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

export interface FaqBlock {
  type: 'faq'
  anchorId?: string
  eyebrow?: string
  headline: string
  text?: string
  items: { question: string; answer: string }[]
}

export interface LocationsBlock {
  type: 'locations'
  anchorId?: string
  eyebrow?: string
  headline: string
  items: { icon?: string; city: string; address: string; mapLink?: string }[]
}

export interface ProductGridBlock {
  type: 'product-grid'
  anchorId?: string
  headline: string
  subheadline?: string
  items: {
    image: { url: string; alternativeText?: string }
    badge?: string
    name: string
    subtitle?: string
    specs?: string[]
    priceLabel?: string
    price?: string
    ctaLabel: string
    ctaLink?: string
    ctaWhatsapp?: string
    ctaMessage?: string
  }[]
  viewAllLabel?: string
  viewAllLink?: string
}

export interface BeforeAfterBlock {
  type: 'before-after'
  anchorId?: string
  headline?: string
  subheadline?: string
  items: {
    beforeImage: { url: string; alternativeText?: string }
    afterImage: { url: string; alternativeText?: string }
    caption?: string
  }[]
}

export interface ComparisonTableBlock {
  type: 'comparison-table'
  anchorId?: string
  eyebrow?: string
  headline: string
  subheadline?: string
  columns: {
    title: string
    badge?: string
    featured?: boolean
    rows: { text: string; positive: boolean }[]
  }[]
}

export type BlockType =
  | HeaderBlock
  | HeroBlock
  | TrustIconsBlock
  | StatsBlock
  | ValuePropositionBlock
  | ServicesBlock
  | DifferentialsBlock
  | TestimonialsBlock
  | CtaFormBlock
  | FooterBlock
  | PricingBlock
  | FaqBlock
  | LocationsBlock
  | ProductGridBlock
  | BeforeAfterBlock
  | ComparisonTableBlock
