-- Per-tenant floating WhatsApp button (ADR-0012).
--
-- Unlike every block type, this has no position in the content flow, no
-- anchorId, and doesn't participate in seam rendering — it's a fixed,
-- always-visible element, the same category as favicon_url/seo_* (ADR-0011's
-- precedent for tenant-scoped, non-block config). Disabled by default so
-- every existing tenant keeps rendering exactly as before.
alter table public.landing_pages
  add column whatsapp_float_enabled boolean not null default false,
  add column whatsapp_float_number text,
  add column whatsapp_float_message text;

comment on column public.landing_pages.whatsapp_float_enabled is
  'Whether the fixed floating WhatsApp button renders for this tenant.';
comment on column public.landing_pages.whatsapp_float_number is
  'WhatsApp number (wa.me format) the floating button links to.';
comment on column public.landing_pages.whatsapp_float_message is
  'Optional pre-filled message for the floating button''s wa.me link.';
