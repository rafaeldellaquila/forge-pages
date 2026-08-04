import { timingSafeEqual } from 'node:crypto'
import { Redis } from '@upstash/redis'

const PREVIEW_PATHS = new Set(['/preview', '/api/preview-blocks'])

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)
  if (!PREVIEW_PATHS.has(pathname)) {
    return
  }

  const config = useRuntimeConfig()
  if (!config.previewSecret) {
    throw createError({ statusCode: 404, statusMessage: 'Preview not configured' })
  }

  const query = getQuery(event)
  const secret = typeof query.secret === 'string' ? query.secret : ''
  if (!secret || !safeEqual(secret, config.previewSecret)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid preview secret' })
  }

  if (config.upstashRedisRestUrl && config.upstashRedisRestToken) {
    const redis = new Redis({
      url: config.upstashRedisRestUrl,
      token: config.upstashRedisRestToken,
    })
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
    const key = `preview:${ip}`
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, 3600)
    }
    if (count > 30) {
      throw createError({ statusCode: 429, statusMessage: 'Too many preview requests' })
    }
  } else {
    console.warn('[preview] UPSTASH_REDIS_REST_URL not set — skipping rate limit')
  }
})
