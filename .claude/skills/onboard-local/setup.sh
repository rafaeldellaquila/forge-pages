#!/usr/bin/env bash
# forge-pages local bootstrap — idempotent and non-destructive.
# Installs deps, boots local Supabase (migrations + seed on first run only) and fills
# the root .env (single source of truth — see docs/SECRETS.md). Does NOT start the dev
# server (the skill does that), never overwrites values already set in the root .env,
# and never wipes an already-initialized database.
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }

# ── 1. Prerequisites ─────────────────────────────────────────────────────────
say "Checking prerequisites"
command -v docker >/dev/null || { echo "✗ Docker is required"; exit 1; }
docker info >/dev/null 2>&1 || { echo "✗ Docker is not running — start it first"; exit 1; }
command -v mise >/dev/null || { echo "✗ mise is required (Node/pnpm + env loading) — https://mise.jdx.dev"; exit 1; }
mise install
echo "✓ prerequisites OK"

# ── 2. Dependencies ──────────────────────────────────────────────────────────
say "Installing dependencies"
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

# ── 4. Root .env (single source of truth) ────────────────────────────────────
say "Root .env"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  created from .env.example"
else
  echo "  exists — filling only empty values"
fi

# set_if_empty VAR VALUE — fills VAR in the root .env only when currently empty
set_if_empty() {
  local var="$1" val="$2" current
  current="$(grep -m1 "^${var}=" .env | cut -d= -f2- || true)"
  if grep -q "^${var}=" .env; then
    [ -z "$current" ] && sed -i "s|^${var}=.*|${var}=${val}|" .env
  else
    echo "${var}=${val}" >> .env
  fi
}

STATUS="$(pnpm exec supabase status --workdir infra 2>/dev/null)"
set_if_empty SUPABASE_URL "http://127.0.0.1:54321"
set_if_empty SUPABASE_PUBLISHABLE_KEY "$(echo "$STATUS" | grep -oE 'sb_publishable_[A-Za-z0-9_-]+' | head -1)"
set_if_empty SUPABASE_SECRET_KEY "$(echo "$STATUS" | grep -oE 'sb_secret_[A-Za-z0-9_-]+' | head -1)"
echo "  Supabase URL + keys ensured (Turnstile keys stay manual/optional)"

say "Bootstrap complete"
cat <<'EOF'
Next (the skill continues from here):
  • App     → mise run dev        (http://localhost:3000)
      the tenant comes from the Host header, so open a seeded subdomain:
      http://forgecompany.localhost:3000  (also forge-motos / clinica / advocacia)
  • Content → Supabase Studio (http://127.0.0.1:54323) → landing_pages → blocks (JSONB)
  • Preview → mise run preview    (Cloudflare Workers runtime, http://localhost:8787)
EOF
