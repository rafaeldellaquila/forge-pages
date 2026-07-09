import {
  CtaFormBlock,
  DifferentialsBlock,
  FooterBlock,
  HeaderBlock,
  HeroBlock,
  ServicesBlock,
  StatsBlock,
  TestimonialsBlock,
  TrustIconsBlock,
  ValuePropositionBlock,
} from '@forge-pages/ui'
import type { Component } from 'vue'

export const blockComponentMap: Record<string, Component> = {
  'blocks.header': HeaderBlock,
  'blocks.hero': HeroBlock,
  'blocks.trust-icons': TrustIconsBlock,
  'blocks.stats': StatsBlock,
  'blocks.value-proposition': ValuePropositionBlock,
  'blocks.services': ServicesBlock,
  'blocks.differentials': DifferentialsBlock,
  'blocks.testimonials': TestimonialsBlock,
  'blocks.cta-form': CtaFormBlock,
  'blocks.footer': FooterBlock,
}
