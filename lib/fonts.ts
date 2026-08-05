// Tenant fonts are a runtime value (`landing_pages.font_family`), but
// next/font/google needs static literals at build time — it self-hosts the files
// and generates the @font-face rules during the build. So the platform offers a
// curated set instead of an open text field: every family here is downloaded at
// build time, served from our own origin, and costs no third-party request.
//
// Adding a family is one entry below plus a redeploy. That is acceptable because
// tenants are onboarded by hand; an unknown name degrades to the system stack
// rather than breaking the page.

import { Inter, JetBrains_Mono, Merriweather, Montserrat, Poppins } from 'next/font/google'

const SYSTEM_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-merriweather',
})

// `font.variable` is the generated *class name* that declares the custom
// property, not the property itself — so the property name is tracked alongside.
const FONT_REGISTRY = {
  Montserrat: { font: montserrat, cssVariable: '--font-montserrat' },
  'JetBrains Mono': { font: jetbrainsMono, cssVariable: '--font-jetbrains-mono' },
  Inter: { font: inter, cssVariable: '--font-inter' },
  Poppins: { font: poppins, cssVariable: '--font-poppins' },
  Merriweather: { font: merriweather, cssVariable: '--font-merriweather' },
} as const

/** Every family's class must be on <html> for its CSS variable to exist there. */
export const fontVariableClassNames = Object.values(FONT_REGISTRY)
  .map((entry) => entry.font.variable)
  .join(' ')

/**
 * Maps a `landing_pages.font_family` value to the CSS `font-family` a tenant
 * variable should hold. Unknown or absent → the system stack.
 */
export function resolveFontFamily(name: string | null | undefined): string {
  if (!name) return SYSTEM_STACK

  const entry = FONT_REGISTRY[name as keyof typeof FONT_REGISTRY]
  return entry ? `var(${entry.cssVariable}), ${SYSTEM_STACK}` : SYSTEM_STACK
}
