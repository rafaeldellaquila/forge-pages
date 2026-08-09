import type { StatsBlock as StatsBlockProps } from '@/lib/types/blocks'

export function StatsBlock({ anchorId, items }: StatsBlockProps) {
  return (
    <section id={anchorId} className="mx-auto w-full max-w-[1400px] px-[8vw] py-16">
      <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="font-tenant-secondary text-tenant-secondary text-[2.4rem] font-bold">
              {item.number}
            </div>
            <div className="text-ink-dim mt-2 text-[0.85rem] tracking-[0.04em] uppercase">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
