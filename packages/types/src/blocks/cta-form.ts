export interface CtaFormBlock {
  __component: 'blocks.cta-form'
  headline: string
  subheadline?: string
  selectOptions: { label: string; value: string }[]
  ctaLabel: string
  whatsappNumber: string
  whatsappMessage?: string
}
