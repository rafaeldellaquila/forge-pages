# Phase 3 — CMS (Strapi 5)

> **Before starting**: Read `CLAUDE.md` in full. Phases 1 and 2 must be complete.
> **Commit strategy**: Ask before every commit. Use Conventional Commits.
> **Scope**: `apps/cms` only. Do not touch Nuxt or Supabase in this phase.

---

## Objective

Initialize and configure Strapi 5 in `apps/cms` with all block content types matching the Dynamic Zone spec in CLAUDE.md. By the end of this phase, Strapi is running locally, all 10 blocks are configured, and the API returns typed content that matches `packages/types`.

---

## Prerequisites

1. Phases 1 and 2 complete and validated
2. Node 24 active (`node --version` should output `v24.x.x`)
3. Supabase connection string available (from Phase 2)
4. `@forge-pages/types` built and available in workspace

---

## Tasks — execute in this exact order

### 1. Initialize Strapi 5

Ask for confirmation, then from the repo root:

```bash
cd apps
pnpm dlx create-strapi@latest cms \
  --typescript \
  --use-pnpm \
  --skip-cloud \
  --dbclient=postgres \
  --dbhost=$SUPABASE_DB_HOST \
  --dbport=5432 \
  --dbname=postgres \
  --dbusername=postgres \
  --dbpassword=$SUPABASE_DB_PASSWORD \
  --dbssl=true
```

> Note: Strapi 5 creates its own tables (prefixed `strapi_`) in the same Supabase Postgres database. This is intentional — our tables (`clients`, `leads`, etc.) and Strapi's tables coexist in the same schema.

---

### 2. Configure apps/cms/package.json

After initialization, update `apps/cms/package.json` to add workspace dependency:

```json
{
  "dependencies": {
    "@forge-pages/types": "workspace:*"
  }
}
```

Ask for confirmation, then: `pnpm install`

---

### 3. TypeScript config for apps/cms

Create/update `apps/cms/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "dist",
    "baseUrl": ".",
    "paths": {
      "@forge-pages/types": ["../../packages/types/src/index.ts"]
    }
  },
  "include": ["src", "config", "database"],
  "exclude": ["node_modules", "build", "dist", ".cache", ".tmp", "public"]
}
```

---

### 4. Biome config for apps/cms

Create `apps/cms/biome.json` (extends root):

```json
{
  "extends": ["../../biome.json"],
  "linter": {
    "rules": {
      "suspicious": {
        "noConsole": "off"
      }
    }
  }
}
```

Strapi uses `console` internally — disable that rule for CMS only.

---

### 5. Environment config for apps/cms

Create `apps/cms/.env.example`:

```bash
HOST=0.0.0.0
PORT=1337
APP_KEYS=
API_TOKEN_SALT=
ADMIN_JWT_SECRET=
TRANSFER_TOKEN_SALT=
JWT_SECRET=

# Database (Supabase Postgres)
DATABASE_CLIENT=postgres
DATABASE_URL=

# Supabase Storage (for media uploads)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Sentry
SENTRY_DSN=

# Flipt
FLIPT_URL=
FLIPT_TOKEN=
```

---

### 6. Strapi media storage — Supabase Storage

Install Supabase Storage provider:

```bash
pnpm --filter cms add @strapi/provider-upload-supabase
```

Configure `apps/cms/config/plugins.ts`:

```ts
export default ({ env }: { env: (key: string) => string }) => ({
  upload: {
    config: {
      provider: "@strapi/provider-upload-supabase",
      providerOptions: {
        apiUrl: env("SUPABASE_URL"),
        apiKey: env("SUPABASE_SERVICE_ROLE_KEY"),
        bucket: "landing-page-assets",
        directory: "",
        options: {}
      }
    }
  }
});
```

---

### 7. Strapi CORS configuration

Update `apps/cms/config/middlewares.ts` to restrict CORS to the Nuxt app origin:

```ts
export default [
  "strapi::logger",
  "strapi::errors",
  {
    name: "strapi::security",
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'", "https:"],
          "img-src": ["'self'", "data:", "blob:", "*.supabase.co"],
          "media-src": ["'self'", "data:", "blob:", "*.supabase.co"],
          upgradeInsecureRequests: null
        }
      }
    }
  },
  {
    name: "strapi::cors",
    config: {
      enabled: true,
      headers: "*",
      origin: [
        "http://localhost:3000",
        process.env.NUXT_PUBLIC_SITE_URL ?? ""
      ].filter(Boolean)
    }
  },
  "strapi::poweredBy",
  "strapi::query",
  "strapi::body",
  "strapi::session",
  "strapi::favicon",
  "strapi::public"
];
```

---

### 8. Create block components (Dynamic Zone)

In Strapi 5, components are defined in `apps/cms/src/components/<category>/`. Create all 10 blocks matching CLAUDE.md section 6 and `packages/types`.

#### 8a. blocks/header.json

```json
{
  "collectionName": "components_blocks_headers",
  "info": {
    "displayName": "Header",
    "icon": "layer",
    "description": "Fixed navigation header with logo and CTA"
  },
  "options": {},
  "attributes": {
    "logo": {
      "type": "media",
      "multiple": false,
      "required": false,
      "allowedTypes": ["images"]
    },
    "cta_label": { "type": "string", "required": true },
    "cta_whatsapp": { "type": "string", "required": true },
    "cta_message": { "type": "string" },
    "menu_links": {
      "type": "component",
      "repeatable": true,
      "component": "shared.link"
    }
  }
}
```

#### 8b. blocks/hero.json

```json
{
  "collectionName": "components_blocks_heroes",
  "info": { "displayName": "Hero", "icon": "picture" },
  "attributes": {
    "badge_text": { "type": "string" },
    "headline": { "type": "string", "required": true },
    "subheadline": { "type": "string", "required": true },
    "cta_primary_label": { "type": "string", "required": true },
    "cta_primary_link": { "type": "string", "required": true },
    "cta_secondary_label": { "type": "string" },
    "cta_secondary_link": { "type": "string" },
    "image": { "type": "media", "multiple": false, "allowedTypes": ["images"] },
    "image_alt": { "type": "string" }
  }
}
```

#### 8c–8j. Remaining blocks

Create one JSON file per block following the same pattern for:

- `blocks/trust-icons.json` — items[] with icon (string) and text
- `blocks/stats.json` — items[] with number (string) and label
- `blocks/value-proposition.json` — headline, text, cards[] with icon/title/description
- `blocks/services.json` — headline, tabs[] with label/title/text/cta_label/cta_link/image
- `blocks/differentials.json` — headline, text, items[] with icon and text
- `blocks/testimonials.json` — headline, items[] with name/role/photo/text/rating (integer 1-5)
- `blocks/cta-form.json` — headline, subheadline, select_options[] with label+value, cta_label, whatsapp_number, whatsapp_message
- `blocks/footer.json` — logo, description, links[], phones[], schedule, social_links[] with platform+url, copyright, privacy_link

All repeatable sub-items should reference shared components where reusable (e.g. `shared.link`, `shared.phone`).

---

### 9. Shared sub-components

Create `apps/cms/src/components/shared/`:

**shared/link.json**:

```json
{
  "collectionName": "components_shared_links",
  "info": { "displayName": "Link" },
  "attributes": {
    "label": { "type": "string", "required": true },
    "url": { "type": "string", "required": true }
  }
}
```

**shared/phone.json**:

```json
{
  "collectionName": "components_shared_phones",
  "info": { "displayName": "Phone" },
  "attributes": {
    "label": { "type": "string" },
    "number": { "type": "string", "required": true }
  }
}
```

---

### 10. LandingPage content type

Create `apps/cms/src/api/landing-page/content-types/landing-page/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "landing_pages_cms",
  "info": {
    "singularName": "landing-page",
    "pluralName": "landing-pages",
    "displayName": "Landing Page",
    "description": "One record per client landing page"
  },
  "options": {
    "draftAndPublish": true
  },
  "attributes": {
    "domain": {
      "type": "uid",
      "required": true,
      "unique": true
    },
    "seo_title": { "type": "string" },
    "seo_description": { "type": "text" },
    "seo_og_image": {
      "type": "media",
      "multiple": false,
      "allowedTypes": ["images"]
    },
    "primary_color": { "type": "string", "default": "#065a82" },
    "secondary_color": { "type": "string", "default": "#1c7293" },
    "font_family": { "type": "string", "default": "Inter" },
    "blocks": {
      "type": "dynamiczone",
      "components": [
        "blocks.header",
        "blocks.hero",
        "blocks.trust-icons",
        "blocks.stats",
        "blocks.value-proposition",
        "blocks.services",
        "blocks.differentials",
        "blocks.testimonials",
        "blocks.cta-form",
        "blocks.footer"
      ]
    }
  }
}
```

> Note: `domain` in the CMS is the content identifier. Tenant resolution at runtime uses the Supabase `landing_pages` table domain — these must stay in sync. The Nuxt middleware reads from Supabase (for speed, via cache), and fetches block content from Strapi using the `domain` as lookup key.

---

### 11. Strapi API token for Nuxt

After starting Strapi for the first time:

1. Go to `http://localhost:1337/admin`
2. Settings → API Tokens → Create new token
3. Name: `nuxt-read-only`
4. Type: `Read-only`
5. Copy the token → add to `.env` as `STRAPI_API_TOKEN`

This token is used by Nuxt server routes to fetch block content. It is **never** exposed client-side.

---

### 12. Sentry plugin for Strapi

Install:

```bash
pnpm --filter cms add @sentry/node
```

Create `apps/cms/src/middlewares/sentry.ts`:

```ts
import * as Sentry from "@sentry/node";

export default (config: unknown, { strapi }: { strapi: unknown }) => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
  });

  return async (
    ctx: { request: unknown; response: unknown },
    next: () => Promise<void>
  ) => {
    try {
      await next();
    } catch (error) {
      Sentry.captureException(error);
      throw error;
    }
  };
};
```

Register in `apps/cms/config/middlewares.ts` (add `'global::sentry'` to the array).

---

### 13. Start Strapi and validate

Ask for confirmation, then:

```bash
mise run dev:cms
```

Validate:

- Admin panel accessible at `http://localhost:1337/admin`
- All 10 block components visible in Content-Type Builder
- LandingPage collection type shows Dynamic Zone with all 10 blocks
- Create one test landing page with a Hero and CTA Form block
- Fetch via API: `curl http://localhost:1337/api/landing-pages?populate=blocks`
- Confirm the JSON matches the TypeScript interfaces in `packages/types`

---

## Validation checklist before closing Phase 3

- [ ] `mise run dev:cms` starts without errors
- [ ] All 10 block components exist in Strapi Content-Type Builder
- [ ] LandingPage content type has a Dynamic Zone with all 10 blocks
- [ ] Shared components `link` and `phone` created
- [ ] CORS restricted to localhost:3000 and NUXT_PUBLIC_SITE_URL
- [ ] Media uploads go to Supabase Storage bucket
- [ ] Sentry middleware registered
- [ ] `STRAPI_API_TOKEN` read-only token created and saved to env
- [ ] API response for a test landing page matches `packages/types` interfaces
- [ ] `mise run typecheck` still passes on `packages/types`

---

## Commit at the end of Phase 3

Ask for confirmation, then:

```bash
git add apps/cms/
git commit -m "feat(cms): initialize Strapi 5 with all 10 Dynamic Zone blocks

- Strapi 5 with TypeScript, connected to Supabase Postgres
- 10 block components: header, hero, trust-icons, stats, value-proposition,
  services, differentials, testimonials, cta-form, footer
- LandingPage collection type with Dynamic Zone
- Shared sub-components: link, phone
- CORS restricted to Nuxt origin
- Media uploads via Supabase Storage provider
- Sentry middleware for error tracking"

git push origin main
```

---

## Update CLAUDE.md

Mark Phase 3 as complete in section 14.

---

## Next step

```
docs/prompts/PHASE_4_FRONTEND.md
```
