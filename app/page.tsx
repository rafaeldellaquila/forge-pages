import { headers } from 'next/headers'

export default async function Home() {
  const headersList = await headers()
  const tenantHost = headersList.get('x-tenant-host')

  return (
    <main>
      <h1>forge-pages</h1>
      <p>Tenant host: {tenantHost ?? 'unresolved'}</p>
    </main>
  )
}
