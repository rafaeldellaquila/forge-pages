---
name: onboard-local
description: Bootstrap and run the forge-pages stack locally. Installs dependencies, boots local Supabase (migrations + seed), fills the root .env, then starts the Next.js dev server and verifies a tenant renders. Use when someone wants to set up the project from a clean clone, get everything running locally, or onboard a new developer. Idempotent and non-destructive — safe to re-run.
---

# Onboard / run forge-pages locally

Goal: from a clean clone (or a partial setup), get the app running and verified.
Full reference: `docs/LOCAL_DEVELOPMENT.md`. This skill automates it.

The bundled `setup.sh` is **idempotent and non-destructive**: it never overwrites values
already set in the root `.env` and never resets an already-initialized database.

## Steps

1. **Bootstrap** — run the setup script and read its output:
   ```bash
   bash .claude/skills/onboard-local/setup.sh
   ```
   It checks Docker, runs `pnpm install`, starts local Supabase, applies migrations + seed
   (first run only), and fills the **root `.env`** (single source of truth — Supabase URL
   and keys from `supabase status`; existing values never overwritten). There is no
   per-app env sync: mise auto-loads the root `.env` and Next.js reads it natively.

2. **Start the app** in the background and wait for it to answer on port 3000:
   ```bash
   mise run dev
   ```

3. **Verify** a seeded tenant renders (the app resolves the tenant from the `Host` header,
   so a bare `localhost` request has no tenant and 404s):
   ```bash
   curl -s -H "Host: forgecompany.localhost" http://localhost:3000/ \
     | grep -oiE '<title>[^<]*</title>'
   ```
   Seeded local tenants: `forgecompany.localhost`, `forge-motos.localhost`,
   `clinica.localhost`, `advocacia.localhost`.

4. **Report** the live URLs (app :3000, Supabase Studio :54323) and flag anything the user
   still needs to do — most commonly: the tenant's `blocks` JSONB array is empty (`[]` is
   the column default), so the page renders themed but contentless until blocks are added
   in Studio (`docs/LOCAL_DEVELOPMENT.md` §4).

## Notes
- Ports: Supabase API 54321 / DB 54322 / Studio 54323 / Mailpit 54324; Next.js 3000;
  `mise run preview` (local Workers runtime) 8787.
- Turnstile is optional locally — empty keys mean the bot check is skipped. The always-pass
  test pair is `1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`.
- There is no CMS: page content is the `blocks` JSONB column on `landing_pages`, edited in
  Supabase Studio. See `docs/LOCAL_DEVELOPMENT.md` §4.
- To wipe and reseed the DB deliberately: `pnpm exec supabase db reset --workdir infra`
  (destroys local leads and any block edits made in Studio).
- Env model: root `.env` is the single source of truth — see `docs/SECRETS.md`. Restart the
  dev server after editing it.
- Never commit `.env` files — they are gitignored.
