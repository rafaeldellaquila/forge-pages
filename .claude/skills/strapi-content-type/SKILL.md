# Skill: Strapi Content Type

Use this skill when asked to add or modify a Strapi 5 content type or component in forge-pages.
Before starting, read this file in full.

---

## Two kinds of Strapi schemas in this project

| Kind | Location | When to use |
|---|---|---|
| **Component** | `apps/cms/src/components/<category>/<name>.json` | Reusable nested structures (blocks, shared sub-items) |
| **Collection type** | `apps/cms/src/api/<name>/content-types/<name>/schema.json` | Top-level entities (LandingPage) |

In this project, almost everything is a **component** inside the `blocks` Dynamic Zone.

---

## Component file structure

```json
{
  "collectionName": "components_<category>_<plural>",
  "info": {
    "displayName": "<Human Name>",
    "icon": "<icon-name>",
    "description": "<one line>"
  },
  "attributes": {
    "<field_name>": { <field definition> }
  }
}
```

### collectionName convention
- Category prefix: `components_blocks_`, `components_shared_`
- Plural snake_case name
- Examples: `components_blocks_heroes`, `components_shared_links`

---

## Field type reference

```json
// Text (short, single line)
"headline": { "type": "string", "required": true }

// Long text (paragraphs, no rich text)
"description": { "type": "text" }

// Rich text (Markdown editor in admin)
"content": { "type": "richtext" }

// Number (use "string" for display numbers like "+500", "98%")
"rating": { "type": "integer", "min": 1, "max": 5 }

// Boolean
"is_active": { "type": "boolean", "default": true }

// Enumeration
"platform": {
  "type": "enumeration",
  "enum": ["instagram", "facebook", "linkedin", "youtube", "tiktok"]
}

// Single media (image)
"image": {
  "type": "media",
  "multiple": false,
  "required": false,
  "allowedTypes": ["images"]
}

// Multiple media
"gallery": {
  "type": "media",
  "multiple": true,
  "allowedTypes": ["images"]
}

// Nested component (single)
"address": {
  "type": "component",
  "repeatable": false,
  "component": "shared.address"
}

// Repeatable component
"items": {
  "type": "component",
  "repeatable": true,
  "component": "shared.link",
  "min": 1,
  "max": 6
}
```

---

## Naming convention: Strapi ↔ TypeScript

Strapi stores field names in snake_case. The API returns them in camelCase automatically.

| In JSON schema | In TypeScript interface | In Vue template |
|---|---|---|
| `cta_label` | `ctaLabel` | `props.ctaLabel` |
| `is_active` | `isActive` | `props.isActive` |
| `menu_links` | `menuLinks` | `props.menuLinks` |

Always verify the camelCase version matches the TypeScript interface in `packages/types`.

---

## Adding a new block component

1. Create `apps/cms/src/components/blocks/<name>.json`
2. Ensure the `collectionName` is unique (check existing files)
3. Add any new shared sub-components to `apps/cms/src/components/shared/`
4. Register the block UID in the Dynamic Zone in `apps/cms/src/api/landing-page/content-types/landing-page/schema.json`:

```json
"blocks": {
  "type": "dynamiczone",
  "components": [
    "blocks.header",
    "blocks.hero",
    "blocks.<new-block-name>"   ← add here
  ]
}
```

5. Restart Strapi — it auto-applies the schema changes on startup
6. Verify in admin: Content-Type Builder should show the new component

---

## Adding shared sub-components

Shared components live in `apps/cms/src/components/shared/` and are reused across blocks.

Existing shared components (do not recreate):
- `shared.link` — `{ label: string, url: string }`
- `shared.phone` — `{ label?: string, number: string }`

Add new ones only when a sub-structure is used in 2+ blocks.

---

## CORS and API tokens

After adding a new content type or changing permissions:
1. Go to Strapi admin → Settings → Roles → Public
2. Ensure the `find` permission is enabled for `landing-page`
3. The `STRAPI_API_TOKEN` (read-only) used by Nuxt must have access to the new content type

---

## Checklist after adding a content type

- [ ] JSON schema file created with correct `collectionName`
- [ ] Strapi restarted (`mise run dev:cms`)
- [ ] Component visible in Content-Type Builder
- [ ] Dynamic Zone updated if it's a new block
- [ ] TypeScript interface in `packages/types` matches all field names (camelCase)
- [ ] `mise run typecheck` passes
- [ ] Test: create a sample entry in Strapi admin and fetch via API
- [ ] API response shape matches `packages/types` interface

---

## What NOT to do

- Do not duplicate `collectionName` — check existing files first
- Do not use `richtext` for short fields — use `string` or `text`
- Do not use `integer` for display numbers that might include symbols (`+`, `%`, `k`)
- Do not forget to register new blocks in the Dynamic Zone schema
- Do not modify the Dynamic Zone without also updating `blockComponentMap.ts` in Nuxt
- Do not add fields in Strapi without adding them to `packages/types` first
