import type { BlockType } from '@forge-pages/types'

interface StrapiListResponse {
  data?: Array<{ blocks?: BlockType[] }>
}

export default defineEventHandler(async (event): Promise<{ blocks: BlockType[] }> => {
  const tenant = event.context.tenant
  if (!tenant) {
    return { blocks: [] }
  }

  const config = useRuntimeConfig()

  const res = await $fetch<StrapiListResponse>(`${config.strapiUrl}/api/landing-pages`, {
    query: {
      'filters[domain][$eq]': tenant.domain,
      'populate[blocks][populate]': '*',
      status: 'published',
    },
    headers: { Authorization: `Bearer ${config.strapiApiToken}` },
  })

  return { blocks: res?.data?.[0]?.blocks ?? [] }
})
