-- Close the anon insert path on `leads`.
--
-- 20240101000002_enable_rls.sql let `anon` insert leads directly, from the era
-- when the browser was expected to write to Supabase itself. Since Fase 2 every
-- lead arrives through POST /api/leads, which verifies Turnstile server-side and
-- resolves landing_page_id from the Host header, then inserts with the secret key
-- (service_role). The anon route is therefore unused — and it is the one way to
-- reach `leads` while skipping the bot check, which matters the moment the
-- publishable key is ever exposed to a client bundle.
--
-- Reads are unaffected: anon never had SELECT on leads.

drop policy if exists "anon_insert_leads" on public.leads;

revoke insert on public.leads from anon;
