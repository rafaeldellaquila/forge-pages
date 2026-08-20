import { Eyebrow } from '@/components/blocks/shared/Eyebrow'
import { FaqAccordion } from '@/components/blocks/shared/FaqAccordion'
import { Section } from '@/components/blocks/shared/Section'
import type { FaqBlock as FaqBlockProps } from '@/lib/types/blocks'

export function FaqBlock({ anchorId, eyebrow, headline, text, items }: FaqBlockProps) {
  return (
    <Section id={anchorId}>
      <div className="grid items-start gap-16 lg:grid-cols-2">
        <div>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="text-ink text-[clamp(2rem,3.4vw,2.7rem)]">{headline}</h2>
          {text ? <p className="text-ink-dim mt-4 text-[1.02rem]">{text}</p> : null}
        </div>

        <FaqAccordion items={items} />
      </div>
    </Section>
  )
}
