import { Section } from '@/components/blocks/shared/Section'
import type { TestimonialsBlock as TestimonialsBlockProps } from '@/lib/types/blocks'

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <div aria-hidden="true" className="text-tenant-secondary mb-3 text-[0.9rem]">
      {'★'.repeat(rounded)}
      {'☆'.repeat(5 - rounded)}
    </div>
  )
}

export function TestimonialsBlock({ anchorId, headline, items }: TestimonialsBlockProps) {
  return (
    <Section id={anchorId}>
      <h2 className="text-ink mb-16 text-[clamp(2rem,3.6vw,2.9rem)]">{headline}</h2>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.name}
            className="bg-surface border-surface-line flex flex-col rounded-md border p-7"
          >
            {typeof item.rating === 'number' ? <Stars rating={item.rating} /> : null}

            <p className="text-ink-dim mb-6 grow text-[0.95rem]">&ldquo;{item.text}&rdquo;</p>

            <div className="flex items-center gap-3">
              {item.photo ? (
                // biome-ignore lint/performance/noImgElement: next/image has known gaps on Cloudflare Workers (ADR-0001)
                <img
                  src={item.photo.url}
                  alt={item.photo.alternativeText ?? ''}
                  className="h-11 w-11 rounded-full object-cover"
                />
              ) : null}
              <div>
                <div className="text-ink text-[0.92rem] font-semibold">{item.name}</div>
                {item.role ? <div className="text-ink-muted text-[0.8rem]">{item.role}</div> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  )
}
