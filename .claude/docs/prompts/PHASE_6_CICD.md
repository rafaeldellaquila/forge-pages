# Phase 6 — CI/CD

> **Before starting**: Read `CLAUDE.md` in full. Phases 1–5 must be complete.
> **Commit strategy**: Ask before every commit. Use Conventional Commits.
> **Scope**: `.github/` only. All workflows use `workflow_dispatch` trigger until explicitly activated.
> **Cost**: GitHub Actions free tier = 2,000 min/month on private repos. These workflows stay inactive until you decide to activate them.

---

## Objective

Create all GitHub Actions workflows in ready-to-activate state. Nothing runs automatically yet — every workflow uses `workflow_dispatch` as the primary trigger, with the real trigger commented out. When you are ready to activate a workflow, uncomment the trigger and push.

---

## Tasks — execute in this exact order

### 1. Workflow: CI — Lint and Typecheck

Create `.github/workflows/ci.yml`:

```yaml
name: CI — Lint & Typecheck

# Activate by uncommenting the push trigger below:
# on:
#   push:
#     branches: ['**']
#   pull_request:
#     branches: [main]

on:
  workflow_dispatch:

jobs:
  lint-and-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup mise
        uses: jdx/mise-action@v2

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run Biome lint
        run: pnpm run lint

      - name: Run TypeScript check
        run: pnpm run typecheck
```

---

### 2. Workflow: CI — Build check

Create `.github/workflows/build.yml`:

```yaml
name: CI — Build Check

# Activate by uncommenting:
# on:
#   pull_request:
#     branches: [main]

on:
  workflow_dispatch:

jobs:
  build-web:
    name: Build Nuxt
    runs-on: ubuntu-latest

    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
      STRAPI_URL: ${{ secrets.STRAPI_URL }}
      STRAPI_API_TOKEN: ${{ secrets.STRAPI_API_TOKEN }}
      NUXT_SECRET_KEY: ${{ secrets.NUXT_SECRET_KEY }}
      NUXT_PUBLIC_SITE_URL: ${{ secrets.NUXT_PUBLIC_SITE_URL }}
      NUXT_PUBLIC_POSTHOG_KEY: ${{ secrets.NUXT_PUBLIC_POSTHOG_KEY }}
      NUXT_PUBLIC_POSTHOG_HOST: https://app.posthog.com
      NUXT_PUBLIC_SENTRY_DSN: ${{ secrets.NUXT_PUBLIC_SENTRY_DSN }}
      NUXT_PUBLIC_TURNSTILE_SITE_KEY: ${{ secrets.NUXT_PUBLIC_TURNSTILE_SITE_KEY }}
      UPSTASH_REDIS_REST_URL: ${{ secrets.UPSTASH_REDIS_REST_URL }}
      UPSTASH_REDIS_REST_TOKEN: ${{ secrets.UPSTASH_REDIS_REST_TOKEN }}
      TURNSTILE_SECRET_KEY: ${{ secrets.TURNSTILE_SECRET_KEY }}
      SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
      FLIPT_URL: ${{ secrets.FLIPT_URL }}
      FLIPT_TOKEN: ${{ secrets.FLIPT_TOKEN }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup mise
        uses: jdx/mise-action@v2

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages/ui
        run: pnpm --filter ui build

      - name: Build Nuxt
        run: pnpm --filter web build
```

---

### 3. Workflow: Database Backup

Create `.github/workflows/backup.yml`:

```yaml
name: Database Backup

# Activate by uncommenting:
# on:
#   schedule:
#     - cron: '0 3 * * *'   # Daily at 03:00 UTC

on:
  workflow_dispatch:

jobs:
  backup:
    name: pg_dump → commit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Install PostgreSQL client
        run: sudo apt-get install -y postgresql-client

      - name: Run pg_dump
        env:
          PGPASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
        run: |
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          mkdir -p backups
          pg_dump \
            -h ${{ secrets.SUPABASE_DB_HOST }} \
            -p 5432 \
            -U postgres \
            -d postgres \
            --no-password \
            --format=custom \
            --file=backups/backup_${TIMESTAMP}.dump
          # Keep only last 30 backups
          ls -t backups/*.dump | tail -n +31 | xargs -r rm

      - name: Commit backup
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add backups/
          git diff --staged --quiet || git commit -m "chore(backup): daily database snapshot $(date +%Y-%m-%d)"
          git push
```

Add `backups/` to `.gitignore`? No — backups are the point of this workflow. They should be committed. The backups folder is small (text-based pg_dump) and the 30-file rotation keeps it bounded.

---

### 4. Workflow: Dependabot security PRs

Create `.github/dependabot.yml`:

```yaml
version: 2

updates:
  # pnpm workspace root
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
      time: "09:00"
      timezone: "America/Sao_Paulo"
    open-pull-requests-limit: 5
    groups:
      development-dependencies:
        dependency-type: development
      production-dependencies:
        dependency-type: production
    ignore:
      # Major version updates require manual review
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]

  # GitHub Actions
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 3
```

---

### 5. Workflow: Claude PR Review (manual)

Create `.github/workflows/claude-review.yml`:

```yaml
name: Claude PR Review

# This workflow runs Claude Code to review PRs against CLAUDE.md conventions.
# Activate by uncommenting the pull_request trigger.
# Note: requires ANTHROPIC_API_KEY secret set in repository settings.

# on:
#   pull_request:
#     types: [opened, synchronize]

on:
  workflow_dispatch:
    inputs:
      pr_number:
        description: PR number to review
        required: true
        type: string

jobs:
  review:
    name: Claude Code Review
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup mise
        uses: jdx/mise-action@v2

      - name: Get PR diff
        id: diff
        run: |
          git diff origin/main...HEAD > pr.diff
          echo "diff_size=$(wc -c < pr.diff)" >> $GITHUB_OUTPUT

      - name: Claude review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          npx @anthropic-ai/claude-code \
            --print \
            "You are reviewing a pull request for the forge-pages project.

            Read CLAUDE.md first, then review the following diff against the project conventions:
            - TypeScript strict (no any)
            - Biome formatting
            - Security checklist (if new endpoint or form)
            - packages/types updated if new data contracts
            - Conventional Commits format
            - No secrets in code
            - No console.log

            Output a brief review with: APPROVED or NEEDS_CHANGES, followed by specific comments.

            Diff:
            $(cat pr.diff)" > review.md

      - name: Post review comment
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs')
            const review = fs.readFileSync('review.md', 'utf8')
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: ${{ github.event.inputs.pr_number || github.event.pull_request.number }},
              body: `## 🤖 Claude Code Review\n\n${review}`
            })
```

---

### 6. GitHub repository settings documentation

Create `.github/SETUP.md` documenting all secrets required:

```markdown
# Repository Setup — GitHub Secrets

All secrets are configured in: Settings → Secrets and variables → Actions

## Required secrets

### Supabase
- `SUPABASE_URL` — Project URL
- `SUPABASE_ANON_KEY` — Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-side only)
- `SUPABASE_DB_HOST` — Direct database host (for pg_dump)
- `SUPABASE_DB_PASSWORD` — Database password

### Strapi
- `STRAPI_URL` — Production Strapi URL
- `STRAPI_API_TOKEN` — Read-only API token

### Nuxt
- `NUXT_SECRET_KEY` — Session secret
- `NUXT_PUBLIC_SITE_URL` — Production site URL

### Upstash
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Cloudflare Turnstile
- `TURNSTILE_SECRET_KEY`
- `NUXT_PUBLIC_TURNSTILE_SITE_KEY`

### PostHog
- `NUXT_PUBLIC_POSTHOG_KEY`

### Sentry
- `NUXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` — for source map uploads

### Flipt
- `FLIPT_URL`
- `FLIPT_TOKEN`

### Claude (for PR review workflow)
- `ANTHROPIC_API_KEY`

## Activating workflows

To activate a workflow, edit the file and uncomment the non-dispatch trigger:
1. Edit `.github/workflows/<workflow>.yml`
2. Uncomment the `on: push/pull_request/schedule` block
3. Comment out or remove the `workflow_dispatch` block (or keep both)
4. Commit and push
```

---

### 7. Branch protection rules (manual — GitHub dashboard)

Configure in: Settings → Branches → Add branch protection rule for `main`:

- [x] Require pull request reviews before merging (1 reviewer)
- [x] Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - When CI is activated: add `lint-and-typecheck` as required check
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

Document these settings here once configured.

---

## Validation checklist before closing Phase 6

- [ ] All 4 workflow files exist in `.github/workflows/`
- [ ] All workflows use `workflow_dispatch` as primary trigger
- [ ] Real triggers are present but commented out in each workflow
- [ ] `dependabot.yml` exists in `.github/`
- [ ] `SETUP.md` documents all required secrets
- [ ] `PR_TEMPLATE.md` exists in `.github/`
- [ ] Manually trigger the lint workflow via GitHub Actions UI → confirm it runs successfully
- [ ] Manually trigger the backup workflow → confirm a backup file is committed
- [ ] All secrets listed in `SETUP.md` are added to repository settings
- [ ] Branch protection rules configured on `main`

---

## Commit at the end of Phase 6

Ask for confirmation:
```bash
git add .github/
git commit -m "chore(ci): add GitHub Actions workflows (inactive — workflow_dispatch only)

- CI lint+typecheck workflow (activate: uncomment push trigger)
- CI build check workflow (activate: uncomment pull_request trigger)
- Daily backup workflow via pg_dump (activate: uncomment schedule)
- Dependabot weekly security PRs for npm and GitHub Actions
- Claude PR review workflow (manual dispatch, requires ANTHROPIC_API_KEY)
- Repository setup documentation with all required secrets
- Branch protection rules documented"

git push origin main
```

---

## Update CLAUDE.md

Mark Phase 6 as complete in section 14:
```markdown
- [x] Phase 6 — CI/CD (GitHub Actions, backup workflow, Dependabot)
```

Update the current state to:
```markdown
**All 6 phases complete. Platform ready for first client onboarding.**
```

---

## 🎉 Project complete

All phases done. The platform is ready to onboard the first client:

1. Add client to `clients` table in Supabase
2. Add `landing_pages` record with client's domain
3. Create content in Strapi for that domain (all 10 blocks available)
4. Register domain in Domainee (SSL auto-provisioned)
5. Client points CNAME to platform
6. Monitor via UptimeRobot
7. Leads flow: Supabase → Edge Function → Resend + WhatsApp → NocoDB

Refer to `docs/prompts/` for future phases:
- Block generator: `mise run gen:block <name>`
- New migration: `mise run gen:migration <name>`
- Onboarding checklist: to be documented after first real client
```
