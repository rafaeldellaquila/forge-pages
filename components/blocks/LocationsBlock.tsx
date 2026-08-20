import { Eyebrow } from '@/components/blocks/shared/Eyebrow'
import { Section } from '@/components/blocks/shared/Section'
import type { LocationsBlock as LocationsBlockProps } from '@/lib/types/blocks'

export function LocationsBlock({ anchorId, eyebrow, headline, items }: LocationsBlockProps) {
  return (
    <Section id={anchorId}>
      <div className="mb-16 max-w-[640px]">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-ink text-[clamp(2rem,3.6vw,2.9rem)]">{headline}</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={`${item.city}-${item.address}`}
            className="bg-surface border-surface-line rounded-md border p-6"
          >
            {item.icon ? (
              <span aria-hidden="true" className="text-tenant-primary mb-3 block text-[1.4rem]">
                {item.icon}
              </span>
            ) : null}
            <h3 className="text-ink mb-2 text-[1.05rem]">
              {item.mapLink ? (
                <a href={item.mapLink} className="hover:text-tenant-primary transition-colors">
                  {item.city}
                </a>
              ) : (
                item.city
              )}
            </h3>
            <p className="text-ink-dim text-[0.88rem]">{item.address}</p>
          </article>
        ))}
      </div>
    </Section>
  )
}
