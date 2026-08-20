import { Eyebrow } from '@/components/blocks/shared/Eyebrow'
import { Section } from '@/components/blocks/shared/Section'
import type { ValuePropositionBlock as ValuePropositionBlockProps } from '@/lib/types/blocks'

export function ValuePropositionBlock({
  anchorId,
  variant = 'default',
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

      {variant === 'timeline' ? (
        <ol className="flex max-w-[720px] flex-col gap-10 pl-16">
          {cards.map((card, index) => (
            <li key={card.title} className="relative">
              <span
                aria-hidden="true"
                className="bg-surface border-tenant-primary text-tenant-primary absolute top-0 -left-16 flex h-12 w-12 items-center justify-center rounded-full border text-[1.3rem]"
              >
                {card.icon}
              </span>
              {index < cards.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="bg-surface-line absolute -left-10 top-12 bottom-[-2.5rem] w-px"
                />
              ) : null}
              {card.stepLabel ? (
                <span className="font-tenant-secondary text-ink-muted text-[0.75rem] tracking-[0.08em]">
                  {card.stepLabel}
                </span>
              ) : null}
              <h3 className="text-ink mt-1 mb-2.5 text-[1.05rem]">{card.title}</h3>
              <p className="text-ink-dim text-[0.88rem]">{card.description}</p>
            </li>
          ))}
        </ol>
      ) : (
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
      )}
    </Section>
  )
}
