import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'forge-pages',
  description: 'Multi-tenant landing page platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
