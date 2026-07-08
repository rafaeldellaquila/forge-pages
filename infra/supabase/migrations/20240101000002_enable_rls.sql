-- ─── grants ──────────────────────────────────────────────────────────────────
-- Supabase no longer auto-grants DML on new tables: RLS policies only filter
-- rows, so each role also needs explicit table-level privileges (least privilege).
grant usage on schema public to anon, service_role;
grant select on public.landing_pages to anon;
grant insert on public.leads to anon;
grant select, insert, update, delete
  on public.clients, public.landing_pages, public.leads, public.webhook_retries
  to service_role;

-- Enable RLS on all tables
alter table public.clients enable row level security;
alter table public.landing_pages enable row level security;
alter table public.leads enable row level security;
alter table public.webhook_retries enable row level security;

-- ─── clients: service role only ──────────────────────────────────────────────
-- Anon and authenticated roles have NO access to clients
-- Only service_role (Edge Functions, server-side) can read/write

create policy "service_role_all_clients"
  on public.clients
  to service_role
  using (true)
  with check (true);

-- ─── landing_pages: public read for published, service_role full ──────────────
create policy "public_read_published_landing_pages"
  on public.landing_pages
  for select
  to anon
  using (status = 'published');

create policy "service_role_all_landing_pages"
  on public.landing_pages
  to service_role
  using (true)
  with check (true);

-- ─── leads: anon insert only (for form submission), service_role full ─────────
create policy "anon_insert_leads"
  on public.leads
  for insert
  to anon
  with check (true);

create policy "service_role_all_leads"
  on public.leads
  to service_role
  using (true)
  with check (true);

-- ─── webhook_retries: service_role only ──────────────────────────────────────
create policy "service_role_all_webhook_retries"
  on public.webhook_retries
  to service_role
  using (true)
  with check (true);
