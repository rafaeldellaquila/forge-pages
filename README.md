# forge-pages

Multi-tenant landing page platform. Each client gets a landing page on their own domain.

## Stack

See [CLAUDE.md](./.claude/CLAUDE.md) for the full architecture and conventions.

## Getting started

### Prerequisites

- [mise](https://mise.jdx.dev/) — manages Node and pnpm versions
- Environment variables configured (see `.env.example`)

### Setup

```bash
mise install          # install Node 24 and pnpm 11
pnpm install          # install all dependencies
cp .vscode/mcp.json.example .vscode/mcp.json   # configure MCP tokens
```

### Development

```bash
mise run dev:cms      # start Strapi (port 1337)
mise run dev:web      # start Nuxt (port 3000)
```

## Development phases

See `docs/prompts/` for the phase-by-phase implementation plan.
