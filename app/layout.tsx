import type { Metadata } from 'next'
import type { CSSProperties } from 'react'
import './globals.css'
import { FloatingWhatsapp } from '@/components/FloatingWhatsapp'
import { resolveBackground, resolveBackgroundBaseColor } from '@/lib/background'
import { fontVariableClassNames, resolveFontFamily } from '@/lib/fonts'
import { getCurrentTenant } from '@/lib/tenant'
import { resolveNeutralTheme } from '@/lib/theme'

// Both this layout and app/page.tsx read the tenant through the request-scoped
// cache in lib/supabase.ts, so the extra call here costs no extra query.
// Reading headers() also makes the route dynamic, which is what keeps the
// Host-blind ISR cache key from serving one tenant's HTML to another
// (CLAUDE.md §4) — do not add `revalidate` here without solving that first.

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant()

  if (!tenant) return { title: 'forge-pages' }

  // Without this, Next resolves relative icon/OG-image URLs against
  // http://localhost:PORT (its documented fallback when metadataBase is
  // unset) — silently wrong in production for the relative /public paths
  // this app already uses (e.g. header.logo.url).
  const metadataBase = new URL(`https://${tenant.domain}`)

  return {
    metadataBase,
    title: tenant.seoTitle ?? tenant.domain,
    description: tenant.seoDescription ?? undefined,
    alternates: tenant.canonicalUrl ? { canonical: tenant.canonicalUrl } : undefined,
    icons: tenant.faviconUrl ? { icon: tenant.faviconUrl } : undefined,
    openGraph: {
      title: tenant.seoTitle ?? tenant.domain,
      description: tenant.seoDescription ?? undefined,
      type: 'website',
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
    ...resolveNeutralTheme(tenant?.themeMode),
  } as CSSProperties

  return (
    <html lang="pt-BR" className={fontVariableClassNames} style={tenantTheme}>
      <body className={background.className} style={background.style}>
        {children}
        {tenant?.whatsappFloatEnabled && tenant.whatsappFloatNumber ? (
          <FloatingWhatsapp
            number={tenant.whatsappFloatNumber}
            message={tenant.whatsappFloatMessage}
          />
        ) : null}
      </body>
    </html>
  )
}
