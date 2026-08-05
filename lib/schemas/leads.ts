// Runtime validation for the POST /api/leads body. Mirrors the `LeadInput`
// interface in lib/types/blocks.ts — that interface is the contract, this schema
// is the gate in front of it.
//
// Every string is length-capped. Rate limiting is deferred (ADR-0007), so these
// caps are the only thing standing between the endpoint and a multi-megabyte
// body; they are deliberately generous for humans and hostile to scripts.
//
// `intent` is only shape-checked here. Its allowed *values* come from the
// tenant's own cta-form block, which this module has no access to — the route
// handler owns that check.

import { z } from 'zod'

// Digits, spaces and the usual Brazilian punctuation. The insert stores whatever
// the visitor typed: normalising to E.164 would be a guess about country code,
// and a founder reading Studio can dial either form.
const WHATSAPP_PATTERN = /^[\d\s()+-]+$/

export const leadInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  whatsapp: z.string().trim().min(10).max(20).regex(WHATSAPP_PATTERN),
  // Zod 4 moved the email check to a top-level factory; `z.string().email()` is
  // deprecated.
  email: z.email().max(180).optional(),
  message: z.string().trim().max(2000).optional(),
  intent: z.string().max(80).optional(),
  // May be empty: whether an empty token is acceptable depends on how Turnstile
  // is configured, and lib/turnstile.ts is the single place that decides.
  turnstileToken: z.string().max(2048),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
})
