'use client'

import { useState } from 'react'
import { CtaButton } from '@/components/blocks/shared/CtaButton'
import type { ServicesBlock } from '@/lib/types/blocks'

type Tab = ServicesBlock['tabs'][number]

/** Tab switcher for the services block — the one piece of it that needs state. */
export function ServiceTabs({ tabs }: { tabs: Tab[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = tabs[activeIndex]

  return (
    <div>
      <div className="border-surface-line mb-10 flex flex-wrap gap-2 border-b">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`font-tenant-secondary px-5 py-3 text-[0.8rem] tracking-[0.04em] uppercase transition-colors ${
              index === activeIndex
                ? 'text-tenant-primary border-tenant-primary border-b-2'
                : 'text-ink-dim border-b-2 border-transparent hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h3 className="text-ink mb-4 text-[1.6rem]">{active.title}</h3>
          <p className="text-ink-dim text-[1rem]">{active.text}</p>
          {active.ctaLabel && active.ctaLink ? (
            <div className="mt-7">
              <CtaButton href={active.ctaLink} label={active.ctaLabel} tone="ghost" />
            </div>
          ) : null}
        </div>

        {active.image ? (
          // Tenant content image; next/image has known gaps on this deploy
          // target (ADR-0001), so every block image uses a plain element.
          // biome-ignore lint/performance/noImgElement: next/image has known gaps on Cloudflare Workers (ADR-0001)
          <img
            src={active.image.url}
            alt={active.image.alternativeText ?? ''}
            className="w-full rounded-md object-cover"
          />
        ) : null}
      </div>
    </div>
  )
}
