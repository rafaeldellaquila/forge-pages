# Phase 5 — Integrations

> **Before starting**: Read `CLAUDE.md` in full. Phases 1–4 must be complete and validated.
> **Commit strategy**: Ask before every commit. Use Conventional Commits.
> **Scope**: Wiring all external services into the running app. No new features.

---

## Objective

Connect all external services defined in CLAUDE.md: PostHog (analytics), Sentry (error tracking), Flipt (feature flags), Domainee (custom domains / SSL), and UptimeRobot (monitoring). By the end of this phase the platform is production-ready from an observability and operations standpoint.

---

## Tasks — execute in this exact order

### 1. PostHog — analytics and conversion funnel

PostHog tracks page views, form interactions, and lead conversions per tenant.

Install:
```bash
pnpm --filter web add posthog-js
```

Create `apps/web/plugins/posthog.client.ts`:
```ts
import posthog from 'posthog-js'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const tenant = useRequestEvent()?.context.tenant

  if (!config.public.posthogKey) return

  posthog.init(config.public.posthogKey, {
    api_host: config.public.posthogHost ?? 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // manual control below
    loaded: (ph) => {
      // Identify the tenant (landing page) for segmentation
      if (tenant?.id) {
        ph.group('landing_page', tenant.id, {
          domain: tenant.domain,
        })
      }
    },
  })

  const router = useRouter()
  router.afterEach((to) => {
    posthog.capture('$pageview', { path: to.fullPath })
  })

  return {
    provide: {
      posthog,
    },
  }
})
```

Create `apps/web/composables/useTracking.ts`:
```ts
export function useTracking() {
  const { $posthog } = useNuxtApp()

  return {
    trackFormView: () => {
      $posthog?.capture('lead_form_viewed')
    },
    trackFormSubmit: (intent?: string) => {
      $posthog?.capture('lead_form_submitted', { intent })
    },
    trackFormSuccess: (leadId: string) => {
      $posthog?.capture('lead_form_success', { lead_id: leadId })
    },
    trackFormError: (error: string) => {
      $posthog?.capture('lead_form_error', { error })
    },
  }
}
```

Add tracking calls to `CtaFormBlock.vue` in packages/ui:
- `trackFormView()` on component mount
- `trackFormSubmit(intent)` on form submit
- `trackFormSuccess(leadId)` on success response
- `trackFormError(error)` on error response

---

### 2. Sentry — error tracking

Sentry is already configured via `@nuxtjs/sentry` module in Phase 4. Validate it works:

1. Add a temporary `throw new Error('Sentry test')` in `apps/web/pages/index.vue`
2. Start dev server and visit any page
3. Confirm error appears in Sentry dashboard
4. Remove the test throw

For Strapi, Sentry middleware was added in Phase 3. Validate:
1. Start Strapi
2. Hit an invalid API endpoint
3. Confirm error in Sentry

Configure source maps upload for production (in `apps/web/nuxt.config.ts`):
```ts
sentry: {
  dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
  sourceMapsUploadOptions: {
    org: 'forge-co-tech',
    project: 'forge-pages',
    authToken: process.env.SENTRY_AUTH_TOKEN,
  },
},
```

---

### 3. Flipt — feature flags

#### 3a. Deploy Flipt on Koyeb

Flipt runs as a separate service on Koyeb alongside Strapi.

Create `infra/flipt/feature-flags.yaml`:
```yaml
version: "1.1"
namespace: default

flags:
  - key: blocks.services-tabs
    name: "Services Block — Tabs Variant"
    description: "Enable the tabs variant of the services block"
    enabled: true
    type: BOOLEAN_FLAG_TYPE

  - key: notifications.whatsapp
    name: "WhatsApp Notifications"
    description: "Enable WhatsApp lead notifications via Cloud API"
    enabled: true
    type: BOOLEAN_FLAG_TYPE

  - key: notifications.email
    name: "Email Notifications"
    description: "Enable email lead notifications via Resend"
    enabled: true
    type: BOOLEAN_FLAG_TYPE

  - key: analytics.posthog
    name: "PostHog Analytics"
    description: "Enable PostHog page tracking and funnel analytics"
    enabled: true
    type: BOOLEAN_FLAG_TYPE

  - key: cache.isr
    name: "ISR Page Cache"
    description: "Enable ISR caching for landing pages (1 hour TTL)"
    enabled: true
    type: BOOLEAN_FLAG_TYPE
```

#### 3b. Flipt SDK in Nuxt

Install:
```bash
pnpm --filter web add @flipt-io/flipt
```

Create `apps/web/server/utils/flipt.ts`:
```ts
import { FliptClient } from '@flipt-io/flipt'

let client: FliptClient | null = null

export function getFliptClient(): FliptClient {
  if (!client) {
    client = new FliptClient({
      url: process.env.FLIPT_URL ?? 'http://localhost:8080',
      authentication: {
        clientToken: process.env.FLIPT_TOKEN,
      },
    })
  }
  return client
}

export async function isFeatureEnabled(
  flagKey: string,
  entityId: string,
): Promise<boolean> {
  try {
    const flipt = getFliptClient()
    const result = await flipt.evaluation.boolean({
      flagKey,
      entityId,
      context: {},
    })
    return result.enabled
  } catch {
    // Fail open — if Flipt is unreachable, features are enabled
    return true
  }
}
```

Use in `apps/web/server/api/leads.post.ts` to gate WhatsApp/email:
```ts
// Inside the lead submission handler, after insert:
const [emailEnabled, whatsappEnabled] = await Promise.all([
  isFeatureEnabled('notifications.email', tenant.id),
  isFeatureEnabled('notifications.whatsapp', tenant.id),
])
// Pass these as context to the Edge Function if needed
// (currently the Edge Function reads its own config, but flags allow per-tenant control)
```

---

### 4. Domainee — custom domain SSL

Domainee handles SSL certificate provisioning for each client's custom domain.

Create `apps/web/server/utils/domainee.ts`:
```ts
interface DomaineeRegisterResponse {
  id: string
  domain: string
  status: 'pending' | 'active' | 'error'
}

export async function registerDomain(domain: string): Promise<DomaineeRegisterResponse> {
  const res = await fetch('https://api.domainee.io/v1/domains', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DOMAINEE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ domain }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Domainee error: ${error}`)
  }

  return res.json() as Promise<DomaineeRegisterResponse>
}

export async function removeDomain(domain: string): Promise<void> {
  const res = await fetch(`https://api.domainee.io/v1/domains/${domain}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${process.env.DOMAINEE_API_KEY}`,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Domainee remove error: ${error}`)
  }
}
```

Create an internal admin endpoint to register new domains (not exposed publicly):
`apps/web/server/api/admin/domains.post.ts` — protected by a server-side admin token check.

**Important**: This endpoint is called manually by the team when onboarding a new client, not automatically.

---

### 5. UptimeRobot — monitoring

Configure monitoring for all critical endpoints. This is done in the UptimeRobot dashboard (free tier, no code required):

| Monitor name | URL | Type | Interval |
|---|---|---|---|
| forge-pages web | `https://<your-domain>/api/health` | HTTP(s) | 5 min |
| Strapi CMS | `https://<strapi-domain>/admin` | HTTP(s) | 5 min |
| Supabase | `https://<project>.supabase.co/rest/v1/` | HTTP(s) | 5 min |
| NocoDB | `https://<nocodb-url>` | HTTP(s) | 5 min |

Alert contacts: add the team email and optionally a Telegram bot.

Document the monitor IDs and alert contacts in this file once configured.

---

### 6. NocoDB — lead management for partners

NocoDB is self-hosted (can run on the same Koyeb instance as Strapi or separately). It connects directly to the Supabase Postgres database.

Connection string for NocoDB:
```
postgresql://postgres:<password>@<host>:5432/postgres
```

Configuration steps (done manually in NocoDB UI):
1. Connect to Supabase Postgres
2. Create a "Team" workspace for the partners
3. Add the `leads` table as a view with these columns visible:
   - `created_at`, `name`, `whatsapp`, `email`, `intent`, `status`, `utm_source`, `utm_campaign`
4. Hide: `id`, `landing_page_id` (too technical for partners)
5. Create a "Gallery" view filtered by `status = new` for the daily dashboard
6. Set up read/write permissions: partners can update `status` only

---

### 7. Cloudflare Turnstile — validate production key

In Phase 4, the test key was used (`1x00000000000000000000AA`). For production:

1. Go to [Cloudflare Turnstile dashboard](https://dash.cloudflare.com)
2. Add a new site widget
3. Add all client domains + your platform domain as allowed hostnames
4. Copy Site Key → `NUXT_PUBLIC_TURNSTILE_SITE_KEY`
5. Copy Secret Key → `TURNSTILE_SECRET_KEY`
6. Set `mode: managed` (invisible unless suspicious)

---

### 8. Upstash Redis — validate rate limiting

Validate rate limiting works end-to-end:

1. Submit the lead form 3 times in quick succession
2. 4th submission should return 429
3. Check Upstash dashboard — confirm key exists with TTL ~3600s

---

## Validation checklist before closing Phase 5

- [ ] PostHog: `lead_form_viewed`, `lead_form_submitted`, `lead_form_success` events appear in PostHog Live Events
- [ ] PostHog: Page view captured on navigation
- [ ] PostHog: Landing page group set correctly in PostHog
- [ ] Sentry: Test error captured in Sentry dashboard
- [ ] Sentry: No false positives (normal requests not showing as errors)
- [ ] Flipt: `isFeatureEnabled('notifications.email', <id>)` returns `true` locally
- [ ] Flipt: `feature-flags.yaml` committed and version controlled
- [ ] Domainee: `registerDomain` function tested with a real client domain
- [ ] UptimeRobot: All 4 monitors configured and showing green
- [ ] NocoDB: Partners can log in and see leads from the seed data
- [ ] NocoDB: Partners can update lead `status` but cannot delete records
- [ ] Turnstile: Production key set, test key removed from production config
- [ ] Upstash: Rate limiting tested (429 after 3 submissions)
- [ ] `mise run typecheck` passes
- [ ] `mise run lint` passes

---

## Commit at the end of Phase 5

Ask for confirmation:
```bash
git add .
git commit -m "feat(integrations): connect PostHog, Sentry, Flipt, Domainee, UptimeRobot

- PostHog: pageview + lead form funnel tracking (viewed/submitted/success/error)
- Sentry: source maps configured for production, validated in dashboard
- Flipt: feature flags for notifications and blocks, fail-open on unreachable
- Domainee: registerDomain and removeDomain utils for client onboarding
- NocoDB: configured for partner lead management (status-only write access)
- Turnstile: production site key, all client domains allowlisted
- Upstash: rate limit validated (3 submissions/IP/hour → 429)"

git push origin main
```

---

## Update CLAUDE.md

Mark Phase 5 as complete in section 14.

---

## Next step

```
docs/prompts/PHASE_6_CICD.md
```
