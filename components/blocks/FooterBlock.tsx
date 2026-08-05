import type { FooterBlock as FooterBlockProps } from '@/lib/types/blocks'

export function FooterBlock({
  logo,
  description,
  links,
  phones,
  schedule,
  socialLinks,
  copyright,
  privacyLink,
}: FooterBlockProps) {
  const hasDetails =
    Boolean(logo || description) || links.length > 0 || phones.length > 0 || socialLinks.length > 0

  return (
    <footer className="border-surface-line mx-auto max-w-[1400px] border-t px-[8vw] py-10">
      {hasDetails ? (
        <div className="mb-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            {logo ? (
              // biome-ignore lint/performance/noImgElement: SVG logo, no optimisation to gain
              <img
                src={logo.url}
                alt={logo.alternativeText ?? ''}
                className="mb-4 h-8 w-auto object-contain"
              />
            ) : null}
            {description ? <p className="text-ink-dim text-[0.88rem]">{description}</p> : null}
          </div>

          {links.length > 0 ? (
            <nav className="flex flex-col gap-2.5">
              {links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  className="font-tenant-secondary text-ink-dim hover:text-tenant-primary text-[0.78rem] tracking-[0.04em] uppercase no-underline transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          ) : null}

          <div className="flex flex-col gap-2.5">
            {phones.map((phone) => (
              <a
                key={phone.number}
                href={`tel:${phone.number.replace(/\D/g, '')}`}
                className="text-ink-dim text-[0.88rem] no-underline"
              >
                {phone.label ? `${phone.label}: ` : ''}
                {phone.number}
              </a>
            ))}
            {schedule ? <p className="text-ink-muted text-[0.78rem]">{schedule}</p> : null}
            {socialLinks.length > 0 ? (
              <div className="mt-2 flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.url}
                    href={social.url}
                    className="font-tenant-secondary text-ink-dim hover:text-tenant-primary text-[0.78rem] uppercase no-underline transition-colors"
                  >
                    {social.platform}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="font-tenant-secondary text-ink-muted flex flex-wrap justify-center gap-4 text-center text-[0.75rem] tracking-[0.04em]">
        <span>{copyright}</span>
        {privacyLink ? (
          <a
            href={privacyLink}
            className="hover:text-tenant-primary no-underline transition-colors"
          >
            Política de privacidade
          </a>
        ) : null}
      </div>
    </footer>
  )
}
