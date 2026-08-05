# Carried-over learnings

Hard-won details from the pre-MVP build (2026-07 → 2026-08-04) that are **still true**
for the current stack. Everything specific to the retired Nuxt/Vue/Strapi/NocoDB/VPS
stack was dropped with it (ADR-0007) — recoverable from git history if ever needed.

## Supabase: API keys

- **Publishable/secret keys only**; the legacy `anon`/`service_role` JWT keys are disabled
  on this project. `SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`) maps to the `anon` DB
  role, `SUPABASE_SECRET_KEY` (`sb_secret_…`) to `service_role`.
- **The new keys are not JWTs.** Send them on the `apikey` header — `Authorization: Bearer`
  returns *Invalid JWT*. This only bites raw HTTP (`pg_net`, webhooks, curl); `supabase-js`
  handles it. In SQL, read them from Vault, never hardcode.
- **RLS policies alone don't grant access.** Supabase does not auto-grant DML on new
  tables, so every role also needs explicit table privileges — and those privileges must
  not be *wider* than the policies (see the grants section below).
- **An anon INSERT needs `Prefer: return=minimal`.** `anon` has INSERT but no SELECT policy
  on `leads`, so `return=representation` triggers a post-insert SELECT that fails RLS
  (`42501`). Only affects direct publishable-key calls; the server inserts with the secret
  key.
- **Disable legacy keys via the Management API**: `PUT /v1/projects/{ref}/api-keys/legacy?enabled=false`
  — `enabled` is a **query param**; the JSON-body and PATCH forms 400.
- **`400 "Resource has been removed"`** from Management endpoints means the project ref
  itself is gone, not an API outage.

## Supabase CLI

- **Always `--workdir infra`.** `config.toml` lives at `infra/supabase/`; without the flag
  the CLI creates a stray `./supabase/` at the repo root and links the project there
  (now gitignored, and the mise tasks hardcode the flag).
- **`supabase db execute` does not exist** (CLI 2.111: `diff|push|reset|dump|pull|lint|…`).
  Seeding runs through `db reset`, driven by `config.toml`'s `[db.seed] sql_paths` — without
  that key the `seed/` directory is ignored entirely.
- **Auth headless**: `supabase login` needs a TTY; set `SUPABASE_ACCESS_TOKEN` (`sbp_…`) in
  the root `.env` instead — mise auto-loads it. `supabase link --password` fails SASL right
  after a project is created; reset the DB password via
  `PATCH /v1/projects/{ref}/database/password` first, then link.
- **`db push` succeeding does not mean cloud matches the migrations.** Run
  `supabase db diff --linked` afterwards — that is how the grant drift below was found.
- A `link` run from the wrong directory can leave an orphan `remote_schema` entry in the
  cloud migration history; repair with `supabase migration repair --status reverted`.

## Postgres

- **Table grants are the second security layer and must not be wider than the RLS
  policies.** This project had `anon` *and* `authenticated` holding full DML on all three
  tables while the policies allowed far less. RLS still blocked it, so nothing was
  exploitable — but the next permissive policy (or RLS being toggled off) would have opened
  write access silently. Fixed in `20260804000001_revoke_anon_write_grants.sql`, which also
  runs `alter default privileges … revoke` so new tables don't reintroduce it.
- **A `DROP … IF EXISTS` with a guessed name silently no-ops.** A migration dropped
  `notify_new_lead()` when the real function was `on_new_lead_webhook()`; it reported
  success and the function outlived its trigger. Confirm the actual name first.
- **PostgREST can't alias flat columns into nested JSON** in a `.select()` string — select
  the flat columns (aliased to camelCase) and assemble nested objects in TS after the query
  returns.

## Cloudflare

- **Account-scoped API tokens 401 on `/user/tokens/verify`** — that endpoint is user-scoped.
  Validate against an account endpoint instead. A 401 there does not mean a bad token.
- **Validate a Turnstile secret without a widget**: POST `siteverify` with
  `response=dummy` — `invalid-input-response` means the secret is good;
  `invalid-input-secret` means it isn't.
- **Turnstile test keys always pass**: site `1x00000000000000000000AA`, secret
  `1x0000000000000000000000000000000AA`.

## Local multi-tenant testing

- Use `*.localhost` subdomains — browsers resolve them to loopback with no `/etc/hosts`
  entry, and the tenant middleware strips the port. Seed one `landing_pages` row per
  domain; bare `localhost` is deliberately not a tenant.

## Tooling

- **mise task scripts are rendered through tera**, so `${#ARRAY[@]}` breaks parsing (`{#`
  opens a tera comment). Use `'''` literal blocks (not `"""`) when a script contains shell
  quoting — basic strings process escapes and `\'` throws a TOML parse error.
- **`[env] _.file = ".env"`** silently ignores a missing file — safe on fresh clones.
- **Keep `.env` values bare**: no surrounding quotes, no inline `#` comments. mise's dotenv
  parser captures both verbatim as part of the value.
- **`.gitignore`'s `.env` patterns don't match arbitrary `.env.<name>` files** — `.env`,
  `.env.local`, `.env.*.local`, `.env.production`, `.env.staging` all miss e.g. `.env.bak`
  or `.env.strapi`. Any ad-hoc `.env.*` file needs an explicit entry.
- **`.npmrc` pins `registry=https://registry.npmjs.org/`**: the machine's global npm config
  points at a private CodeArtifact registry that 401s.
- **Anthropic key check is free**: `GET /v1/models` bills no tokens.
- **GitHub has no org-level PAT** — every PAT is personal; the org equivalent is a GitHub
  App. No workflow here reads a PAT (`GITHUB_TOKEN` covers checkout/PR comments), so the
  personal PAT was deliberately not rotated during the account migration.
- **zsh globs unquoted URLs**: `curl https://…?limit=1` fails with "no matches found".
  Always quote URLs containing a query string.
