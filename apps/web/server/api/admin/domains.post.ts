import { registerDomain } from '../../utils/domainee'

// Internal endpoint — called manually by the team when onboarding a client.
// Guarded by a server-side admin token; not linked from any public UI.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = getHeader(event, 'x-admin-token')

  if (!config.adminApiToken || token !== config.adminApiToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<{ domain?: string }>(event)
  if (!body.domain) {
    throw createError({ statusCode: 400, statusMessage: 'domain is required' })
  }

  return await registerDomain(body.domain)
})
