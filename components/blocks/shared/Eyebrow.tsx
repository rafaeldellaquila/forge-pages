/** Small monospace kicker above a section heading, with the tenant-coloured rule. */
export function Eyebrow({ children }: { children: string }) {
  return (
    <div className="text-tenant-primary font-tenant-secondary mb-4 flex items-center gap-2.5 text-[0.72rem] tracking-[0.18em] uppercase">
      <span className="bg-tenant-primary h-px w-[22px] shrink-0" />
      {children}
    </div>
  )
}
