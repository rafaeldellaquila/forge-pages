// Cloudflare's Turnstile script attaches itself to `window`. Only the three
// lifecycle calls LeadForm.tsx uses are declared — narrow beats complete here,
// and `any` is banned (CLAUDE.md §10).

interface TurnstileRenderOptions {
  sitekey: string
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'flexible' | 'compact'
  appearance?: 'always' | 'execute' | 'interaction-only'
}

interface TurnstileApi {
  render: (container: HTMLElement | string, options: TurnstileRenderOptions) => string | undefined
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}

interface Window {
  turnstile?: TurnstileApi
}
