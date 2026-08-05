-- Migration: mvp_rewrite_reset
-- Created at: 2026-08-04
-- Description: MVP rewrite (ADR-0007). Blocks move from Strapi's Dynamic Zone into a
-- typed JSONB column on landing_pages, validated with Zod at fetch time. The
-- Strapi-owned schema and the whole lead-notification/retry chain (Edge Function
-- webhook + pg_cron retry + webhook_retries table) are removed — the MVP inserts
-- leads directly and they're read in Supabase Studio.
--
-- Confirmed with the project owner before writing: the `strapi` schema and
-- `webhook_retries` held no data worth preserving, so these DROPs are unconditional.

-- ─── UP ──────────────────────────────────────────────────────────────────────

-- Blocks as typed JSON (replaces the Strapi Dynamic Zone)
alter table public.landing_pages
  add column if not exists blocks jsonb not null default '[]'::jsonb;

comment on column public.landing_pages.blocks is
  'Ordered array of landing-page blocks. Shape is validated in the app by lib/schemas/blocks.ts (ADR-0007); intentionally not constrained by a DB-level JSON schema so validation errors stay readable.';

-- Retire the webhook retry cron before dropping the table it reads
do $$
begin
  if exists (select 1 from cron.job where jobname = 'retry-failed-webhooks') then
    perform cron.unschedule('retry-failed-webhooks');
  end if;
exception
  when undefined_table then null;  -- pg_cron not installed in this environment
end $$;

-- Retire the lead-notification webhook trigger (created directly in SQL, not via a
-- migration — see docs/HISTORY.md 2026-07-20) and its helper function
drop trigger if exists on_new_lead on public.leads;
drop function if exists public.notify_new_lead() cascade;

-- Retry bookkeeping has no consumer left
drop table if exists public.webhook_retries;

-- Strapi's isolated schema (ADR-0006) goes with Strapi itself
drop schema if exists strapi cascade;
