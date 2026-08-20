import { Eyebrow } from '@/components/blocks/shared/Eyebrow'
import { Section } from '@/components/blocks/shared/Section'
import type { ComparisonTableBlock as ComparisonTableBlockProps } from '@/lib/types/blocks'

export function ComparisonTableBlock({
  anchorId,
  eyebrow,
  headline,
  subheadline,
  columns,
}: ComparisonTableBlockProps) {
  return (
    <Section id={anchorId}>
      <div className="mb-16 max-w-[640px]">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2 className="text-ink text-[clamp(2rem,3.6vw,2.9rem)]">{headline}</h2>
        {subheadline ? <p className="text-ink-dim mt-4 text-[1.02rem]">{subheadline}</p> : null}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {columns.map((column) => (
          <div
            key={column.title}
            className={`relative rounded-lg border p-9 ${
              column.featured
                ? 'border-tenant-primary bg-[linear-gradient(180deg,color-mix(in_srgb,var(--tenant-primary)_7%,transparent),var(--color-surface)_30%)]'
                : 'bg-surface border-surface-line'
            }`}
          >
            {column.badge ? (
              <span className="font-tenant-secondary text-tenant-background absolute -top-3 left-9 rounded-full bg-[linear-gradient(135deg,var(--tenant-primary),var(--tenant-secondary))] px-3 py-1.5 text-[0.68rem] font-bold tracking-[0.06em] uppercase">
                {column.badge}
              </span>
            ) : null}

            <h3 className="text-ink mb-6 text-[1.3rem]">{column.title}</h3>

            <ul className="flex list-none flex-col gap-3.5">
              {column.rows.map((row) => (
                <li key={row.text} className="text-ink-dim flex gap-3 text-[0.92rem]">
                  <span
                    aria-hidden="true"
                    className={`shrink-0 ${row.positive ? 'text-tenant-primary' : 'text-ink-muted'}`}
                  >
                    {row.positive ? '✓' : '✗'}
                  </span>
                  {row.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
