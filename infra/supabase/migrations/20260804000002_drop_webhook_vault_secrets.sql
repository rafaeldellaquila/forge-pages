-- Migration: drop_webhook_vault_secrets
-- Created at: 2026-08-04
-- Description: Removes the Vault secrets that only the retired lead-notification
-- webhook read (ADR-0007). `project_url` and `secret_key` were created per-environment
-- so the pg_net trigger and the retry cron could call the handle-lead-webhook Edge
-- Function without hardcoding a key (see docs/HISTORY.md 2026-07-20). The trigger, the
-- cron job, and the Edge Function are all gone, so these are inert — and `secret_key`
-- held a live `sb_secret_...` value, which should not sit in Vault with no consumer.
--
-- Guarded so it is a no-op in environments that never had them (e.g. a fresh local
-- stack, where these were never created).

-- ─── UP ──────────────────────────────────────────────────────────────────────

do $$
begin
  delete from vault.secrets where name in ('project_url', 'secret_key');
exception
  when undefined_table then null;   -- supabase_vault not installed
  when insufficient_privilege then
    raise notice 'insufficient privilege to prune vault.secrets — remove project_url/secret_key manually';
end $$;
