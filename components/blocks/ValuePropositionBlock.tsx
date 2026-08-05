import { Eyebrow } from '@/components/blocks/shared/Eyebrow'
import { Section } from '@/components/blocks/shared/Section'
import type { ValuePropositionBlock as ValuePropositionBlockProps } from '@/lib/types/blocks'

export function ValuePropositionBlock({
  anchorId,
  eyebrow,
  headline,
  text,
  cards,
}: ValuePropositionBlockProps) {
  return (
    <Section id={anchorId}>
      <div className="mb-16 max-w-[640px]">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-ink text-[clamp(2rem,3.6vw,2.9rem)]">{headline}</h2>
        {text ? <p className="text-ink-dim mt-4 text-[1.02rem]">{text}</p> : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.title}
            className="bg-surface border-surface-line hover:border-tenant-primary rounded-md border px-6 pt-7 pb-8 transition-colors duration-300"
          >
            {card.stepLabel ? (
              <span className="font-tenant-secondary text-ink-muted text-[0.75rem] tracking-[0.08em]">
                {card.stepLabel}
              </span>
            ) : null}
            <span aria-hidden="true" className="mt-3.5 mb-3 block text-[1.8rem]">
              {card.icon}
            </span>
            <h3 className="text-ink mb-2.5 text-[1.05rem]">{card.title}</h3>
            <p className="text-ink-dim text-[0.88rem]">{card.description}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
