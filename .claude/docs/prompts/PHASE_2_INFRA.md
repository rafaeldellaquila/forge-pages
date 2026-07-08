# Phase 2 — Infra (Supabase)

> **Before starting**: Read `CLAUDE.md` in full. Phase 1 must be complete and validated.
> **Commit strategy**: Ask before every commit. Use Conventional Commits.
> **Scope**: Supabase only. No Strapi, no Nuxt code in this phase.

---

## Objective

Set up all Supabase infrastructure: database schema, RLS policies, Edge Function for lead webhook, pg_cron retry job, and development seed data. By the end of this phase the database is production-ready and the lead notification flow works end-to-end (tested locally with Supabase CLI).

---

## Prerequisites

1. Supabase project created at [supabase.com](https://supabase.com)
2. Supabase CLI installed: `brew install supabase/tap/supabase`
3. Logged in: `supabase login`
4. Project linked: `supabase link --project-ref <your-project-ref>`
5. Environment variables available (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

---

## Tasks — execute in this exact order

### 1. Supabase project structure

Confirm this structure exists (created in Phase 1):
```
infra/supabase/
├── migrations/
├── seed/
└── functions/
    └── handle-lead-webhook/
```

Create `infra/supabase/config.toml` for local development:
```toml
[api]
enabled = true
port = 54321
schemas = ["public"]
extra_search_path = ["public", "extensions"]

[db]
port = 54322
major_version = 15

[studio]
enabled = true
port = 54323

[inbucket]
enabled = true
port = 54324

[storage]
enabled = true
```

---

### 2. Migration 001 — extensions

Create `infra/supabase/migrations/20240101000000_enable_extensions.sql`:

```sql
-- Enable required PostgreSQL extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";   -- for HTTP calls from pg_cron

comment on schema public is 'forge-pages public schema';
```

---

### 3. Migration 002 — core tables

Create `infra/supabase/migrations/20240101000001_create_core_tables.sql`:

```sql
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
```

---

### 4. Migration 003 — Row Level Security

Create `infra/supabase/migrations/20240101000002_enable_rls.sql`:

```sql
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
```

---

### 5. Migration 004 — pg_cron retry job

Create `infra/supabase/migrations/20240101000003_create_retry_cron.sql`:

```sql
-- Schedule webhook retry job every 5 minutes
-- Picks up failed webhooks where next_retry_at <= now() and attempts < 3
select cron.schedule(
  'retry-failed-webhooks',
  '*/5 * * * *',
  $$
    select
      net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/handle-lead-webhook',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
        ),
        body := jsonb_build_object('retry', true)
      )
    from public.webhook_retries
    where
      resolved_at is null
      and attempts < 3
      and (next_retry_at is null or next_retry_at <= now())
    limit 1;
  $$
);
```

---

### 6. Supabase Edge Function — handle-lead-webhook

Create `infra/supabase/functions/handle-lead-webhook/index.ts`:

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

interface LeadRecord {
  id: string
  name: string
  whatsapp: string
  email: string | null
  landing_page_id: string
  intent: string | null
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: LeadRecord
  retry?: boolean
}

async function sendEmailNotification(lead: LeadRecord): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('RESEND_FROM_EMAIL'),
      to: [Deno.env.get('RESEND_NOTIFICATION_EMAIL')],
      subject: `Novo lead: ${lead.name}`,
      html: `
        <h2>Novo lead capturado</h2>
        <p><strong>Nome:</strong> ${lead.name}</p>
        <p><strong>WhatsApp:</strong> ${lead.whatsapp}</p>
        ${lead.email ? `<p><strong>E-mail:</strong> ${lead.email}</p>` : ''}
        ${lead.intent ? `<p><strong>Interesse:</strong> ${lead.intent}</p>` : ''}
        <p><strong>ID:</strong> ${lead.id}</p>
      `,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Resend error: ${error}`)
  }
}

async function sendWhatsAppNotification(lead: LeadRecord): Promise<void> {
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')
  const accessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const notificationNumber = Deno.env.get('WHATSAPP_NOTIFICATION_NUMBER')

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: notificationNumber,
        type: 'text',
        text: {
          body: `🔔 Novo lead!\n\n👤 ${lead.name}\n📱 ${lead.whatsapp}${lead.email ? `\n📧 ${lead.email}` : ''}${lead.intent ? `\n🎯 ${lead.intent}` : ''}`,
        },
      }),
    },
  )

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`WhatsApp error: ${error}`)
  }
}

async function handleRetries(): Promise<void> {
  const { data: retries } = await supabase
    .from('webhook_retries')
    .select('*, leads(*)')
    .is('resolved_at', null)
    .lt('attempts', 3)
    .or(`next_retry_at.is.null,next_retry_at.lte.${new Date().toISOString()}`)
    .limit(10)

  if (!retries?.length) return

  for (const retry of retries) {
    const lead = retry.leads as LeadRecord
    try {
      if (retry.channel === 'email') await sendEmailNotification(lead)
      if (retry.channel === 'whatsapp') await sendWhatsAppNotification(lead)

      await supabase
        .from('webhook_retries')
        .update({ resolved_at: new Date().toISOString() })
        .eq('id', retry.id)
    } catch (err) {
      const nextRetry = new Date(Date.now() + (retry.attempts + 1) * 5 * 60 * 1000)
      await supabase
        .from('webhook_retries')
        .update({
          attempts: retry.attempts + 1,
          last_error: err instanceof Error ? err.message : String(err),
          next_retry_at: nextRetry.toISOString(),
        })
        .eq('id', retry.id)
    }
  }
}

async function handleNewLead(lead: LeadRecord): Promise<void> {
  const channels: Array<'email' | 'whatsapp'> = ['email', 'whatsapp']

  await Promise.allSettled(
    channels.map(async (channel) => {
      try {
        if (channel === 'email') await sendEmailNotification(lead)
        if (channel === 'whatsapp') await sendWhatsAppNotification(lead)
      } catch (err) {
        // Store failed notification for retry
        await supabase.from('webhook_retries').insert({
          lead_id: lead.id,
          channel,
          attempts: 1,
          last_error: err instanceof Error ? err.message : String(err),
          next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })
      }
    }),
  )
}

Deno.serve(async (req: Request) => {
  try {
    const payload = await req.json() as WebhookPayload

    if (payload.retry) {
      await handleRetries()
      return new Response(JSON.stringify({ ok: true, action: 'retried' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (payload.type === 'INSERT' && payload.table === 'leads') {
      await handleNewLead(payload.record)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
```

---

### 7. Supabase Database Webhook

After deploying the Edge Function, configure the database webhook in the Supabase dashboard:

- **Name**: `on-new-lead`
- **Table**: `leads`
- **Events**: `INSERT`
- **Type**: Supabase Edge Functions
- **Edge Function**: `handle-lead-webhook`

This cannot be automated via migration — do it manually in the dashboard and document it here once done.

---

### 8. Seed data for development

Create `infra/supabase/seed/01_clients.sql`:
```sql
insert into public.clients (id, name, email, whatsapp) values
  ('00000000-0000-0000-0000-000000000001', 'Suka Motos', 'contato@sukamotos.com.br', '5511999999001'),
  ('00000000-0000-0000-0000-000000000002', 'Clínica Exemplo', 'contato@clinicaexemplo.com.br', '5511999999002');
```

Create `infra/supabase/seed/02_landing_pages.sql`:
```sql
insert into public.landing_pages (id, client_id, domain, status, seo_title, primary_color, secondary_color, font_family) values
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'localhost:3000',
    'published',
    'Suka Motos — Sua moto nova está aqui',
    '#e94560',
    '#065a82',
    'Inter'
  );
```

---

### 9. Deploy to Supabase

Ask for confirmation before running each of these:

```bash
# Apply migrations
supabase db push

# Deploy Edge Function
supabase functions deploy handle-lead-webhook \
  --project-ref <your-project-ref>

# Set Edge Function secrets
supabase secrets set \
  RESEND_API_KEY=<value> \
  RESEND_FROM_EMAIL=<value> \
  RESEND_NOTIFICATION_EMAIL=<value> \
  WHATSAPP_ACCESS_TOKEN=<value> \
  WHATSAPP_PHONE_NUMBER_ID=<value> \
  WHATSAPP_NOTIFICATION_NUMBER=<value>
```

---

## Validation checklist before closing Phase 2

- [ ] `supabase db push` runs with no errors
- [ ] All 4 tables exist in Supabase dashboard: `clients`, `landing_pages`, `leads`, `webhook_retries`
- [ ] RLS is enabled on all 4 tables (visible in dashboard under Authentication → Policies)
- [ ] Anon key cannot SELECT from `clients` (test in SQL editor: `set role anon; select * from clients;` → should return 0 rows)
- [ ] Anon key can INSERT a lead (test in SQL editor: insert a dummy lead)
- [ ] Edge Function deployed and visible in Supabase dashboard
- [ ] Seed data loaded: 2 clients, 1 landing page
- [ ] pg_cron job listed: `select * from cron.job;`
- [ ] Indexes created: run `\d public.leads` and confirm index on `landing_page_id`

---

## Commit at the end of Phase 2

Ask for confirmation, then:
```bash
git add infra/
git commit -m "feat(infra): add Supabase schema, RLS, Edge Function and pg_cron

- migrations: extensions, core tables, RLS policies, retry cron
- Edge Function: handle-lead-webhook with email + WhatsApp notifications
- webhook_retries table with automatic retry via pg_cron (every 5m, max 3 attempts)
- seed data for local development
- indexes on domain, client_id, landing_page_id, created_at"

git push origin main
```

---

## Update CLAUDE.md

Mark Phase 2 as complete in section 14:
```
- [x] Phase 2 — Infra (Supabase migrations, Edge Functions, pg_cron)
```

---

## Next step

```
docs/prompts/PHASE_3_CMS.md
```
