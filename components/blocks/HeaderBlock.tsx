import { CtaButton } from '@/components/blocks/shared/CtaButton'
import { MobileMenu } from '@/components/blocks/shared/MobileMenu'
import { HEADER_BACKGROUND_FALLBACK, resolveBackground } from '@/lib/background'
import type { HeaderBlock as HeaderBlockProps } from '@/lib/types/blocks'
import { buildWhatsappLink } from '@/lib/whatsapp'

/** WhatsApp deep link, or the plain link when no number is configured. */
function resolveCtaHref({
  ctaWhatsapp,
  ctaMessage,
  ctaLink,
}: Pick<HeaderBlockProps, 'ctaWhatsapp' | 'ctaMessage' | 'ctaLink'>) {
  if (ctaWhatsapp) return buildWhatsappLink(ctaWhatsapp, ctaMessage)
  return ctaLink ?? '#contato'
}

export function HeaderBlock({
  variant = 'default',
  background,
  logo,
  menuLinks,
  ctaLabel,
  ctaWhatsapp,
  ctaMessage,
  ctaLink,
}: HeaderBlockProps) {
  // Unlike every other block, an unset background falls back to a surface rather
  // than transparent — a sticky header over scrolling content must stay legible.
  const resolved = resolveBackground(background ?? HEADER_BACKGROUND_FALLBACK)
  const ctaHref = resolveCtaHref({ ctaWhatsapp, ctaMessage, ctaLink })

  return (
    <header
      style={resolved.style}
      className={`border-surface-line fixed top-0 right-0 left-0 z-50 flex items-center border-b px-[6vw] py-4 ${resolved.className} ${
        variant === 'centered' ? 'justify-center gap-10' : 'justify-between'
      }`}
    >
      <a href="#hero" className="flex items-center gap-2.5">
        {logo ? (
          // biome-ignore lint/performance/noImgElement: SVG logo, no optimisation to gain
          <img
            src={logo.url}
            alt={logo.alternativeText ?? ''}
            className="h-8 w-auto object-contain"
          />
        ) : null}
      </a>

      <nav className="hidden items-center gap-8 lg:flex">
        {menuLinks.map((link) => (
          <a
            key={link.url}
            href={link.url}
            className="font-tenant-secondary text-ink-dim hover:text-tenant-primary text-[0.82rem] tracking-[0.04em] uppercase no-underline transition-colors"
          >
            {link.label}
          </a>
        ))}
      </nav>

      <div className="hidden lg:block">
        <CtaButton href={ctaHref} label={ctaLabel} size="sm" />
      </div>

      <MobileMenu links={menuLinks} ctaLabel={ctaLabel} ctaHref={ctaHref} />
    </header>
  )
}
