-- Schedule webhook retry job every 5 minutes
-- Picks up failed webhooks where next_retry_at <= now() and attempts < 3
--
-- Reads the project URL and secret API key from Vault. Set once per environment:
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('sb_secret_...', 'secret_key');
--
-- New API keys (sb_secret_...) are not JWTs: they must be sent on the apikey
-- header — the platform rejects them on Authorization: Bearer with Invalid JWT.
select cron.schedule(
  'retry-failed-webhooks',
  '*/5 * * * *',
  $$
    select
      net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
          || '/functions/v1/handle-lead-webhook',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'secret_key')
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
