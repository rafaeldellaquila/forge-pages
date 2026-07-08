# Skill: Nuxt Server Route

Use this skill when asked to create a new Nuxt server route (`apps/web/server/api/`).
Before starting, read this file in full.

---

## File naming and HTTP method

```
apps/web/server/api/<resource>.<method>.ts
```

| Method | File suffix | Example |
|---|---|---|
| GET | `.get.ts` | `health.get.ts` |
| POST | `.post.ts` | `leads.post.ts` |
| PUT | `.put.ts` | `leads/[id].put.ts` |
| DELETE | `.delete.ts` | `leads/[id].delete.ts` |

---

## Route anatomy — required sections in order

Every non-trivial server route must have these sections in this order:

```ts
export default defineEventHandler(async (event) => {
  // 1. Tenant / auth check
  // 2. Parse and validate body (POST/PUT)
  // 3. Sanitize inputs
  // 4. Turnstile verification (public-facing forms only)
  // 5. Rate limit check (Upstash Redis)
  // 6. Business logic
  // 7. Return response
})
```

Never skip steps 3–5 for any route reachable by unauthenticated users.

---

## 1. Tenant check

All public routes must verify a tenant exists:

```ts
const tenant = event.context.tenant

if (!tenant) {
  throw createError({ statusCode: 404, message: 'Page not found' })
}
```

---

## 2. Body parsing

```ts
// Always type the expected shape
interface MyBody {
  name: string
  email?: string
}

const body = await readBody<MyBody>(event)
```

---

## 3. Sanitization (ALWAYS for user input)

```ts
import sanitizeHtml from 'sanitize-html'

// Strip ALL HTML — no exceptions for user-submitted content
const sanitize = (value: string | undefined): string | undefined =>
  value
    ? sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    : undefined

const clean = {
  name: sanitize(body.name) ?? '',
  email: sanitize(body.email),
}
```

Never insert raw `body.*` values into the database — always go through `sanitize()` first.

---

## 4. Turnstile verification (public forms only)

```ts
const config = useRuntimeConfig()

const turnstileRes = await fetch(
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

const { success } = await turnstileRes.json() as { success: boolean }

if (!success) {
  throw createError({ statusCode: 400, message: 'Bot verification failed' })
}
```

Skip Turnstile only for internal/admin routes that require an admin token.

---

## 5. Rate limiting (Upstash Redis)

```ts
import { Redis } from '@upstash/redis'

const config = useRuntimeConfig()
const redis = new Redis({
  url: config.upstashRedisRestUrl,
  token: config.upstashRedisRestToken,
})

const ip = getRequestIP(event) ?? 'unknown'
// Key format: <action>:<scope>:<ip>
const key = `lead:${tenant.id}:${ip}`
const count = await redis.incr(key)

if (count === 1) {
  await redis.expire(key, 3600) // 1 hour window
}

if (count > 3) {
  throw createError({ statusCode: 429, message: 'Too many requests' })
}
```

Adjust the limit (3) and window (3600) based on the action's risk level.

---

## 6. Supabase client in server routes

Always use `service_role` key server-side. Never use `anon` key in server routes:

```ts
import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()

const supabase = createClient(
  config.public.supabaseUrl,
  config.supabaseServiceRoleKey,   // NOT config.public.supabaseAnonKey
)
```

---

## 7. Error handling pattern

```ts
const { data, error } = await supabase.from('leads').insert({...}).select('id').single()

if (error) {
  // Log to Sentry (imported from @sentry/node)
  Sentry.captureException(error, { extra: { tenant: tenant.id } })
  throw createError({ statusCode: 500, message: 'Internal server error' })
}

return { ok: true, id: data.id }
```

Never expose database error messages to the client — only log them server-side.

---

## Runtime config access

```ts
const config = useRuntimeConfig()

// Private (server-side only):
config.strapiApiToken
config.supabaseServiceRoleKey
config.upstashRedisRestUrl
config.upstashRedisRestToken
config.turnstileSecretKey

// Public (safe to expose):
config.public.supabaseUrl
config.public.supabaseAnonKey
config.public.turnstileSiteKey
```

Never use `process.env` directly in Nuxt server routes — always use `useRuntimeConfig()`.

---

## Security checklist for every new route

- [ ] Tenant verified (if public-facing)
- [ ] Body parsed with explicit TypeScript type
- [ ] All string inputs passed through `sanitize()`
- [ ] Turnstile verified (if public form submission)
- [ ] Rate limit applied with appropriate limits
- [ ] Supabase `service_role` key used (never `anon`)
- [ ] Errors caught and logged to Sentry — not exposed to client
- [ ] Response type is minimal (don't leak internal IDs or schema details)

---

## What NOT to do

- Do not use `process.env.*` — use `useRuntimeConfig()`
- Do not use Supabase `anon` key in server routes
- Do not return database error messages to the client
- Do not insert `body.*` directly — always sanitize first
- Do not skip rate limiting on any route that accepts user input
- Do not `console.log` — use Sentry for errors, the route is silent on success
