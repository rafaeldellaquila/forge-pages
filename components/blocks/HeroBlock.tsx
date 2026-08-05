import { BackgroundParticles } from '@/components/blocks/shared/BackgroundParticles'
import { CtaButton } from '@/components/blocks/shared/CtaButton'
import { resolveBackground } from '@/lib/background'
import type { HeroBlock as HeroBlockProps } from '@/lib/types/blocks'

export function HeroBlock({
  anchorId,
  variant = 'default',
  background,
  badgeText,
  headline,
  subheadline,
  ctaPrimaryLabel,
  ctaPrimaryLink,
  ctaSecondaryLabel,
  ctaSecondaryLink,
  image,
  imageAlt,
}: HeroBlockProps) {
  const resolved = resolveBackground(background)
  const centered = variant === 'centered'

  return (
    <section
      id={anchorId}
      style={resolved.style}
      className={`relative flex min-h-screen flex-col justify-center px-[8vw] pt-24 pb-16 ${resolved.className} ${
        centered ? 'items-center text-center' : 'items-start'
      }`}
    >
      {background?.effect === 'particles' ? <BackgroundParticles /> : null}

      <div
        className={`relative z-10 mx-auto flex w-full max-w-[1400px] flex-col ${
          centered ? 'items-center' : 'items-start'
        }`}
      >
        {image ? (
          // Intentionally a plain <img>: the logo is an SVG, so there is nothing
          // for next/image to optimise and OpenNext's image handling is a known
          // rough edge on Workers (ADR-0001).
          // biome-ignore lint/performance/noImgElement: SVG logo, no optimisation to gain
          <img
            src={image.url}
            alt={image.alternativeText ?? imageAlt ?? ''}
            className="mb-7 h-auto w-[min(440px,80vw)] object-contain drop-shadow-[0_0_30px_color-mix(in_srgb,var(--tenant-primary)_35%,transparent)]"
          />
        ) : null}

        {badgeText ? (
          <span className="font-tenant-secondary border-surface-line text-ink-dim mb-6 rounded-full border px-4 py-1.5 text-[0.72rem] tracking-[0.12em] uppercase">
            {badgeText}
          </span>
        ) : null}

        <h1 className="text-ink text-[clamp(2rem,4.4vw,3.4rem)]">{headline}</h1>

        <p
          className={`text-ink-dim mt-6 mb-10 max-w-[560px] text-[1.15rem] font-light ${
            centered ? 'text-center' : ''
          }`}
        >
          {subheadline}
        </p>

        <div className={`flex flex-wrap gap-4 ${centered ? 'justify-center' : ''}`}>
          <CtaButton href={ctaPrimaryLink} label={ctaPrimaryLabel} />
          {ctaSecondaryLabel && ctaSecondaryLink ? (
            <CtaButton href={ctaSecondaryLink} label={ctaSecondaryLabel} tone="ghost" />
          ) : null}
        </div>
      </div>
    </section>
  )
}
