# forge-pages — AGENTS.md

> Configuration reference for MCPs, agents, and automated scripts used in this project.
> Keep this file updated as new tools are added.

---

## MCP Servers (Claude Code / VS Code)

Committed config: `.mcp.json` at the repo root (four servers, no tokens inlined).

### Supabase MCP
Allows Claude to read the live database schema, generate migrations, and validate queries
against real table structures.

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

**Use when**: generating migrations, reviewing RLS policies, inspecting or editing
`landing_pages.blocks` JSON, validating schema consistency between `lib/types/blocks.ts`
and the actual DB.

---

### GitHub MCP
Allows Claude to open PRs, read issues, post review comments, and check workflow run status
directly.

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<from GitHub settings>"
      }
    }
  }
}
```

**Use when**: creating PRs after each phase, reviewing diffs, checking CI run results.

---

### Context7 MCP
Fetches up-to-date documentation for Next.js 16, React 19, Tailwind CSS v4, Zod 4,
`@opennextjs/cloudflare`, and Supabase. Critical because Next 16 / Tailwind 4 / OpenNext
are recent releases that may differ from training data.

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**Use when**: implementing anything with App Router conventions, Tailwind 4 syntax,
Server/Client Component boundaries, or the OpenNext Cloudflare adapter. Always prefer
Context7 docs over training data for these.

---

### Playwright MCP
Allows Claude to open a real browser and test form submissions, block rendering, and
multi-tenant routing against a running local dev server.

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    }
  }
}
```

**Use when**: validating that a new block renders correctly, testing the lead form flow
end-to-end, checking tenant resolution for a specific `*.localhost` domain.

---

## Claude Code VS Code Setup

Add MCP configs to `.vscode/mcp.json` (gitignored — never commit tokens):

```json
{
  "mcpServers": {
    "supabase": { ... },
    "github": { ... },
    "context7": { ... },
    "playwright": { ... }
  }
}
```

`.vscode/mcp.json` is in `.gitignore`; `.vscode/mcp.json.example` is committed with empty
token values.

---

## mise Task Runners

Defined in `.mise.toml`. Run with `mise run <task>`.

### Available tasks

| Task | Command | Description |
|---|---|---|
| `dev` | `mise run dev` | Start the Next.js dev server (port 3000) |
| `preview` | `mise run preview` | OpenNext build + local Workers runtime (port 8787) |
| `lint` | `mise run lint` | Biome check |
| `lint:fix` | `mise run lint:fix` | Biome check with auto-fix |
| `typecheck` | `mise run typecheck` | `tsc --noEmit` |
| `build` | `mise run build` | `next build` |
| `build:cloudflare` | `mise run build:cloudflare` | Build for Cloudflare Workers via OpenNext |
| `db:migrate` | `mise run db:migrate` | Apply pending migrations to Supabase (asks for confirmation) |
| `db:seed` | `mise run db:seed` | Run seed data for development |
| `db:backup` | `mise run db:backup` | Manual pg_dump to local `backups/` |
| `gen:migration <name>` | `mise run gen:migration add_column` | Generate timestamped SQL migration file |
| `gen:block <name>` | `mise run gen:block pricing` | Scaffold a React block component |

Deploy is a package script, not a mise task: `pnpm run deploy`
(`opennextjs-cloudflare build && wrangler deploy`).

---

## gen:block Agent

When you run `mise run gen:block <name>`, the script:

1. Converts the kebab-case name to PascalCase
2. Creates `components/blocks/<Name>Block.tsx` with a typed stub (skipped if it exists)
3. Prints the follow-up steps it does **not** do automatically:
   - add the `<Name>Block` interface to `lib/types/blocks.ts` (+ the `BlockType` union)
   - add its Zod schema to `lib/schemas/blocks.ts`
   - register it in the `blockComponentMap`

---

## gen:migration Agent

When you run `mise run gen:migration <name>`:

1. Creates `infra/supabase/migrations/<timestamp>_<name>.sql` with a header stub
2. UP only — Supabase migrations are irreversible, there is no DOWN
3. Prints a reminder to add RLS policies for new tables and to update
   `lib/types/blocks.ts` if new data contracts are introduced

---

## GitHub Actions

Most workflows are **inactive** (`on: workflow_dispatch`); their real triggers are present
but commented out. `ci.yml` is the exception — it runs on push and PR. Secrets reference:
`.github/SETUP.md`.

| Workflow | File | Trigger |
|---|---|---|
| CI — Lint + Typecheck | `ci.yml` | **active** — push to any branch, PR to `main` |
| CI — Build check | `build.yml` | inactive (`pull_request` to `main` when activated) |
| Deploy — Cloudflare Workers | `deploy.yml` | inactive (`push` to `main` when activated) |
| Backup — pg_dump | `backup.yml` | inactive (daily cron 03:00 UTC when activated) |
| Dependabot | `dependabot.yml` | weekly (npm + github-actions) |
| Claude PR Review | `claude-review.yml` | manual only — deliberately kept off to avoid per-PR API spend |
