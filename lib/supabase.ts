// Tenant resolution. `middleware.ts` puts the request's Host on `x-tenant-host`;
// everything downstream reads the row through getLandingPageByHost(), which is
// wrapped in React `cache()` so the layout and the page share one query per
// request (ADR-0008).
//
// Reads use the *publishable* key: RLS already restricts `anon` to
// `status = 'published'` on landing_pages (20240101000002_enable_rls.sql), so the
// secret key would be privilege we don't need. The secret key stays server-only
// and is reserved for writes (lead insert).

import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { backgroundColumnSchema, parseBlocks } from '@/lib/schemas/blocks'
import type { Background, LandingPageConfig } from '@/lib/types/blocks'

const LANDING_PAGE_COLUMNS = `
  id, client_id, domain, render_mode, status,
  seo_title, seo_description, seo_og_image, canonical_url,
  primary_color, secondary_color, font_family, secondary_font_family, theme_mode,
  background_type, background_color_token, background_color_custom,
  background_gradient_to_token, background_gradient_to_custom, background_image_url,
  divider_glyph, blocks
`

interface LandingPageRow {
  id: string
  client_id: string
  domain: string
  render_mode: string
  status: string
  seo_title: string | null
  seo_description: string | null
  seo_og_image: string | null
  canonical_url: string | null
  primary_color: string | null
  secondary_color: string | null
  font_family: string | null
  secondary_font_family: string | null
  theme_mode: string
  background_type: string | null
  background_color_token: string | null
  background_color_custom: string | null
  background_gradient_to_token: string | null
  background_gradient_to_custom: string | null
  background_image_url: string | null
  divider_glyph: string | null
  blocks: unknown
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set — see .env.example and docs/LOCAL_DEVELOPMENT.md §3.',
    )
  }

  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * PostgREST can't alias flat columns into nested JSON in a `select()` string
 * (ADR-0005), so the page-level background is assembled here. The columns are
 * free text, so the result goes through the same schema the block-level
 * backgrounds use; a typo degrades to "no background" rather than to invalid CSS.
 */
function toBackground(row: LandingPageRow): Background | null {
  if (!row.background_type) return null

  const result = backgroundColumnSchema.safeParse({
    type: row.background_type,
    colorToken: row.background_color_token ?? undefined,
    customColor: row.background_color_custom ?? undefined,
    gradientToToken: row.background_gradient_to_token ?? undefined,
    gradientToCustom: row.background_gradient_to_custom ?? undefined,
    image: row.background_image_url ? { url: row.background_image_url } : undefined,
  })

  return result.success ? result.data : null
}

/**
 * The published landing page for a host, or `null` when no tenant owns it.
 *
 * Memoised per request: `app/layout.tsx` needs it for theming and metadata and
 * `app/page.tsx` needs it for the blocks, and they must not hit the database
 * twice for the same row.
 */
export const getLandingPageByHost = cache(
  async (host: string): Promise<LandingPageConfig | null> => {
    if (!host) return null

    const { data, error } = await getSupabaseClient()
      .from('landing_pages')
      .select(LANDING_PAGE_COLUMNS)
      .eq('domain', host)
      .eq('status', 'published')
      .maybeSingle<LandingPageRow>()

    if (error) throw new Error(`Failed to load tenant "${host}": ${error.message}`)
    if (!data) return null

    return {
      id: data.id,
      clientId: data.client_id,
      domain: data.domain,
      renderMode: data.render_mode === 'custom' ? 'custom' : 'blocks',
      status: 'published',
      seoTitle: data.seo_title,
      seoDescription: data.seo_description,
      seoOgImage: data.seo_og_image,
      canonicalUrl: data.canonical_url,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      fontFamily: data.font_family,
      secondaryFontFamily: data.secondary_font_family,
      themeMode: data.theme_mode === 'light' ? 'light' : 'dark',
      background: toBackground(data),
      dividerGlyph: data.divider_glyph,
      blocks: parseBlocks(data.blocks, data.domain),
    }
  },
)
