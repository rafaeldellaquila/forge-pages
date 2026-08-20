import { buildWhatsappLink } from '@/lib/whatsapp'

interface FloatingWhatsappProps {
  number: string
  message?: string | null
}

/**
 * Fixed, always-visible contact button. Unlike a block, it has no anchorId
 * and doesn't sit in the content flow — page chrome, not content (ADR-0012).
 */
export function FloatingWhatsapp({ number, message }: FloatingWhatsappProps) {
  return (
    <a
      href={buildWhatsappLink(number, message ?? undefined)}
      aria-label="WhatsApp"
      // WhatsApp's own brand green, not a tenant color — this button represents
      // the WhatsApp platform (every reference site kept it this color
      // regardless of tenant branding), so ADR-0002 rule 4 doesn't apply here.
      className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[1.6rem] text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      <span aria-hidden="true">💬</span>
      <span className="sr-only">WhatsApp</span>
    </a>
  )
}
