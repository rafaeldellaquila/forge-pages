import { isFeatureEnabled } from '../utils/flipt'

export default defineEventHandler(async (event) => {
  const tenant = event.context.tenant
  const entityId = tenant?.id ?? 'anonymous'

  const [analyticsPosthog, servicesTabs] = await Promise.all([
    isFeatureEnabled('analytics.posthog', entityId),
    isFeatureEnabled('blocks.services-tabs', entityId),
  ])

  return { analyticsPosthog, servicesTabs }
})
