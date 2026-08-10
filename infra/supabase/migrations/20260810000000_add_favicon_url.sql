-- Per-tenant favicon (extends the seo_* metadata columns from Fase 1).
--
-- Same shape as seo_og_image: free-text URL, nullable, no default. Null falls
-- back to the shared static app/favicon.ico via generateMetadata's `icons`
-- field in app/layout.tsx.
alter table public.landing_pages
  add column favicon_url text;

comment on column public.landing_pages.favicon_url is
  'Per-tenant favicon URL (relative path into public/, or absolute). Null falls back to the shared app/favicon.ico.';
