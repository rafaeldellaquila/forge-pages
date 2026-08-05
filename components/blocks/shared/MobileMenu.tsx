'use client'

import { useState } from 'react'

interface MobileMenuProps {
  links: { label: string; url: string }[]
  ctaLabel: string
  ctaHref: string
}

/** Burger menu for the sticky header — the one piece of the header that needs state. */
export function MobileMenu({ links, ctaLabel, ctaHref }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setOpen((value) => !value)}
        className="flex flex-col gap-[5px] border-none bg-transparent p-1"
      >
        <span className="bg-ink h-0.5 w-[22px]" />
        <span className="bg-ink h-0.5 w-[22px]" />
        <span className="bg-ink h-0.5 w-[22px]" />
      </button>

      {open ? (
        <div className="bg-tenant-background border-surface-line absolute top-full right-0 left-0 flex flex-col gap-5 border-b px-[6vw] py-6">
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              onClick={() => setOpen(false)}
              className="font-tenant-secondary text-ink-dim text-[0.82rem] tracking-[0.04em] uppercase no-underline"
            >
              {link.label}
            </a>
          ))}
          <a
            href={ctaHref}
            onClick={() => setOpen(false)}
            className="font-tenant-secondary text-tenant-primary text-[0.82rem] tracking-[0.04em] uppercase no-underline"
          >
            {ctaLabel}
          </a>
        </div>
      ) : null}
    </div>
  )
}
