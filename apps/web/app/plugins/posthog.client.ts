import type { LandingPageConfig } from '@forge-pages/types'
import posthog from 'posthog-js'

export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  const key = config.public.posthogKey
  if (!key) return {}

  // Gate analytics on the Flipt flag (fail-open → enabled if Flipt is unreachable)
  const flags = await $fetch<{ analyticsPosthog: boolean }>('/api/flags').catch(() => ({
    analyticsPosthog: true,
  }))
  if (!flags.analyticsPosthog) return {}

  posthog.init(key, {
    api_host: config.public.posthogHost || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    loaded: (ph) => {
      const tenant = useState<LandingPageConfig | null>('tenant').value
      if (tenant?.id) {
        ph.group('landing_page', tenant.id, { domain: tenant.domain })
      }
    },
  })

  const router = useRouter()
  router.afterEach((to) => {
    posthog.capture('$pageview', { path: to.fullPath })
  })

  return {
    provide: { posthog },
  }
})
