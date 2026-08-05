import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import './globals.css'
import { resolveBackground, resolveBackgroundBaseColor } from '@/lib/background'
import { fontVariableClassNames, resolveFontFamily } from '@/lib/fonts'
import { getCurrentTenant } from '@/lib/tenant'

// Both this layout and app/page.tsx read the tenant through the request-scoped
// cache in lib/supabase.ts, so the extra call here costs no extra query.
// Reading headers() also makes the route dynamic, which is what keeps the
// Host-blind ISR cache key from serving one tenant's HTML to another
// (CLAUDE.md §4) — do not add `revalidate` here without solving that first.

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant()

  if (!tenant) return { title: 'forge-pages' }

  return {
    title: tenant.seoTitle ?? tenant.domain,
    description: tenant.seoDescription ?? undefined,
    alternates: tenant.canonicalUrl ? { canonical: tenant.canonicalUrl } : undefined,
    openGraph: {
      title: tenant.seoTitle ?? tenant.domain,
      description: tenant.seoDescription ?? undefined,
      images: tenant.seoOgImage ? [tenant.seoOgImage] : undefined,
    },
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant()
  const background = resolveBackground(tenant?.background)

  // Custom properties aren't part of CSSProperties, hence the cast.
  const tenantTheme = {
    '--tenant-primary': tenant?.primaryColor ?? undefined,
    '--tenant-secondary': tenant?.secondaryColor ?? undefined,
    '--tenant-background': tenant ? resolveBackgroundBaseColor(tenant.background) : undefined,
    '--tenant-font': tenant ? resolveFontFamily(tenant.fontFamily) : undefined,
    '--tenant-font-secondary': tenant
      ? resolveFontFamily(tenant.secondaryFontFamily ?? tenant.fontFamily)
      : undefined,
  } as CSSProperties

  return (
    <html lang="pt-BR" className={fontVariableClassNames} style={tenantTheme}>
      <body className={background.className} style={background.style}>
        {children}
      </body>
    </html>
  )
}
