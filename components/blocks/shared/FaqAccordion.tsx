'use client'

import { useState } from 'react'
import type { FaqBlock } from '@/lib/types/blocks'

type Item = FaqBlock['items'][number]

/** Accordion for the faq block — the one piece of it that needs state. */
export function FaqAccordion({ items }: { items: Item[] }) {
  const [openIndex, setOpenIndex] = useState(0)

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => {
        const isOpen = index === openIndex

        return (
          <div key={item.question} className="border-surface-line rounded border">
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              aria-expanded={isOpen}
              className="text-ink flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[0.95rem] font-medium"
            >
              {item.question}
              <span aria-hidden="true" className="text-tenant-primary shrink-0 text-[1.1rem]">
                {isOpen ? '−' : '+'}
              </span>
            </button>
            {isOpen ? <p className="text-ink-dim px-5 pb-4 text-[0.9rem]">{item.answer}</p> : null}
          </div>
        )
      })}
    </div>
  )
}
