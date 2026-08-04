alter table public.landing_pages
  add column background_type text
    check (background_type in ('transparent', 'solid', 'gradient', 'image', 'fine-line-texture', 'glass')),
  add column background_color_token text
    check (background_color_token in ('primary', 'secondary', 'custom')),
  add column background_color_custom text,
  add column background_gradient_to_token text
    check (background_gradient_to_token in ('primary', 'secondary', 'custom')),
  add column background_gradient_to_custom text,
  add column background_image_url text,
  add column divider_glyph text;

comment on column public.landing_pages.background_type is
  'Page-level background style — null falls back to the plain default (today''s white page)';
comment on column public.landing_pages.background_color_token is
  'Which tenant color the background/gradient-start draws from, or ''custom'' for background_color_custom';
comment on column public.landing_pages.divider_glyph is
  'Optional glyph centered on the seam divider between blocks — null renders a plain line';
