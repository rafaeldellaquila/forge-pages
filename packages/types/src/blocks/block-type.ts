import type { CtaFormBlock } from './cta-form'
import type { DifferentialsBlock } from './differentials'
import type { FooterBlock } from './footer'
import type { HeaderBlock } from './header'
import type { HeroBlock } from './hero'
import type { PricingBlock } from './pricing'
import type { ServicesBlock } from './services'
import type { StatsBlock } from './stats'
import type { TestimonialsBlock } from './testimonials'
import type { TrustIconsBlock } from './trust-icons'
import type { ValuePropositionBlock } from './value-proposition'

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
