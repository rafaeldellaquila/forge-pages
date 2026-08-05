import { LeadForm } from '@/components/blocks/shared/LeadForm'
import { Section } from '@/components/blocks/shared/Section'
import type { CtaFormBlock as CtaFormBlockProps } from '@/lib/types/blocks'

/**
 * The closing CTA: a real lead form posting to /api/leads.
 *
 * Stays a Server Component so the copy renders server-side — only the form
 * itself is a Client Component. `whatsappNumber` remains in use as the secondary
 * route for visitors who would rather just message; keeping it means a tenant
 * whose number is still a placeholder shows a visibly wrong link rather than
 * silently dead data.
 */
export function CtaFormBlock({
  anchorId,
  headline,
  subheadline,
  selectOptions,
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

      <LeadForm ctaLabel={ctaLabel} selectOptions={selectOptions} />

      <p className="font-tenant-secondary text-ink-muted mt-8 text-[0.8rem]">
        Prefere conversar direto?{' '}
        <a
          href={`https://wa.me/${whatsappNumber}${message}`}
          className="text-tenant-primary no-underline hover:underline"
        >
          Fale no WhatsApp
        </a>
      </p>
    </Section>
  )
}
