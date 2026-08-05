// The one write path in the app. Server-only: it holds the secret key, which
// bypasses RLS, so nothing here may ever be imported from a Client Component
// (CLAUDE.md §9). The read path lives in lib/supabase.ts and uses the publishable
// key instead — the two clients are separate on purpose.
//
// `leads` grants INSERT to service_role only (20260805000000_revoke_anon_lead_
// insert.sql): the anon path was removed once every insert started coming through
// POST /api/leads, so a leaked publishable key cannot be used to skip Turnstile.

import { createClient } from '@supabase/supabase-js'
import type { LandingPageConfig, LeadInput } from '@/lib/types/blocks'

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SECRET_KEY must be set — see .env.example and docs/LOCAL_DEVELOPMENT.md §3.',
    )
  }

  return createClient(url, key, { auth: { persistSession: false } })
}

/**
 * Stores a lead against a landing page.
 *
 * `page` is the tenant row from the server-side Host resolution, never anything
 * the request body named — a client that could name its own landing page could
 * write leads into another tenant's inbox. Taking the row (rather than an id and
 * a domain as two arguments) is what keeps the pair from ever being assembled
 * from two different sources.
 *
 * `domain` is stored as provenance for whoever reads the table in Supabase
 * Studio; `landing_page_id` stays the ownership key.
 *
 * `status` is left to the column default ('new').
 */
export async function insertLead(
  page: Pick<LandingPageConfig, 'id' | 'domain'>,
  input: LeadInput,
): Promise<void> {
  const { error } = await getSupabaseAdminClient()
    .from('leads')
    .insert({
      landing_page_id: page.id,
      domain: page.domain,
      name: input.name,
      whatsapp: input.whatsapp,
      email: input.email ?? null,
      message: input.message ?? null,
      intent: input.intent ?? null,
      utm_source: input.utmSource ?? null,
      utm_medium: input.utmMedium ?? null,
      utm_campaign: input.utmCampaign ?? null,
    })

  // The message is Postgres', not the visitor's — safe to surface. The row is
  // not: it is all PII (rules/data-privacy.md).
  if (error) throw new Error(`Failed to insert lead: ${error.message}`)
}
