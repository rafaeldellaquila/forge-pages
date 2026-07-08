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
