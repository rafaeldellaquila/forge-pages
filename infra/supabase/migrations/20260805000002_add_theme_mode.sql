-- Per-tenant light/dark neutral ramp (ADR-0010).
--
-- globals.css's neutral tokens (surface, ink, ...) were hardcoded for a dark
-- tenant since Fase 1, flagged there as a known gap to close once a second
-- tenant needed real content. `theme_mode` selects which of the two fixed
-- ramps lib/theme.ts resolves into --tenant-surface/--tenant-ink/etc., the
-- same indirection --tenant-primary already uses for brand colors.
--
-- A fixed pair rather than free-text columns per neutral: same rationale as
-- the font registry in lib/fonts.ts (ADR-0008 §4) — a small curated set beats
-- an open field that could produce unreadable contrast.
alter table public.landing_pages
  add column theme_mode text not null default 'dark'
  check (theme_mode in ('dark', 'light'));

comment on column public.landing_pages.theme_mode is
  'Selects which fixed neutral color ramp (dark or light) lib/theme.ts resolves for this tenant.';
