# forge-pages

Multi-tenant landing page platform. Each client gets a landing page on their own domain,
served by a single Next.js app that resolves the tenant from the `Host` header.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Zod 4 · TypeScript strict ·
Supabase (PostgreSQL) · Cloudflare Workers via `@opennextjs/cloudflare` · Biome · pnpm · mise.

See [CLAUDE.md](./.claude/CLAUDE.md) for the full architecture and conventions.

## Getting started

### Prerequisites

- [mise](https://mise.jdx.dev/) — pins Node 24 and pnpm 11
- Docker — the local Supabase stack runs in containers
- Environment variables configured (see `.env.example`)

### Setup

```bash
mise install          # install Node 24 and pnpm 11
pnpm install          # install dependencies
cp .env.example .env  # then fill in the blanks
```

The `onboard-local` skill (`bash .claude/skills/onboard-local/setup.sh`) automates the
whole bootstrap — dependencies, local Supabase, and the root `.env`.

### Development

```bash
mise run dev          # Next.js dev server → http://localhost:3000
mise run preview      # OpenNext build + local Workers runtime → http://localhost:8787
```

### Quality

```bash
mise run lint         # Biome check
mise run typecheck    # tsc --noEmit
mise run build        # next build
```

### Maintenance

```bash
mise run clean        # delete build artefacts (.next, .open-next, .wrangler, out)
mise run reset        # also delete node_modules and reinstall from the lockfile
```

`reset` asks for confirmation and never touches `.env` or the Supabase project link —
reach for it when a build behaves oddly or after switching branches with dependency
changes. Run `mise tasks` for the full list.

## Docs

| Doc | What it covers |
| --- | --- |
| `docs/LOCAL_DEVELOPMENT.md` | Full local runbook (Supabase, env, verification) |
| `docs/ADD_CLIENT.md` | Onboarding a new client / landing page |
| `docs/SECRETS.md` | Variable → consumer → dev/prod matrix |
| `docs/GO_LIVE.md` | Remaining work before the first paying client |
| `docs/HISTORY.md` | Carried-over gotchas (Supabase keys, CLI, Postgres grants, mise) |
| `docs/adr/` | Architecture decision records |
| `docs/pt-br/` | Portuguese guides for non-technical readers |
