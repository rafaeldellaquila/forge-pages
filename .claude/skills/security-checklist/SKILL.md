# Skill: Security Checklist

Use this skill before completing any feature that involves:
- A new server route or API endpoint
- A new form or user input
- A new database table or column
- A new external service integration

Run through this checklist item by item. Do not mark a feature complete until all applicable items pass.

---

## Input security

- [ ] **All user-supplied strings pass through `sanitize-html`** with `allowedTags: []`
  - Applied in server route, not client-side
  - Both direct fields (`body.name`) and nested objects (`body.items[].text`)
  - Exception: fields that are URLs — use `new URL(value)` validation instead

- [ ] **No `body.*` inserted directly into Supabase**
  - Always go through the sanitized variable
  - Pattern: `const clean = { name: sanitize(body.name) ?? '' }`

- [ ] **Required fields validated before DB insert**
  - Missing required field → 400, not 500

---

## Authentication and authorization

- [ ] **Tenant verified** for any public-facing route
  - `event.context.tenant` must not be null
  - Missing tenant → 404 (not 403, to avoid information leakage)

- [ ] **Service role key used in server routes** (not anon)
  - `config.supabaseServiceRoleKey` in `createClient()`
  - Anon key only in client-side Supabase calls (e.g. public read)

- [ ] **Admin/internal routes protected** with server-side token check
  - Not just by obscurity — must verify a secret header or session

---

## Rate limiting

- [ ] **Upstash Redis rate limit applied** to any route accepting user input
  - Key format: `<action>:<tenant_id>:<ip>`
  - Public forms: 3 per IP per hour
  - Adjust limit based on risk (lower for sensitive, higher for low-risk)
  - Returns 429 with no body on limit exceeded

---

## Bot protection

- [ ] **Cloudflare Turnstile verified** on all public-facing forms
  - Verified server-side — never trust client-side result
  - Invalid token → 400
  - Test key for dev: `1x00000000000000000000AA`
  - Remove test key before deploying to production

---

## Database security

- [ ] **RLS enabled** on any new table
  - Check in Supabase dashboard: Authentication → Policies
  - Table with RLS but no policies = no access for anyone (good default)

- [ ] **RLS policies match intended access pattern**
  - Public read: `for select to anon using (status = 'published')`
  - Public insert: `for insert to anon with check (true)`
  - Internal only: `to service_role using (true) with check (true)`

- [ ] **No service_role key exposed** in client-side code or public runtime config
  - Check `nuxt.config.ts`: service role key must NOT be under `runtimeConfig.public`

---

## Error handling

- [ ] **Database errors caught** and logged to Sentry — not returned to client
  ```ts
  if (error) {
    Sentry.captureException(error)
    throw createError({ statusCode: 500, message: 'Internal server error' })
  }
  ```

- [ ] **No stack traces or internal errors** returned in API responses
  - Generic message to client, full error to Sentry

- [ ] **No `console.log`** with sensitive data
  - Use Sentry for error tracking
  - Biome will warn on `console.log` — fix it, don't suppress

---

## Secrets

- [ ] **No secrets in code** — all from `useRuntimeConfig()` or env
  - Biome enforces `noSecretInSource` — check it passes
  - Run `mise run lint` to verify

- [ ] **`.env.example` updated** if a new env variable was added
  - Key added with empty value and comment explaining where to get it

---

## CORS

- [ ] **Strapi CORS** still restricted to Nuxt origin after any Strapi change
  - Check `apps/cms/config/middlewares.ts`

- [ ] **No wildcard origins** (`*`) in production config

---

## After completing the checklist

Run:
```bash
mise run lint       # Biome: catches noSecretInSource, noConsole
mise run typecheck  # TypeScript: catches missing types, any usage
```

Both must pass with 0 errors.
