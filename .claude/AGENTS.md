# forge-pages — AGENTS.md

> Configuration reference for MCPs, agents, and automated scripts used in this project.
> Keep this file updated as new tools are added.

---

## MCP Servers (Claude Code / VS Code)

### Supabase MCP
Allows Claude to read the live database schema, generate migrations, and validate queries against real table structures.

```json
{
  "mcpServers": {
      "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=<your-project-ref>",
    },
  }
}
```

**Use when**: generating migrations, reviewing RLS policies, validating schema consistency between `packages/types` and actual DB.

---

### GitHub MCP
Allows Claude to open PRs, read issues, post review comments, and check workflow run status directly.

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
Fetches up-to-date documentation for Nuxt 3, Strapi 5, Tailwind CSS v4, Supabase, and other stack dependencies. Critical because Tailwind 4 and Strapi 5 are recent releases that may differ from training data.

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

**Use when**: implementing anything with Tailwind 4 syntax, Strapi 5 APIs, or Nuxt 3 server routes. Always prefer Context7 docs over training data for these.

---

### Sentry MCP
Allows Claude to fetch recent error events, read stack traces, and suggest fixes without leaving the terminal.

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "<from Sentry settings>",
        "SENTRY_ORG": "forge-co-tech",
        "SENTRY_PROJECT": "forge-pages"
      }
    }
  }
}
```

**Use when**: debugging production errors. Never `console.log` — check Sentry first.

---

### Playwright MCP
Allows Claude to open a real browser and test form submissions, block rendering, and multi-tenant routing against a running local dev server.

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

**Use when**: validating that a new block renders correctly, testing the lead form flow end-to-end, checking tenant resolution for a specific domain.

---

## Claude Code VS Code Setup

Add MCP configs to `.vscode/mcp.json` (gitignored — never commit tokens):

```json
{
  "mcpServers": {
    "supabase": { ... },
    "github": { ... },
    "context7": { ... },
    "sentry": { ... },
    "playwright": { ... }
  }
}
```

Add `.vscode/mcp.json` to `.gitignore`. Commit `.vscode/mcp.json.example` with empty token values.

---

## mise Task Runners

Defined in `.mise.toml`. Run with `mise run <task>`.

### Available tasks

| Task | Command | Description |
|---|---|---|
| `dev` | `mise run dev` | Start all apps in dev mode (web + cms) |
| `dev:web` | `mise run dev:web` | Start Nuxt only |
| `dev:cms` | `mise run dev:cms` | Start Strapi only |
| `gen:block <name>` | `mise run gen:block hero` | Scaffold new block: Vue component + Story + Type |
| `gen:migration <name>` | `mise run gen:migration add_column` | Generate timestamped SQL migration file |
| `db:migrate` | `mise run db:migrate` | Apply pending migrations to Supabase (asks for confirmation) |
| `db:seed` | `mise run db:seed` | Run seed data for development |
| `db:backup` | `mise run db:backup` | Manual pg_dump to local file |
| `lint` | `mise run lint` | Run Biome check on all packages |
| `lint:fix` | `mise run lint:fix` | Run Biome check --apply |
| `typecheck` | `mise run typecheck` | Run tsc --noEmit on all packages |
| `storybook` | `mise run storybook` | Start Storybook for packages/ui |
| `build:ui` | `mise run build:ui` | Build packages/ui |
| `changeset` | `mise run changeset` | Create a new changeset entry |
| `release` | `mise run release` | Version packages and generate changelog |

---

## gen:block Agent

When you run `mise run gen:block <name>`, the script:

1. Reads the existing `HeroBlock.vue` as a reference template
2. Creates `packages/ui/src/blocks/<Name>Block.vue` following the same pattern
3. Creates `packages/ui/src/blocks/<Name>Block.stories.ts`
4. Creates `packages/types/src/blocks/<name>.ts` with a typed interface
5. Appends the export to `packages/types/src/index.ts`
6. Prints the Strapi component schema to copy into the admin

**Reference block**: Always use `HeroBlock.vue` as the canonical example for new blocks.

---

## gen:migration Agent

When you run `mise run gen:migration <name>`:

1. Reads the latest migration file to understand current schema state
2. Creates `infra/supabase/migrations/<timestamp>_<name>.sql`
3. Includes the migration SQL (UP only — Supabase migrations are irreversible)
4. Prints a reminder to review RLS policies if new tables are created

---

## GitHub Actions (Phase 6 — currently disabled)

All workflows use `on: workflow_dispatch` until explicitly activated.

| Workflow | File | Trigger (when activated) |
|---|---|---|
| CI — Lint + Typecheck | `ci.yml` | Push to any branch |
| CI — Build check | `build.yml` | PR to main |
| Backup — pg_dump | `backup.yml` | Daily cron 03:00 UTC |
| Dependabot security PRs | `dependabot.yml` | Weekly |
| Claude PR Review | `claude-review.yml` | PR opened (manual trigger for now) |

---

## Flipt Feature Flags

Config: `infra/flipt/feature-flags.yaml`
SDK: `@flipt-io/flipt` in both `apps/web` and `apps/cms`

### Flag naming convention
`<scope>.<feature>` — e.g.:
- `blocks.services-tabs` — enable services block with tabs variant
- `notifications.whatsapp` — enable WhatsApp notifications
- `analytics.posthog` — enable PostHog tracking

### Usage in Nuxt (server-side only)
```ts
import { FliptClient } from '@flipt-io/flipt'

const flipt = new FliptClient({ url: process.env.FLIPT_URL })
const enabled = await flipt.evaluation.boolean({
  flagKey: 'blocks.services-tabs',
  entityId: tenantId,
  context: {}
})
```

Feature flags are **never** evaluated client-side to avoid key exposure.
