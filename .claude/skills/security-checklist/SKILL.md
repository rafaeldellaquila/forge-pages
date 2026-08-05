# Skill: Security Checklist

Use this skill before completing any feature that involves:
- A new route handler or API endpoint
- A new form or user input
- A new database table or column
- A new external service integration

Run through this checklist item by item. Do not mark a feature complete until all applicable items pass.

---

## Input validation

- [ ] **Every request body / search param is parsed with a Zod schema** before use
  - Parse at the server boundary (route handler / Server Action), not in the client
  - Use `safeParse` and return **400** on failure — never let a bad shape reach the DB
  - Schemas live next to the contract they validate (`lib/schemas/`)

- [ ] **No raw request object inserted into Supabase**
  - Insert the parsed result, not the original body: `const { data } = schema.safeParse(body)`
  - Zod strips unknown keys by default — rely on that instead of hand-picking fields

- [ ] **Strings that end up in HTML are rendered as text, not markup**
  - React escapes interpolated values automatically; the risk is only
    `dangerouslySetInnerHTML` — do not introduce it for user-supplied content
  - URL fields: validate with `z.string().url()` (or `new URL(value)`), and constrain the
    protocol if the value becomes an `href`

---

## Authentication and authorization

- [ ] **Tenant resolved and verified** for any public-facing route
  - The tenant comes from the `Host` header via `middleware.ts` — never from a client-supplied
    body field or query param
  - Unknown tenant → **404** (not 403, to avoid information leakage)

- [ ] **Secret key used server-side only**
  - `SUPABASE_SECRET_KEY` (`sb_secret_...`) in route handlers / Server Components only
  - The publishable key is the only one that may reach the browser
  - Never behind a `NEXT_PUBLIC_*` name — that prefix inlines the value into the client bundle

- [ ] **Admin/internal routes protected** with a server-side check
  - Not just by obscurity — verify a secret header or session

---

## Bot protection

- [ ] **Cloudflare Turnstile verified** on all public-facing forms
  - Verified server-side via `siteverify` — never trust the client-side result
  - Invalid or missing token → 400
  - Dev/test pair (always passes): site `1x00000000000000000000AA`,
    secret `1x0000000000000000000000000000000AA` — must not reach production

---

## Rate limiting — known gap

Rate limiting is **deferred** in the MVP (ADR-0007): Turnstile is the only throttle on
`POST /api/leads`.

- [ ] Do **not** block a feature on this, but do **flag it** if the change increases exposure
  (a new public endpoint, a form that triggers cost, anything enumerable).
- [ ] It must be revisited before any **paid-traffic launch**. When it comes back, the shape
  is per-action + per-tenant + per-IP keys, 429 on limit exceeded.

---

## Database security

- [ ] **RLS enabled** on any new table
  - Verify in Supabase Studio: Authentication → Policies
  - Table with RLS but no policies = no access for anyone (good default)

- [ ] **RLS policies match intended access pattern**
  - Public read: `for select to anon using (status = 'published')`
  - Public insert: `for insert to anon with check (true)`
  - Internal only: `to service_role using (true) with check (true)`

- [ ] **Grants exist, not just policies** — Supabase does not auto-grant DML on new tables;
  a policy without a `grant` still fails with `permission denied`

- [ ] **No secret key (`sb_secret_...`) exposed** in client-side code
  - Grep the change for `NEXT_PUBLIC_` next to anything secret
  - Legacy anon/service_role JWT keys are not used in this project at all

---

## Error handling

- [ ] **Database errors caught** and not returned to the client
  - Generic message + appropriate status to the caller; the detail stays server-side
  - There is no error-tracking service in the MVP — server logs are the only trail, so make
    the server-side message specific enough to debug from logs alone

- [ ] **No stack traces or internal errors** in API responses

- [ ] **No `console.log`** with sensitive data or PII
  - Biome warns on `console` — fix it, don't suppress

---

## Secrets

- [ ] **No secrets in code** — all from `process.env`
  - Biome enforces `security/noSecrets` — check it passes
  - Run `mise run lint` to verify

- [ ] **`.env.example` updated** if a new env variable was added
  - Key added with an empty value and a comment explaining where to get it
  - Also update the matrix in `docs/SECRETS.md`, and `.github/SETUP.md` if CI consumes it

---

## After completing the checklist

Run:
```bash
mise run lint       # Biome: catches security/noSecrets, noConsole, noExplicitAny
mise run typecheck  # TypeScript: catches missing types, any usage
```

Both must pass with 0 errors.
