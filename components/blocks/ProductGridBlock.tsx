import { CtaButton } from '@/components/blocks/shared/CtaButton'
import { Section } from '@/components/blocks/shared/Section'
import type { ProductGridBlock as ProductGridBlockProps } from '@/lib/types/blocks'
import { buildWhatsappLink } from '@/lib/whatsapp'

type Item = ProductGridBlockProps['items'][number]

function resolveItemHref(item: Item) {
  if (item.ctaWhatsapp) return buildWhatsappLink(item.ctaWhatsapp, item.ctaMessage)
  return item.ctaLink ?? '#'
}

export function ProductGridBlock({
  anchorId,
  headline,
  subheadline,
  items,
  viewAllLabel,
  viewAllLink,
}: ProductGridBlockProps) {
  return (
    <Section id={anchorId}>
      <div className="mb-16 max-w-[640px]">
        <h2 className="text-ink text-[clamp(2rem,3.6vw,2.9rem)]">{headline}</h2>
        {subheadline ? <p className="text-ink-dim mt-4 text-[1.02rem]">{subheadline}</p> : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.name}
            className="bg-surface border-surface-line flex flex-col overflow-hidden rounded-md border"
          >
            <div className="relative">
              {/* Tenant content image; next/image has known gaps on this deploy target (ADR-0001). */}
              {/* biome-ignore lint/performance/noImgElement: next/image has known gaps on Cloudflare Workers (ADR-0001) */}
              <img
                src={item.image.url}
                alt={item.image.alternativeText ?? ''}
                className="h-48 w-full object-cover"
              />
              {item.badge ? (
                <span className="font-tenant-secondary text-tenant-background absolute top-3 left-3 rounded-full bg-[linear-gradient(135deg,var(--tenant-primary),var(--tenant-secondary))] px-3 py-1 text-[0.68rem] font-bold tracking-[0.05em] uppercase">
                  {item.badge}
                </span>
              ) : null}
            </div>

            <div className="flex grow flex-col p-6">
              <h3 className="text-ink text-[1.05rem]">{item.name}</h3>
              {item.subtitle ? (
                <p className="text-ink-dim mt-1 text-[0.85rem]">{item.subtitle}</p>
              ) : null}

              {item.specs?.length ? (
                <ul className="mt-4 flex list-none flex-wrap gap-2">
                  {item.specs.map((spec) => (
                    <li
                      key={spec}
                      className="font-tenant-secondary text-ink-dim border-surface-line rounded-full border px-2.5 py-1 text-[0.68rem] tracking-[0.03em] uppercase"
                    >
                      {spec}
                    </li>
                  ))}
                </ul>
              ) : null}

              {item.price ? (
                <div className="mt-5">
                  {item.priceLabel ? (
                    <div className="text-ink-muted text-[0.72rem] tracking-[0.06em] uppercase">
                      {item.priceLabel}
                    </div>
                  ) : null}
                  <div className="font-tenant-secondary text-tenant-secondary text-[1.5rem] font-bold">
                    {item.price}
                  </div>
                </div>
              ) : null}

              <div className="mt-auto pt-6">
                <CtaButton href={resolveItemHref(item)} label={item.ctaLabel} tone="ghost" />
              </div>
            </div>
          </article>
        ))}
      </div>

      {viewAllLabel && viewAllLink ? (
        <div className="mt-12 text-center">
          <CtaButton href={viewAllLink} label={viewAllLabel} tone="primary" />
        </div>
      ) : null}
    </Section>
  )
}
