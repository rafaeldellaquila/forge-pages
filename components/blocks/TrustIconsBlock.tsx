import type { TrustIconsBlock as TrustIconsBlockProps } from '@/lib/types/blocks'

/** A slim strip of trust signals, typically placed right under the hero. */
export function TrustIconsBlock({ anchorId, items }: TrustIconsBlockProps) {
  return (
    <section id={anchorId} className="mx-auto w-full max-w-[1400px] px-[8vw] py-10">
      <ul className="flex list-none flex-wrap items-center justify-center gap-x-10 gap-y-4">
        {items.map((item) => (
          <li key={item.text} className="text-ink-dim flex items-center gap-2.5 text-[0.92rem]">
            <span aria-hidden="true" className="text-tenant-primary text-[1.1rem]">
              {item.icon}
            </span>
            {item.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
