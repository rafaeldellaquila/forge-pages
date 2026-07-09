export interface FooterBlock {
  __component: 'blocks.footer'
  logo?: { url: string; alternativeText?: string }
  description?: string
  links: { label: string; url: string }[]
  phones: { label?: string; number: string }[]
  schedule?: string
  socialLinks: { platform: string; url: string }[]
  copyright: string
  privacyLink?: string
}
