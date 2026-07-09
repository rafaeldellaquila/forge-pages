import type { LeadInput } from '@forge-pages/types'
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'
import sanitizeHtml from 'sanitize-html'

const strip = (value: string | undefined): string | undefined =>
  value ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }) : undefined

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const tenant = event.context.tenant

  if (!tenant) {
    throw createError({ statusCode: 404, statusMessage: 'Tenant not found' })
  }

  const body = await readBody<LeadInput>(event)

  // 1. Sanitize every string field — strip ALL HTML tags
  const sanitized = {
    name: strip(body.name) ?? '',
    whatsapp: strip(body.whatsapp) ?? '',
    email: strip(body.email),
    message: strip(body.message),
    intent: strip(body.intent),
  }

  // 2. Validate required fields
  if (!sanitized.name || !sanitized.whatsapp) {
    throw createError({ statusCode: 400, statusMessage: 'name and whatsapp are required' })
  }

  // 3. Turnstile verification — only when configured (keys arrive in Phase 5)
  if (config.turnstileSecretKey) {
    const verify = await $fetch<{ success: boolean }>(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: config.turnstileSecretKey,
          response: body.turnstileToken ?? '',
        }),
      },
    )
    if (!verify.success) {
      throw createError({ statusCode: 400, statusMessage: 'Bot verification failed' })
    }
  } else {
    console.warn('[leads] TURNSTILE_SECRET_KEY not set — skipping bot verification')
  }

  // 4. Rate limit via Upstash — only when configured (3 per IP per hour)
  if (config.upstashRedisRestUrl && config.upstashRedisRestToken) {
    const redis = new Redis({
      url: config.upstashRedisRestUrl,
      token: config.upstashRedisRestToken,
    })
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
    const key = `lead:${tenant.id}:${ip}`
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, 3600)
    }
    if (count > 3) {
      throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
    }
  } else {
    console.warn('[leads] UPSTASH_REDIS_REST_URL not set — skipping rate limit')
  }

  // 5. Insert lead (Supabase Database Webhook fires the notification Edge Function)
  const supabase = createClient(config.public.supabaseUrl, config.supabaseSecretKey)

  const { data, error } = await supabase
    .from('leads')
    .insert({
      landing_page_id: tenant.id,
      name: sanitized.name,
      whatsapp: sanitized.whatsapp,
      email: sanitized.email ?? null,
      message: sanitized.message ?? null,
      intent: sanitized.intent ?? null,
      utm_source: strip(body.utmSource) ?? null,
      utm_medium: strip(body.utmMedium) ?? null,
      utm_campaign: strip(body.utmCampaign) ?? null,
    })
    .select('id')
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to save lead' })
  }

  return { ok: true, leadId: data.id }
})
