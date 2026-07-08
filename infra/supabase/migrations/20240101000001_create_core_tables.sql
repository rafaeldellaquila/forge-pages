-- ─── clients ─────────────────────────────────────────────────────────────────
create table public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  whatsapp    text not null,
  created_at  timestamptz not null default now()
);

comment on table public.clients is 'Agency clients who own landing pages';

-- ─── landing_pages ───────────────────────────────────────────────────────────
create table public.landing_pages (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  domain          text not null unique,
  render_mode     text not null default 'blocks'
                    check (render_mode in ('blocks', 'custom')),
  status          text not null default 'draft'
                    check (status in ('draft', 'published', 'archived')),
  seo_title       text,
  seo_description text,
  seo_og_image    text,
  canonical_url   text,
  primary_color   text,
  secondary_color text,
  font_family     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.landing_pages is 'One record per client landing page';
comment on column public.landing_pages.domain is 'Full domain e.g. lp.cliente.com.br — must be unique';
comment on column public.landing_pages.render_mode is 'blocks: Dynamic Zone | custom: dedicated Vue component';

-- auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger landing_pages_updated_at
  before update on public.landing_pages
  for each row execute function public.set_updated_at();

-- ─── leads ───────────────────────────────────────────────────────────────────
create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
  name            text not null,
  whatsapp        text not null,
  email           text,
  message         text,
  intent          text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  status          text not null default 'new'
                    check (status in ('new', 'contacted', 'converted', 'lost')),
  created_at      timestamptz not null default now()
);

comment on table public.leads is 'Leads captured via landing page forms';
comment on column public.leads.status is 'new | contacted | converted | lost';

-- ─── webhook_retries ─────────────────────────────────────────────────────────
create table public.webhook_retries (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  channel       text not null check (channel in ('email', 'whatsapp')),
  attempts      int not null default 0,
  last_error    text,
  next_retry_at timestamptz,
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.webhook_retries is 'Tracks failed webhook deliveries for retry';

-- ─── indexes ─────────────────────────────────────────────────────────────────
create index idx_landing_pages_domain on public.landing_pages(domain);
create index idx_landing_pages_client_id on public.landing_pages(client_id);
create index idx_leads_landing_page_id on public.leads(landing_page_id);
create index idx_leads_created_at on public.leads(created_at desc);
create index idx_webhook_retries_next_retry on public.webhook_retries(next_retry_at)
  where resolved_at is null;
