# 6. Strapi database schema isolation

Date: 2026-08-04
Status: Accepted

## Context

Local Strapi (`apps/cms`) and the Supabase app tables (`clients`, `landing_pages`,
`leads`, `webhook_retries`) both connect to the same local Postgres instance
(`127.0.0.1:54322`, database `postgres`) started by the Supabase CLI. Strapi's
`DATABASE_SCHEMA` defaulted to `public` — the same schema Supabase's own migrations
manage — so both systems' tables lived side by side, unmanaged by either one's tooling.

This surfaced as an incident: running `supabase db reset --workdir infra` (routine when
testing a new Supabase migration) recreates the `postgres` database from
`infra/supabase/migrations` + seed files. Since Strapi's 78 tables (`admin_users`,
`landing_pages_cms`, all `components_*`, etc.) also lived in `public`, the reset wiped
them too — a system neither Supabase's CLI nor its migrations are aware of. Strapi's dev
server, still running, silently rebuilt its own schema from scratch on the next request,
producing a brand-new empty `admin_users` table. The result looked like "Strapi lost its
data and my login stopped working" — actually correct behavior for a nuked schema.
Content was separately recoverable via `apps/cms/scripts/seed-content.cjs`, but the admin
account was not, and Strapi's default `sendmail` email provider (nothing configured —
`apps/cms/config/plugins.ts` had no `email` key, no provider package installed) meant
password-reset emails were never actually delivered — `POST /admin/forgot-password`
always returns `204` regardless of whether sending succeeded, so the failure was silent.

## Decision

**Strapi gets its own Postgres schema, `strapi`**, separate from the `public` schema
Supabase's migrations own. `apps/cms/config/database.ts` already supported
`DATABASE_SCHEMA` (default `'public'`) — root `.env` now sets `DATABASE_SCHEMA=strapi`,
synced to `apps/cms/.env` via the existing `env:sync` allowlist (`CMS_VARS` in
`.mise.toml`). All of Strapi's existing tables and their sequences were moved from
`public` to `strapi` via `ALTER TABLE/SEQUENCE ... SET SCHEMA` (data-preserving — no
re-seed needed), rather than starting empty and re-seeding.

**Strapi's admin panel also gets a real email provider**: `@strapi/provider-email-nodemailer`
(pinned `5.50.0`, matching the core-version-lock convention already used for
`@strapi/provider-upload-aws-s3` and `@strapi/plugin-color-picker`), configured against
Resend's SMTP relay (`smtp.resend.com`) with the same `RESEND_API_KEY` /
`RESEND_FROM_EMAIL` already used for lead notifications. Those vars are now also synced
into `apps/cms/.env` (previously Edge-Function-only).

## Consequences

- `supabase db reset` (and any other Supabase-CLI operation that touches `public`) can no
  longer touch Strapi's tables — the two systems are now genuinely independent within the
  same physical database.
- Local admin-panel password resets are now actually deliverable, not just accepted.
- Prod Strapi hosting (VPS, ADR-0003) must set `DATABASE_SCHEMA` the same way — it isn't
  exposed to the `public` schema wipe risk today (separate DB), but the isolation is worth
  keeping consistent across environments regardless.
- If Strapi's data is ever genuinely wiped again (e.g. dropping the `strapi` schema
  directly), recovery is: re-run `apps/cms/scripts/seed-content.cjs` for content, and
  `strapi admin:create-user -e <email> -p <password> -f <first> -l <last>` for an admin
  account — no working password-reset flow is a valid recovery path when `admin_users` is
  empty (there's no account to reset).
