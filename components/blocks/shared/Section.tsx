import type { CSSProperties, ReactNode } from 'react'

interface SectionProps {
  id?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
}

/** The page's horizontal rhythm: every in-flow block sits in one of these. */
export function Section({ id, className = '', style, children }: SectionProps) {
  return (
    <section
      id={id}
      style={style}
      className={`relative mx-auto w-full max-w-[1400px] px-[8vw] py-28 ${className}`}
    >
      {children}
    </section>
  )
}
