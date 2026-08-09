-- pg_net's only known consumer was the webhook retry cron (net.http_post in
-- 20240101000003_create_retry_cron.sql), unscheduled and dropped along with its
-- table in 20260804000000_mvp_rewrite_reset.sql. No other migration, seed file, or
-- doc references net.* since. Dropping it outright closes the pre-existing
-- schema-location drift (cloud had it installed outside "public") without needing
-- to know which schema it currently lives in — a relocation would.
drop extension if exists "pg_net" cascade;
