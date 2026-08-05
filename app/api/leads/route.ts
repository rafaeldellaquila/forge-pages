// Lead capture endpoint. The whole point of this file is the trust boundary
// (ADR-0009): the client controls its own contact details and nothing else.
//
//   landing_page_id  ← server-side Host resolution, never the body
//   domain           ← the same resolved row, stored so the table is readable
//   intent           ← must be one of the tenant's own selectOptions
//   turnstileToken   ← verified against Cloudflare before anything is written
//
// Responses carry a generic message and no field echo: the body is entirely PII
// and error strings have a habit of ending up in logs (rules/data-privacy.md).

import { NextResponse } from 'next/server'
import { insertLead } from '@/lib/leads'
import { leadInputSchema } from '@/lib/schemas/leads'
import { getCurrentTenant } from '@/lib/tenant'
import { verifyTurnstile } from '@/lib/turnstile'
import type { BlockType } from '@/lib/types/blocks'

/**
 * The `intent` values this tenant actually offers.
 *
 * `flatMap` with an empty array for the other block types narrows the union by
 * control flow; `.filter()` would need a type predicate to get the same result.
 * A page with two cta-form blocks contributes both sets, which is correct — the
 * visitor could have submitted either one.
 */
function allowedIntents(blocks: BlockType[]): string[] {
  return blocks.flatMap((block) =>
    block.type === 'cta-form' ? block.selectOptions.map((option) => option.value) : [],
  )
}

export async function POST(request: Request) {
  const tenant = await getCurrentTenant()
  if (!tenant) {
    return NextResponse.json({ error: 'Unknown tenant' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const parsed = leadInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const lead = parsed.data

  if (lead.intent && !allowedIntents(tenant.blocks).includes(lead.intent)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  // CF-Connecting-IP is set by Cloudflare in front of the Worker; absent on
  // `next dev`, where siteverify is happy without a remoteip.
  const verified = await verifyTurnstile(
    lead.turnstileToken,
    request.headers.get('CF-Connecting-IP'),
  )
  if (!verified) {
    return NextResponse.json({ error: 'Bot check failed' }, { status: 403 })
  }

  // Deliberately not wrapped: a failed insert is a lost lead, the worst outcome
  // this app has, and the Postgres message is the only clue to why. Throwing puts
  // it in the platform log and returns a 500; catching it here to shape a tidier
  // JSON body would trade that clue for nothing the client can use.
  await insertLead(tenant, lead)

  return NextResponse.json({ ok: true }, { status: 201 })
}
