-- Migration: revoke_anon_write_grants
-- Created at: 2026-08-04
-- Description: Restores least privilege on the public tables and drops an orphaned
-- webhook helper function. Both found by `supabase db diff --linked` (ADR-0007).
--
-- Grant drift: the cloud project had `anon` and `authenticated` holding full DML on
-- all three tables, far wider than 20240101000002_enable_rls.sql grants. RLS was
-- still blocking it (no matching anon policy), so nothing was exploitable — but
-- grants are the second layer and must not be wider than the policies, or the next
-- permissive policy silently opens write access. `authenticated` is revoked too:
-- there are no Supabase Auth users, all privileged access is server-side.
--
-- Orphaned function: the real name is on_new_lead_webhook(), not the
-- notify_new_lead() an earlier migration guessed, so that DROP silently no-op'd and
-- the function outlived its trigger.

-- ─── UP ──────────────────────────────────────────────────────────────────────

-- 1. Reset to least privilege, then re-grant exactly what the app needs.
revoke all on public.clients from anon, authenticated;
revoke all on public.landing_pages from anon, authenticated;
revoke all on public.leads from anon, authenticated;

-- Mirrors 20240101000002_enable_rls.sql: publishable key reads published pages and
-- submits leads; nothing else.
grant select on public.landing_pages to anon;
grant insert on public.leads to anon;

-- Stop future tables in public from re-introducing the same drift.
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- 2. Drop the orphaned notification helper (its trigger is already gone).
drop function if exists public.on_new_lead_webhook() cascade;
