import { CtaButton } from '@/components/blocks/shared/CtaButton'
import { Eyebrow } from '@/components/blocks/shared/Eyebrow'
import { Section } from '@/components/blocks/shared/Section'
import type { PricingBlock as PricingBlockProps } from '@/lib/types/blocks'

export function PricingBlock({
  anchorId,
  eyebrow,
  headline,
  subheadline,
  plans,
  note,
}: PricingBlockProps) {
  return (
    <Section id={anchorId}>
      <div className="mb-16 max-w-[640px]">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-ink text-[clamp(2rem,3.6vw,2.9rem)]">{headline}</h2>
        {subheadline ? <p className="text-ink-dim mt-4 text-[1.02rem]">{subheadline}</p> : null}
      </div>

      <div className="grid items-stretch gap-8 lg:grid-cols-2">
        {plans.map((plan) => (
          <article
            key={plan.title}
            className={`bg-surface relative flex flex-col rounded-lg border p-9 ${
              plan.featured
                ? 'border-tenant-primary bg-[linear-gradient(180deg,color-mix(in_srgb,var(--tenant-primary)_7%,transparent),var(--color-surface)_30%)]'
                : 'border-surface-line'
            }`}
          >
            {plan.badge ? (
              <span className="font-tenant-secondary text-tenant-background absolute -top-3 left-9 rounded-full bg-[linear-gradient(135deg,var(--tenant-primary),var(--tenant-secondary))] px-3 py-1.5 text-[0.68rem] font-bold tracking-[0.06em] uppercase">
                {plan.badge}
              </span>
            ) : null}

            {plan.eyebrow ? (
              <div className="font-tenant-secondary text-tenant-primary mb-2.5 text-[0.72rem] tracking-[0.12em] uppercase">
                {plan.eyebrow}
              </div>
            ) : null}

            <h3 className="text-ink mb-2 text-[1.7rem]">{plan.title}</h3>
            {plan.description ? (
              <p className="text-ink-dim mb-7 text-[0.92rem]">{plan.description}</p>
            ) : null}

            <div className="font-tenant-secondary text-tenant-secondary mb-8 text-[2.1rem] font-bold">
              {plan.price}
            </div>

            <ul className="mb-8 flex grow list-none flex-col gap-3.5">
              {plan.features.map((feature) => (
                <li key={feature.text} className="text-ink-dim flex gap-3 text-[0.92rem]">
                  <span aria-hidden="true" className="text-tenant-primary shrink-0">
                    ✓
                  </span>
                  {feature.text}
                </li>
              ))}
            </ul>

            <CtaButton
              href={plan.ctaLink}
              label={plan.ctaLabel}
              tone={plan.featured ? 'primary' : 'ghost'}
            />
          </article>
        ))}
      </div>

      {note ? (
        <p className="font-tenant-secondary text-ink-muted mt-8 text-center text-[0.85rem]">
          {note}
        </p>
      ) : null}
    </Section>
  )
}
