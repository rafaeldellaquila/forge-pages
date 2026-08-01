// Render mode
export type RenderMode = 'blocks' | 'custom'

// Landing page status
export type LandingPageStatus = 'draft' | 'published' | 'archived'

// Lead status
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost'

// Webhook channel
export type WebhookChannel = 'email' | 'whatsapp'

// Tenant config resolved from DB
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
  primaryColor: string | null
  secondaryColor: string | null
  fontFamily: string | null
  secondaryFontFamily: string | null
}

// Lead payload (form → DB)
export interface Lead {
  id: string
  landingPageId: string
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

// Lead form input (before saving)
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

// Block types (re-exported from individual files)
export * from './blocks/index'
