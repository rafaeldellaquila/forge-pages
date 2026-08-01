import type { LandingPageConfig } from '@forge-pages/types'
import { createClient } from '@supabase/supabase-js'

declare module 'h3' {
  interface H3EventContext {
    tenant: LandingPageConfig | null
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const host = getHeader(event, 'host') ?? ''

  // Strip port for local development (localhost:3000 -> localhost)
  const domain = host.replace(/:\d+$/, '')

  const supabase = createClient(config.public.supabaseUrl, config.public.supabasePublishableKey)

  // Alias snake_case columns to camelCase so the result matches LandingPageConfig
  const { data } = await supabase
    .from('landing_pages')
    .select(
      'id, clientId:client_id, domain, renderMode:render_mode, status, seoTitle:seo_title, seoDescription:seo_description, seoOgImage:seo_og_image, canonicalUrl:canonical_url, primaryColor:primary_color, secondaryColor:secondary_color, fontFamily:font_family, secondaryFontFamily:secondary_font_family',
    )
    .eq('domain', domain)
    .eq('status', 'published')
    .maybeSingle()

  event.context.tenant = (data as LandingPageConfig | null) ?? null
})
