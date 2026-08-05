# Skill: Supabase Migration

Use this skill when asked to write a new database migration for forge-pages.
Before starting, read this file in full.

---

## Core rules for this project

1. **Migrations are irreversible** — Supabase applies them forward-only. There is no rollback. Think carefully before writing.
2. **Always ask before running** — `mise run db:migrate` asks for confirmation. Never bypass it.
3. **New tables always need RLS** — no table is ever created without a Row Level Security policy in the same migration or the next one.
4. **RLS policies are not enough** — Supabase does not auto-grant DML privileges on new tables. Add explicit `grant`s (least privilege) alongside the policies, or access fails with `permission denied` despite a matching policy.
5. **Always check `lib/types/blocks.ts`** — if the migration adds or renames columns that the app reads, the TypeScript types (and the Zod schema in `lib/schemas/blocks.ts`, for anything inside `landing_pages.blocks`) must be updated too.

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

This project has 3 access roles: `anon` (visitors, via the publishable key),
`authenticated` (future), `service_role` (server-side code, via the secret key).

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

### Service_role only (e.g. clients)
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
2. Test it locally first (see below)
3. Run `mise run db:migrate` (will ask for confirmation)
4. Verify in Supabase Studio: Table Editor shows the new structure
5. If new table: verify RLS is enabled (Authentication → Policies) **and** that the grants
   are in place
6. If new/changed columns the app reads: update `lib/types/blocks.ts` (and
   `lib/schemas/blocks.ts` for anything inside `landing_pages.blocks`)
7. Run `mise run typecheck` — must pass

---

## Testing the migration locally

Config lives in `infra/supabase/config.toml`, so every CLI command needs `--workdir infra`.

```bash
# Start the local stack
pnpm exec supabase start --workdir infra

# Apply all migrations + seed from scratch (destructive: local data only)
pnpm exec supabase db reset --workdir infra

# Inspect the result — Studio SQL editor (http://127.0.0.1:54323) or psql:
docker exec -i "$(docker ps --format '{{.Names}}' | grep -m1 supabase_db)" \
  psql -U postgres -d postgres -c "select * from public.<table> limit 1;"
```

---

## What NOT to do

- Do not use `serial` or `integer` primary keys — use `uuid`
- Do not use PostgreSQL `enum` types — use `text` with `check` constraints
- Do not drop columns without verifying no application code references them
- Do not alter column types on tables with existing production data
- Do not forget RLS **and grants** on new tables
- Do not add a DB-level JSON schema constraint to `landing_pages.blocks` — that shape is
  validated in the app by `lib/schemas/blocks.ts` so the errors stay readable
- Do not commit migrations without running `mise run typecheck`
