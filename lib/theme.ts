// Per-tenant neutral color ramp (ADR-0010). Unlike --tenant-primary/-secondary,
// which take any hex a tenant sets, the neutrals are a fixed pair rather than a
// free-text column — the same "small curated set" rationale as the font
// registry in lib/fonts.ts: an open field could produce unreadable contrast.
//
// globals.css's @theme block re-exports these as --color-surface/--color-ink/etc.,
// so components keep using ordinary utilities (bg-surface, text-ink) and never
// see theme_mode directly.

import type { CSSProperties } from 'react'

interface NeutralRamp {
  surface: string
  surfaceLine: string
  ink: string
  inkDim: string
  inkMuted: string
}

const DARK_RAMP: NeutralRamp = {
  surface: '#2b2116',
  surfaceLine: '#3d3123',
  ink: '#f3eadb',
  inkDim: '#c9bfac',
  inkMuted: '#9c9184',
}

const LIGHT_RAMP: NeutralRamp = {
  surface: '#f7f5f2',
  surfaceLine: '#e5e0d8',
  ink: '#1c1a17',
  inkDim: '#4a453d',
  inkMuted: '#776f62',
}

/** Maps a tenant's `theme_mode` to the CSS custom properties its neutral ramp needs. */
export function resolveNeutralTheme(themeMode: 'dark' | 'light' | undefined): CSSProperties {
  const ramp = themeMode === 'light' ? LIGHT_RAMP : DARK_RAMP

  return {
    '--tenant-surface': ramp.surface,
    '--tenant-surface-line': ramp.surfaceLine,
    '--tenant-ink': ramp.ink,
    '--tenant-ink-dim': ramp.inkDim,
    '--tenant-ink-muted': ramp.inkMuted,
  } as CSSProperties
}
