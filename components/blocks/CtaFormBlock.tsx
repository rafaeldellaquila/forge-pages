import { CtaButton } from '@/components/blocks/shared/CtaButton'
import { Section } from '@/components/blocks/shared/Section'
import type { CtaFormBlock as CtaFormBlockProps } from '@/lib/types/blocks'

/**
 * Fase 1 renders the closing CTA as a WhatsApp deep link — the same thing the
 * page it was ported from does. The lead form itself (fields, Turnstile widget,
 * POST /api/leads) is Fase 2; shipping input fields with no endpoint behind them
 * would drop real leads on the floor.
 */
export function CtaFormBlock({
  anchorId,
  headline,
  subheadline,
  ctaLabel,
  whatsappNumber,
  whatsappMessage,
}: CtaFormBlockProps) {
  const message = whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ''

  return (
    <Section id={anchorId} className="text-center">
      <h2 className="text-ink text-[clamp(2.2rem,4.5vw,3.4rem)]">{headline}</h2>

      {subheadline ? (
        <p className="text-ink-dim mx-auto mt-4 mb-10 max-w-[520px] text-[1.02rem]">
          {subheadline}
        </p>
      ) : null}

      <div className="flex justify-center">
        <CtaButton href={`https://wa.me/${whatsappNumber}${message}`} label={ctaLabel} />
      </div>
    </Section>
  )
}
