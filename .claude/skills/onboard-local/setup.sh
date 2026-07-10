#!/usr/bin/env bash
# forge-pages local bootstrap — idempotent and non-destructive.
# Installs deps, boots local Supabase (migrations + seed on first run only),
# and generates apps/cms/.env + apps/web/.env if missing. Does NOT start dev
# servers (the skill does that) and never overwrites existing .env files or
# wipes an already-initialized database.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }

# ── 1. Prerequisites ─────────────────────────────────────────────────────────
say "Checking prerequisites"
command -v docker >/dev/null || { echo "✗ Docker is required"; exit 1; }
docker info >/dev/null 2>&1 || { echo "✗ Docker is not running — start it first"; exit 1; }
command -v mise >/dev/null && mise install || echo "  (mise not found — assuming Node 24 + pnpm are on PATH)"
command -v openssl >/dev/null || { echo "✗ openssl is required to generate Strapi secrets"; exit 1; }
echo "✓ prerequisites OK"

# ── 2. Dependencies ──────────────────────────────────────────────────────────
say "Installing workspace dependencies"
pnpm install

# ── 3. Local Supabase ────────────────────────────────────────────────────────
say "Starting local Supabase (idempotent)"
pnpm exec supabase start --workdir infra

DB_CONTAINER="$(docker ps --format '{{.Names}}' | grep -m1 'supabase_db' || true)"
[ -n "$DB_CONTAINER" ] || { echo "✗ Supabase DB container not found"; exit 1; }

say "Applying migrations + seed (first run only)"
if docker exec "$DB_CONTAINER" psql -U postgres -d postgres -tAc \
     "select to_regclass('public.landing_pages')" 2>/dev/null | grep -q landing_pages; then
  echo "  DB already initialized — skipping reset."
  echo "  (To wipe and reseed: pnpm exec supabase db reset --workdir infra)"
else
  pnpm exec supabase db reset --workdir infra
fi

# ── 4. Read local keys from supabase status ──────────────────────────────────
STATUS="$(pnpm exec supabase status --workdir infra 2>/dev/null)"
PUBLISHABLE_KEY="$(echo "$STATUS" | grep -oE 'sb_publishable_[A-Za-z0-9_-]+' | head -1)"
SECRET_KEY="$(echo "$STATUS" | grep -oE 'sb_secret_[A-Za-z0-9_-]+' | head -1)"

# ── 5. apps/cms/.env (generate if missing) ───────────────────────────────────
say "apps/cms/.env"
if [ -f apps/cms/.env ]; then
  echo "  exists — leaving as-is"
else
  rand() { openssl rand -base64 16; }
  cat > apps/cms/.env <<EOF
HOST=0.0.0.0
PORT=1337
APP_KEYS=$(rand),$(rand)
API_TOKEN_SALT=$(rand)
ADMIN_JWT_SECRET=$(rand)
TRANSFER_TOKEN_SALT=$(rand)
JWT_SECRET=$(rand)
ENCRYPTION_KEY=$(rand)

DATABASE_CLIENT=postgres
DATABASE_HOST=127.0.0.1
DATABASE_PORT=54322
DATABASE_NAME=postgres
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSL=false
EOF
  echo "  created with generated secrets + local DB"
fi

# ── 6. apps/web/.env (generate if missing) ───────────────────────────────────
say "apps/web/.env"
if [ -f apps/web/.env ]; then
  echo "  exists — leaving as-is"
else
  cat > apps/web/.env <<EOF
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=

SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=${PUBLISHABLE_KEY}
SUPABASE_SECRET_KEY=${SECRET_KEY}

# Optional integrations — empty = skipped/no-op locally
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
TURNSTILE_SECRET_KEY=
NUXT_PUBLIC_TURNSTILE_SITE_KEY=
NUXT_PUBLIC_POSTHOG_KEY=
NUXT_PUBLIC_POSTHOG_HOST=
NUXT_PUBLIC_SENTRY_DSN=
FLIPT_URL=
FLIPT_TOKEN=
EOF
  echo "  created (Supabase keys filled from 'supabase status'; STRAPI_API_TOKEN left blank)"
fi

say "Bootstrap complete"
cat <<'EOF'
Next (the skill continues from here):
  • Strapi  → mise run dev:cms   (http://localhost:1337/admin)
      first run: create admin, create a Landing Page with domain=localhost
      (Hero + CTA Form), Publish, then create a Read-only API token and put it
      in apps/web/.env as STRAPI_API_TOKEN.
  • Web     → mise run dev:web    (http://localhost:3000)
  • Storybook → mise run storybook (http://localhost:6006)
EOF
