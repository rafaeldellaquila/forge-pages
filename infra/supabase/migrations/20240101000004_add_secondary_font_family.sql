alter table public.landing_pages
  add column secondary_font_family text;

comment on column public.landing_pages.secondary_font_family is
  'Optional second per-tenant font (e.g. a mono/accent face) — falls back to font_family when unset';
