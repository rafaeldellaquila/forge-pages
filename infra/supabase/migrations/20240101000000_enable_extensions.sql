-- Enable required PostgreSQL extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";   -- for HTTP calls from pg_cron

comment on schema public is 'forge-pages public schema';
