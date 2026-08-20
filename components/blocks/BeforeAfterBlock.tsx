import { Section } from '@/components/blocks/shared/Section'
import type { BeforeAfterBlock as BeforeAfterBlockProps } from '@/lib/types/blocks'

export function BeforeAfterBlock({
  anchorId,
  headline,
  subheadline,
  items,
}: BeforeAfterBlockProps) {
  return (
    <Section id={anchorId}>
      {headline || subheadline ? (
        <div className="mb-16 max-w-[640px]">
          {headline ? (
            <h2 className="text-ink text-[clamp(2rem,3.6vw,2.9rem)]">{headline}</h2>
          ) : null}
          {subheadline ? <p className="text-ink-dim mt-4 text-[1.02rem]">{subheadline}</p> : null}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <figure
            key={`${item.beforeImage.url}-${item.afterImage.url}`}
            className="bg-surface border-surface-line overflow-hidden rounded-md border"
          >
            <div className="flex flex-col">
              {/* Tenant content image; next/image has known gaps on this deploy target (ADR-0001). */}
              {/* biome-ignore lint/performance/noImgElement: next/image has known gaps on Cloudflare Workers (ADR-0001) */}
              <img
                src={item.beforeImage.url}
                alt={item.beforeImage.alternativeText ?? ''}
                className="h-44 w-full object-cover"
              />
              <div className="bg-tenant-primary h-px w-full shrink-0" />
              {/* biome-ignore lint/performance/noImgElement: next/image has known gaps on Cloudflare Workers (ADR-0001) */}
              <img
                src={item.afterImage.url}
                alt={item.afterImage.alternativeText ?? ''}
                className="h-44 w-full object-cover"
              />
            </div>
            {item.caption ? (
              <figcaption className="text-ink-dim p-4 text-[0.88rem]">{item.caption}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>
    </Section>
  )
}
