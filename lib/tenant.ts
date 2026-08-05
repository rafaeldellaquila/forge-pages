// Request-context layer: turns the header middleware.ts injected into the tenant
// row. Kept apart from lib/supabase.ts so the data access stays independent of
// Next's request scope.

import { headers } from 'next/headers'
import { getLandingPageByHost } from '@/lib/supabase'

/** The tenant owning the current request, or `null` if no published page claims the host. */
export async function getCurrentTenant() {
  const headersList = await headers()
  return getLandingPageByHost(headersList.get('x-tenant-host') ?? '')
}
