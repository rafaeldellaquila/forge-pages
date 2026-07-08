# Phase 1 — Scaffolding

> **Before starting**: Read `CLAUDE.md` in full.
> **Commit strategy**: Ask before every commit. Use Conventional Commits.
> **Dependencies**: Ask before installing anything not listed here.

---

## Objective

Bootstrap the complete monorepo structure for `forge-pages` from scratch. By the end of this phase, the repo must be ready for development: correct folder structure, all tooling configured, TypeScript strict, shared types skeleton, and a clean initial commit.

Do not implement any application logic in this phase. Only structure and tooling.

---

## Prerequisites (do these manually before running this prompt)

1. Create the repo at `github.com/forge-co-tech/forge-pages` (private)
2. Clone it locally
3. Install mise: `curl https://mise.jdx.dev/install.sh | sh`
4. Install pnpm: `npm install -g pnpm@latest`
5. Have Node 24 LTS available (mise will manage it after setup)

---

## Tasks — execute in this exact order

### 1. mise setup

Create `.mise.toml` at root:

```toml
[tools]
node = "24"
pnpm = "11"

[env]
PNPM_HOME = "~/.local/share/pnpm"

[tasks.dev]
description = "Start all apps in parallel"
run = "pnpm --filter './apps/*' run dev"

[tasks."dev:web"]
description = "Start Nuxt dev server"
run = "pnpm --filter web dev"

[tasks."dev:cms"]
description = "Start Strapi dev server"
run = "pnpm --filter cms develop"

[tasks.lint]
description = "Run Biome on all packages"
run = "biome check ."

[tasks."lint:fix"]
description = "Run Biome with auto-fix"
run = "biome check --apply ."

[tasks.typecheck]
description = "TypeScript check all packages"
run = "pnpm -r typecheck"

[tasks.storybook]
description = "Start Storybook"
run = "pnpm --filter ui storybook"

[tasks."build:ui"]
description = "Build packages/ui"
run = "pnpm --filter ui build"

[tasks.changeset]
description = "Create a new changeset"
run = "pnpm changeset"

[tasks.release]
description = "Version and generate changelog"
run = "pnpm changeset version && pnpm changeset publish"

[tasks."gen:migration"]
description = "Generate a new timestamped migration file"
run = """
#!/usr/bin/env bash
NAME=${1:-unnamed}
TIMESTAMP=$(date +%Y%m%d%H%M%S)
FILE="infra/supabase/migrations/${TIMESTAMP}_${NAME}.sql"
echo "-- Migration: ${NAME}" > $FILE
echo "-- Created at: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> $FILE
echo "" >> $FILE
echo "Created: $FILE"
"""
```

Run `mise install` to install Node 24 and pnpm.

---

### 2. pnpm workspace

Create `pnpm-workspace.yaml` at root:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Create root `package.json`:

```json
{
  "name": "forge-pages",
  "private": true,
  "version": "0.0.0",
  "description": "Multi-tenant landing page platform",
  "engines": {
    "node": ">=24",
    "pnpm": ">=11"
  },
  "scripts": {
    "dev": "mise run dev",
    "lint": "biome check .",
    "lint:fix": "biome check --apply .",
    "typecheck": "pnpm -r typecheck",
    "changeset": "changeset",
    "release": "changeset version && changeset publish"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@changesets/cli": "^2.27.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0",
    "typescript": "^5.6.0"
  }
}
```

---

### 3. Biome (root config)

Create `biome.json` at root. This is the shared config inherited by all packages:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "security": {
        "noSecretInSource": "error"
      },
      "suspicious": {
        "noExplicitAny": "error",
        "noConsole": "warn"
      },
      "style": {
        "useConst": "error",
        "useTemplate": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "asNeeded"
    }
  },
  "files": {
    "ignore": [
      "node_modules",
      "dist",
      ".nuxt",
      ".output",
      "build",
      ".strapi",
      "storybook-static"
    ]
  }
}
```

---

### 4. TypeScript root config

Create `tsconfig.base.json` at root (shared base for all packages):

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleDetection": "force",
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "exclude": ["node_modules", "dist"]
}
```

---

### 5. Husky + lint-staged

Initialize Husky:

```bash
pnpm dlx husky init
```

Create `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
pnpm lint-staged
```

Add lint-staged config to root `package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx,vue,js,json}": ["biome check --apply --no-errors-on-unmatched"]
  }
}
```

---

### 6. Changesets

Initialize Changesets:

```bash
pnpm changeset init
```

Update `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

---

### 7. Directory skeleton

Create these directories with `.gitkeep` where needed:

```
apps/web/
apps/cms/
packages/ui/src/blocks/
packages/ui/src/components/
packages/types/src/blocks/
packages/types/src/
packages/config/
infra/supabase/migrations/
infra/supabase/seed/
infra/supabase/functions/handle-lead-webhook/
infra/flipt/
.github/workflows/
docs/prompts/
```

---

### 8. packages/types — skeleton

Create `packages/types/package.json`:

```json
{
  "name": "@forge-pages/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "workspace:*"
  }
}
```

Create `packages/types/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "Bundler"
  },
  "include": ["src"]
}
```

Create `packages/types/src/index.ts` with all base types from CLAUDE.md section 8:

```ts
// Render mode
export type RenderMode = "blocks" | "custom";

// Landing page status
export type LandingPageStatus = "draft" | "published" | "archived";

// Lead status
export type LeadStatus = "new" | "contacted" | "converted" | "lost";

// Webhook channel
export type WebhookChannel = "email" | "whatsapp";

// Tenant config resolved from DB
export interface LandingPageConfig {
  id: string;
  clientId: string;
  domain: string;
  renderMode: RenderMode;
  status: LandingPageStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  seoOgImage: string | null;
  canonicalUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  fontFamily: string | null;
}

// Lead payload (form → DB)
export interface Lead {
  id: string;
  landingPageId: string;
  name: string;
  whatsapp: string;
  email: string | null;
  message: string | null;
  intent: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  status: LeadStatus;
  createdAt: string;
}

// Lead form input (before saving)
export interface LeadInput {
  name: string;
  whatsapp: string;
  email?: string;
  message?: string;
  intent?: string;
  turnstileToken: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

// Block types (re-exported from individual files)
export * from "./blocks/index";
```

Create `packages/types/src/blocks/index.ts`:

```ts
export * from "./header";
export * from "./hero";
export * from "./trust-icons";
export * from "./stats";
export * from "./value-proposition";
export * from "./services";
export * from "./differentials";
export * from "./testimonials";
export * from "./cta-form";
export * from "./footer";

// Union type of all blocks
export type { BlockType } from "./block-type";
```

Create one interface file per block in `packages/types/src/blocks/`.
Example for `packages/types/src/blocks/hero.ts`:

```ts
export interface HeroBlock {
  __component: "blocks.hero";
  badgeText?: string;
  headline: string;
  subheadline: string;
  ctaPrimaryLabel: string;
  ctaPrimaryLink: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryLink?: string;
  image?: { url: string; alternativeText?: string };
  imageAlt?: string;
}
```

Follow the same pattern for all 10 block types from CLAUDE.md section 6.

Create `packages/types/src/blocks/block-type.ts`:

```ts
import type { HeaderBlock } from "./header";
import type { HeroBlock } from "./hero";
import type { TrustIconsBlock } from "./trust-icons";
import type { StatsBlock } from "./stats";
import type { ValuePropositionBlock } from "./value-proposition";
import type { ServicesBlock } from "./services";
import type { DifferentialsBlock } from "./differentials";
import type { TestimonialsBlock } from "./testimonials";
import type { CtaFormBlock } from "./cta-form";
import type { FooterBlock } from "./footer";

export type BlockType =
  | HeaderBlock
  | HeroBlock
  | TrustIconsBlock
  | StatsBlock
  | ValuePropositionBlock
  | ServicesBlock
  | DifferentialsBlock
  | TestimonialsBlock
  | CtaFormBlock
  | FooterBlock;
```

---

### 9. packages/config — skeleton

Create `packages/config/package.json`:

```json
{
  "name": "@forge-pages/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./biome": "./biome.json",
    "./tailwind": "./tailwind.css"
  }
}
```

Create `packages/config/tailwind.css` (Tailwind v4 base):

```css
@import "tailwindcss";

@theme {
  /* Base design tokens — overridden per tenant via CSS variables */
  --color-primary: var(--tenant-primary, #065a82);
  --color-secondary: var(--tenant-secondary, #1c7293);
  --font-body: var(--tenant-font, "Inter"), system-ui, sans-serif;
}
```

---

### 10. .env.example

Create `.env.example` at root with all required keys:

```bash
# ─── Supabase ────────────────────────────────────────────────────────────────
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=          # sb_publishable_...
SUPABASE_SECRET_KEY=               # sb_secret_... — server-side / Edge Functions only

# ─── Strapi ──────────────────────────────────────────────────────────────────
STRAPI_URL=                        # e.g. https://cms.forge-pages.com
STRAPI_API_TOKEN=                  # read-only token for Nuxt → Strapi

# ─── Nuxt ────────────────────────────────────────────────────────────────────
NUXT_SECRET_KEY=                   # session / CSRF secret
NUXT_PUBLIC_SITE_URL=              # e.g. https://forge-pages.com

# ─── Upstash Redis ───────────────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ─── Cloudflare Turnstile ────────────────────────────────────────────────────
TURNSTILE_SECRET_KEY=
NUXT_PUBLIC_TURNSTILE_SITE_KEY=

# ─── Resend ──────────────────────────────────────────────────────────────────
RESEND_API_KEY=
RESEND_FROM_EMAIL=                 # e.g. noreply@forge-pages.com
RESEND_NOTIFICATION_EMAIL=         # internal team notification recipient

# ─── WhatsApp Cloud API ──────────────────────────────────────────────────────
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_NOTIFICATION_NUMBER=      # number that receives lead alerts

# ─── PostHog ─────────────────────────────────────────────────────────────────
NUXT_PUBLIC_POSTHOG_KEY=
NUXT_PUBLIC_POSTHOG_HOST=         # https://app.posthog.com

# ─── Sentry ──────────────────────────────────────────────────────────────────
SENTRY_DSN=
SENTRY_AUTH_TOKEN=                 # for source map uploads
NUXT_PUBLIC_SENTRY_DSN=

# ─── Flipt ───────────────────────────────────────────────────────────────────
FLIPT_URL=                         # e.g. https://flipt.forge-pages.com
FLIPT_TOKEN=

# ─── Domainee ────────────────────────────────────────────────────────────────
DOMAINEE_API_KEY=
```

---

### 11. .gitignore

Create comprehensive `.gitignore`:

```
# Dependencies
node_modules/
.pnpm-store/

# Environment — never commit real values
.env
.env.local
.env.*.local
.env.production
.env.staging

# Build outputs
dist/
.output/
.nuxt/
build/
storybook-static/

# Strapi
apps/cms/.strapi/
apps/cms/.tmp/
apps/cms/public/uploads/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
*.swp
*.swo

# MCP config (contains tokens)
.vscode/mcp.json

# Misc
.cache/
coverage/
```

---

### 12. VS Code workspace config

Create `.vscode/settings.json` (committed — no secrets):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

Create `.vscode/mcp.json.example` (template without tokens):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest"],
      "env": { "SUPABASE_ACCESS_TOKEN": "<your token here>" }
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "<your token here>" }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp-server"],
      "env": {
        "SENTRY_AUTH_TOKEN": "<your token here>",
        "SENTRY_ORG": "forge-co-tech",
        "SENTRY_PROJECT": "forge-pages"
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    }
  }
}
```

---

### 13. Pull Request template

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```markdown
## What does this PR do?

<!-- Brief description of the changes -->

## Type of change

- [ ] feat: New feature
- [ ] fix: Bug fix
- [ ] chore: Tooling / config
- [ ] docs: Documentation
- [ ] refactor: Refactoring

## Checklist

- [ ] Code follows conventions in CLAUDE.md
- [ ] TypeScript compiles without errors (`mise run typecheck`)
- [ ] Biome passes (`mise run lint`)
- [ ] No `any` types introduced
- [ ] No secrets in code
- [ ] Security checklist applied (if new endpoint or form)
- [ ] `packages/types` updated (if new or changed data contract)
- [ ] Storybook story added (if new UI component)
- [ ] CLAUDE.md section 14 updated if phase completed
```

---

### 14. Root README

Create `README.md` at root:

````markdown
# forge-pages

Multi-tenant landing page platform. Each client gets a landing page on their own domain.

## Stack

See [CLAUDE.md](./CLAUDE.md) for the full architecture and conventions.

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
````

### Development

```bash
mise run dev:cms      # start Strapi (port 1337)
mise run dev:web      # start Nuxt (port 3000)
```

## Development phases

See `docs/prompts/` for the phase-by-phase implementation plan.

````

---

### 15. Install root dependencies

Ask for confirmation, then run:
```bash
pnpm install
pnpm husky install
````

---

## Validation checklist before closing Phase 1

Run each item and confirm it passes before moving to Phase 2:

- [ ] `mise run lint` — Biome passes with no errors
- [ ] `mise run typecheck` — TypeScript strict passes on `packages/types`
- [ ] `git log --oneline` — shows exactly one commit: `chore: initialize forge-pages monorepo`
- [ ] `packages/types/src/blocks/` — has one `.ts` file per block (10 total)
- [ ] `packages/types/src/index.ts` — exports all types cleanly
- [ ] `.env.example` — contains all keys listed in this prompt
- [ ] `.gitignore` — `.env` variants and `.vscode/mcp.json` are ignored
- [ ] `pnpm-workspace.yaml` — `apps/*` and `packages/*` declared
- [ ] `.mise.toml` — `mise run lint` and `mise run typecheck` work
- [ ] Husky hook triggers on `git commit` (test with a dummy change)

---

## Commit at the end of Phase 1

Ask for confirmation, then:

```bash
git add .
git commit -m "chore: initialize forge-pages monorepo

- pnpm workspaces + mise (Node 24 LTS)
- Biome (lint + format), strict TypeScript
- Husky + lint-staged pre-commit hook
- Changesets for versioning
- packages/types skeleton with all block interfaces
- packages/config with shared Tailwind v4 base
- .env.example with all required keys
- VS Code settings + MCP template
- PR template and README"

git push origin main
```

---

## Next step

Once this checklist passes, move to:

```
docs/prompts/PHASE_2_INFRA.md
```
