/**
 * Hairline divider between blocks, optionally interrupted by the tenant's
 * `divider_glyph`. The glyph is a real element rather than a `::before` so the
 * value can come from data without smuggling a quoted string through CSS.
 */
export function Seam({ glyph }: { glyph?: string | null }) {
  return (
    <div className="relative mx-auto h-px max-w-[1400px] bg-[linear-gradient(90deg,transparent,var(--color-surface-line)_15%,var(--color-surface-line)_85%,transparent)]">
      {glyph ? (
        <span className="bg-tenant-background text-surface-line absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3.5 text-[0.9rem]">
          {glyph}
        </span>
      ) : null}
    </div>
  )
}
