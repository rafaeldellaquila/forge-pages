import { Section } from '@/components/blocks/shared/Section'
import { ServiceTabs } from '@/components/blocks/shared/ServiceTabs'
import type { ServicesBlock as ServicesBlockProps } from '@/lib/types/blocks'

export function ServicesBlock({ anchorId, headline, tabs }: ServicesBlockProps) {
  return (
    <Section id={anchorId}>
      <h2 className="text-ink mb-16 text-[clamp(2rem,3.6vw,2.9rem)]">{headline}</h2>
      <ServiceTabs tabs={tabs} />
    </Section>
  )
}
