import type { BlockType, LandingPageConfig } from '@forge-pages/types'
import { createClient } from '@supabase/supabase-js'

interface StrapiSingleResponse {
  data?: { blocks?: BlockType[] } | null
}

export default defineEventHandler(
  async (event): Promise<{ blocks: BlockType[]; tenant: LandingPageConfig }> => {
    const query = getQuery(event)
    const domain = typeof query.domain === 'string' ? query.domain.trim() : ''
    const documentId = typeof query.documentId === 'string' ? query.documentId.trim() : ''
    const status = query.status === 'draft' ? 'draft' : 'published'

    if (!domain || !documentId) {
      throw createError({ statusCode: 400, statusMessage: 'domain and documentId are required' })
    }

    const config = useRuntimeConfig()

    // No .eq('status','published') filter here (unlike blocks.get.ts) — a client's
    // Supabase tenant row can still be 'draft' pre-launch while content is previewed.
    const supabase = createClient(config.public.supabaseUrl, config.public.supabasePublishableKey)
    const { data: tenant } = await supabase
      .from('landing_pages')
      .select(
        'id, clientId:client_id, domain, renderMode:render_mode, status, seoTitle:seo_title, seoDescription:seo_description, seoOgImage:seo_og_image, canonicalUrl:canonical_url, primaryColor:primary_color, secondaryColor:secondary_color, fontFamily:font_family, secondaryFontFamily:secondary_font_family',
      )
      .eq('domain', domain)
      .maybeSingle()

    if (!tenant) {
      throw createError({ statusCode: 404, statusMessage: 'Tenant not found' })
    }

    // Fetch by documentId (stable across draft/published versions), not domain-filter —
    // an in-progress draft's `domain` field could differ from the last-published value.
    const res = await $fetch<StrapiSingleResponse>(
      `${config.strapiUrl}/api/landing-pages/${documentId}`,
      {
        query: { 'populate[blocks][populate]': '*', status },
        headers: { Authorization: `Bearer ${config.strapiApiToken}` },
      },
    )

    return { blocks: res?.data?.blocks ?? [], tenant: tenant as LandingPageConfig }
  },
)
