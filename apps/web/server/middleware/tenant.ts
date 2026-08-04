import type { Background, LandingPageConfig } from '@forge-pages/types'
import { createClient } from '@supabase/supabase-js'

declare module 'h3' {
  interface H3EventContext {
    tenant: LandingPageConfig | null
  }
}

// Flat row shape as selected from Supabase — background_* columns are assembled
// into a nested `Background` object below since PostgREST can't alias flat
// columns into a nested object in the select string itself.
interface TenantRow extends Omit<LandingPageConfig, 'background'> {
  backgroundType: Background['type'] | null
  backgroundColorToken: Background['colorToken'] | null
  backgroundColorCustom: string | null
  backgroundGradientToToken: Background['gradientToToken'] | null
  backgroundGradientToCustom: string | null
  backgroundImageUrl: string | null
}

const toBackground = (row: TenantRow): Background | null => {
  if (!row.backgroundType) return null
  return {
    type: row.backgroundType,
    colorToken: row.backgroundColorToken ?? undefined,
    customColor: row.backgroundColorCustom ?? undefined,
    gradientToToken: row.backgroundGradientToToken ?? undefined,
    gradientToCustom: row.backgroundGradientToCustom ?? undefined,
    image: row.backgroundImageUrl ? { url: row.backgroundImageUrl } : undefined,
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const host = getHeader(event, 'host') ?? ''

  // Strip port for local development (localhost:3000 -> localhost)
  const domain = host.replace(/:\d+$/, '')

  const supabase = createClient(config.public.supabaseUrl, config.public.supabasePublishableKey)

  // Alias snake_case columns to camelCase so the result matches TenantRow
  const { data } = await supabase
    .from('landing_pages')
    .select(
      'id, clientId:client_id, domain, renderMode:render_mode, status, seoTitle:seo_title, seoDescription:seo_description, seoOgImage:seo_og_image, canonicalUrl:canonical_url, primaryColor:primary_color, secondaryColor:secondary_color, fontFamily:font_family, secondaryFontFamily:secondary_font_family, dividerGlyph:divider_glyph, backgroundType:background_type, backgroundColorToken:background_color_token, backgroundColorCustom:background_color_custom, backgroundGradientToToken:background_gradient_to_token, backgroundGradientToCustom:background_gradient_to_custom, backgroundImageUrl:background_image_url',
    )
    .eq('domain', domain)
    .eq('status', 'published')
    .maybeSingle()

  const row = data as TenantRow | null
  event.context.tenant = row ? { ...row, background: toBackground(row) } : null
})
