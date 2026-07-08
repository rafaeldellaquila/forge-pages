# Skill: Supabase Migration

Use this skill when asked to write a new database migration for forge-pages.
Before starting, read this file in full.

---

## Core rules for this project

1. **Migrations are irreversible** — Supabase applies them forward-only. There is no rollback. Think carefully before writing.
2. **Always ask before running** — `mise run db:migrate` asks for confirmation. Never bypass it.
3. **New tables always need RLS** — no table is ever created without a Row Level Security policy in the same migration or the next one.
4. **Always check packages/types** — if the migration adds or renames columns, the TypeScript types must be updated too.

---

## File naming

```
infra/supabase/migrations/<YYYYMMDDHHMMSS>_<description>.sql
```

Generate with: `mise run gen:migration <description>`
Example: `mise run gen:migration add_locale_to_landing_pages`

---

## Migration file structure

```sql
-- Migration: <description>
-- Created at: <ISO timestamp>
-- Description: <one line describing what and why>

-- ─── TABLES ──────────────────────────────────────────────────────────────────

-- table definition here

-- ─── RLS ─────────────────────────────────────────────────────────────────────

-- RLS policies here

-- ─── INDEXES ─────────────────────────────────────────────────────────────────

-- indexes here

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────

-- triggers here (if any)
```

---

## RLS policy patterns for this project

This project has 3 access roles: `anon` (visitors), `authenticated` (future), `service_role` (Edge Functions / server).

### Public read, service_role write (e.g. landing_pages)
```sql
alter table public.<table> enable row level security;

create policy "public_read_published_<table>"
  on public.<table>
  for select to anon
  using (status = 'published');

create policy "service_role_all_<table>"
  on public.<table>
  to service_role
  using (true)
  with check (true);
```

### Anon insert only, service_role full (e.g. leads)
```sql
alter table public.<table> enable row level security;

create policy "anon_insert_<table>"
  on public.<table>
  for insert to anon
  with check (true);

create policy "service_role_all_<table>"
  on public.<table>
  to service_role
  using (true)
  with check (true);
```

### Service_role only (e.g. clients, webhook_retries)
```sql
alter table public.<table> enable row level security;

create policy "service_role_all_<table>"
  on public.<table>
  to service_role
  using (true)
  with check (true);
```

---

## Standard column conventions

```sql
-- All tables: UUID primary key
id uuid primary key default gen_random_uuid()

-- All tables: creation timestamp
created_at timestamptz not null default now()

-- Tables that update: updated_at with trigger
updated_at timestamptz not null default now()

-- Status enums: always use check constraints, not Postgres enums
-- (enums are hard to alter; check constraints are easy)
status text not null default 'draft'
  check (status in ('draft', 'published', 'archived'))
```

### Adding updated_at trigger
```sql
-- Reuse the existing function (already created in migration 001)
create trigger <table>_updated_at
  before update on public.<table>
  for each row execute function public.set_updated_at();
```

---

## Index conventions

Always index:
- Foreign keys (`client_id`, `landing_page_id`, etc.)
- Columns used in WHERE clauses in server routes
- `created_at desc` on tables queried for "most recent"

```sql
create index idx_<table>_<column> on public.<table>(<column>);
create index idx_<table>_created_at on public.<table>(created_at desc);
```

Partial indexes for status-filtered queries:
```sql
create index idx_<table>_published on public.<table>(domain)
  where status = 'published';
```

---

## Adding columns to existing tables

```sql
-- Safe: adding nullable column
alter table public.<table>
  add column if not exists <column> text;

-- Safe: adding column with default
alter table public.<table>
  add column if not exists locale text not null default 'pt-BR';

-- Dangerous: changing column type — avoid if table has data
-- Instead: add new column, migrate data, drop old column in 3 separate migrations
```

---

## After writing the migration

1. Read the SQL again — check for typos in column names, missing semicolons
2. Run `mise run db:migrate` (will ask for confirmation)
3. Verify in Supabase dashboard: Table Editor shows the new structure
4. If new table: verify RLS is enabled (Authentication → Policies)
5. If new/changed columns: update `packages/types/src/index.ts` or the relevant block type
6. Run `mise run typecheck` — must pass

---

## Testing the migration locally

```bash
# Start local Supabase (if using local dev)
supabase start

# Apply migrations locally first
supabase db reset

# Test with a query in Supabase SQL Editor or:
supabase db execute "select * from <table> limit 1;"
```

---

## What NOT to do

- Do not use `serial` or `integer` primary keys — use `uuid`
- Do not use PostgreSQL `enum` types — use `text` with `check` constraints
- Do not drop columns without verifying no application code references them
- Do not alter column types on tables with existing production data
- Do not forget RLS on new tables
- Do not commit migrations without running `mise run typecheck`
