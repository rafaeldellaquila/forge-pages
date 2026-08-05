import { Eyebrow } from '@/components/blocks/shared/Eyebrow'
import { Section } from '@/components/blocks/shared/Section'
import { resolveBackground } from '@/lib/background'
import type { DifferentialsBlock as DifferentialsBlockProps } from '@/lib/types/blocks'

export function DifferentialsBlock({
  anchorId,
  background,
  eyebrow,
  headline,
  text,
  items,
}: DifferentialsBlockProps) {
  const resolved = resolveBackground(background)

  // Editors write paragraphs as blank-line-separated text in the JSON editor;
  // rendering them as one <p> would run them together.
  const paragraphs = text?.split(/\n\s*\n/).filter(Boolean) ?? []

  return (
    <Section id={anchorId} style={resolved.style} className={resolved.className}>
      <div className="grid items-start gap-16 lg:grid-cols-2">
        <div>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2 className="text-ink mb-6 text-[clamp(2rem,3.4vw,2.7rem)]">{headline}</h2>
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-ink-dim mb-5 text-[1.02rem] last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        <ul className="flex list-none flex-col gap-5">
          {items.map((item) => (
            <li
              key={item.text}
              className="bg-surface border-surface-line text-ink-dim flex gap-4 rounded border p-5 text-[0.95rem]"
            >
              {item.tag ? (
                <span className="font-tenant-secondary text-tenant-primary shrink-0 pt-0.5 text-[0.7rem]">
                  {item.tag}
                </span>
              ) : null}
              {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
              <span>{item.text}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}
