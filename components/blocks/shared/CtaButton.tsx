const BASE =
  'font-tenant-secondary inline-flex items-center gap-2 rounded-sm text-[0.85rem] tracking-[0.03em] no-underline transition-transform duration-200 hover:-translate-y-0.5'

const TONES = {
  // Text sits on the tenant's own colours, so it uses the page background rather
  // than a literal dark/light value.
  primary:
    'bg-[linear-gradient(135deg,var(--tenant-primary),var(--tenant-secondary))] text-tenant-background font-bold shadow-[0_8px_24px_color-mix(in_srgb,var(--tenant-primary)_25%,transparent)]',
  ghost:
    'border border-surface-line text-ink-dim hover:border-tenant-primary hover:text-tenant-primary',
} as const

interface CtaButtonProps {
  href: string
  label: string
  tone?: keyof typeof TONES
  size?: 'sm' | 'md'
}

export function CtaButton({ href, label, tone = 'primary', size = 'md' }: CtaButtonProps) {
  const padding = size === 'sm' ? 'px-5 py-2.5' : 'px-7 py-4'

  return (
    <a href={href} className={`${BASE} ${TONES[tone]} ${padding}`}>
      {label}
    </a>
  )
}
