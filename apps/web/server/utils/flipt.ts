import { ClientTokenAuthentication, FliptClient } from '@flipt-io/flipt'

let client: FliptClient | null = null

function getFliptClient(): FliptClient {
  if (!client) {
    const token = process.env.FLIPT_TOKEN
    client = new FliptClient({
      url: process.env.FLIPT_URL ?? 'http://localhost:8080',
      authenticationStrategy: token ? new ClientTokenAuthentication(token) : undefined,
    })
  }
  return client
}

/**
 * Evaluate a boolean feature flag. Fails open: if Flipt is unreachable or
 * misconfigured, the feature is treated as enabled so the app keeps working.
 */
export async function isFeatureEnabled(flagKey: string, entityId: string): Promise<boolean> {
  try {
    const result = await getFliptClient().evaluation.boolean({
      namespaceKey: 'default',
      flagKey,
      entityId,
      context: {},
    })
    return result.enabled
  } catch {
    return true
  }
}
