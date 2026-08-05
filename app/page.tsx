import { notFound } from 'next/navigation'
import { BlockRenderer } from '@/components/blocks/BlockRenderer'
import { getCurrentTenant } from '@/lib/tenant'

export default async function TenantPage() {
  const tenant = await getCurrentTenant()

  // No published landing page claims this host.
  if (!tenant) notFound()

  return <BlockRenderer blocks={tenant.blocks} dividerGlyph={tenant.dividerGlyph} />
}
