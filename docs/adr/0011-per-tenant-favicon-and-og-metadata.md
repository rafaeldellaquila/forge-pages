# 11. Per-tenant favicon and OG image metadata

Date: 2026-08-10
Status: Accepted

## Context

`landing_pages` has carried `seo_title`, `seo_description`, `seo_og_image`, and
`canonical_url` since the first migration, and `app/layout.tsx`'s `generateMetadata`
has read all four into `title`/`description`/`alternates.canonical`/`openGraph` since
Fase 1. Two gaps remained:

- **Favicon had no per-tenant concept at all.** A single static `app/favicon.ico`,
  tracked in git since the initial scaffold, was served identically to every tenant —
  no DB column, no wiring.
- **No `metadataBase`.** Per Next.js 16 docs, without it Next resolves relative
  icon/OG-image URLs against `http://localhost:PORT` (its documented dev fallback) —
  silently wrong in production for the relative `/public` path convention this app
  already uses (`header.logo.url: "/brand/logo_negative.svg"` in seeded block JSON).

Separately: `seo_og_image` had never run with real data (null on all seeded tenants),
and the only brand assets that exist in the repo (`public/brand/*.svg`) are SVGs. OG
image consumers — Facebook, Twitter/X, Slack, WhatsApp link previews — do not render
SVG for `og:image`; they require a raster format (PNG/JPG). So even Forge Company,
the one tenant with real brand assets, has no asset today that's valid as an OG image.

## Decision

### `favicon_url` is a plain nullable text column, same shape as `seo_og_image`

`landing_pages.favicon_url` (migration `20260810000000_add_favicon_url.sql`), mapped
to `LandingPageConfig.faviconUrl`. `generateMetadata` sets
`icons: tenant.faviconUrl ? { icon: tenant.faviconUrl } : undefined` — null falls back
to the shared `app/favicon.ico` via Next's file-convention default, so every tenant
without a real favicon yet keeps working exactly as before.

### Per-tenant assets stay static files under `public/`, referenced by relative path

No Supabase Storage bucket was introduced. This matches the only precedent that
already exists in this codebase: `header.logo.url`/`hero.image.url`/etc. are plain
relative paths into `public/`, edited as block JSON in Supabase Studio, and adding or
changing one already requires a commit + deploy today. A dedicated Storage bucket
would be a new abstraction solving a problem (non-technical, no-deploy asset
uploads) nothing in this app has needed yet — introduce it if that need becomes real,
not ahead of it.

### `metadataBase` is set per-request from the resolved tenant's domain

```ts
const metadataBase = new URL(`https://${tenant.domain}`)
```

This is the same pattern every other tenant-scoped value in `app/layout.tsx` already
follows (primary color, fonts, neutral theme) — derived from the `Host`-resolved row,
not hardcoded. It fixes relative-URL resolution for `icons` and `openGraph.images`
alike, and costs nothing when a tenant has neither set (both stay `undefined`).

### Forge Company's favicon uses `icon_positive.svg`, not `icon_negative.svg`

Despite Forge Company's own page being dark (`theme_mode: 'dark'`, using the
`logo_negative.svg` light-on-dark variant for its in-page header), the favicon uses
the dark-fill `icon_positive.svg`. Favicons render in browser tab/bookmark chrome,
which is light regardless of the tenant page's own theme — the light-fill negative
variant would be nearly invisible there. This is a real, if narrow, place where
"which brand asset variant" depends on where the asset is displayed, not on the
tenant's theme_mode.

### `seo_og_image` stays null everywhere, including Forge Company

No raster asset exists for any tenant. Populating the column with a placeholder image
would misrepresent real content per CLAUDE.md's ban on fabricated brand assets; the
column and the `generateMetadata` wiring are both ready, so a tenant gets a working OG
image the moment a real PNG/JPG path is added — no further code change needed.

### Dynamic OG image generation is deferred, not built

Next.js supports `app/opengraph-image.tsx` + `next/og`'s `ImageResponse`, which could
render a per-tenant OG image at request time from data already on the tenant row
(title, primary/secondary color, logo) — avoiding the need for anyone to produce a
raster file by hand. Not built now: its compatibility with the Cloudflare
Workers/OpenNext edge runtime this app deploys to (not Vercel's edge, where `next/og`
is most commonly used) is unverified, and speculative infrastructure for a need
(dynamic per-tenant image generation) not yet requested by any real tenant is exactly
the over-engineering CLAUDE.md §10 rules out. Revisit if/when a tenant needs an OG
image and no one wants to produce one manually.

## Consequences

- `landing_pages` gains `favicon_url` (migration `20260810000000_add_favicon_url.sql`,
  nullable, no default); `LandingPageConfig` gains `faviconUrl: string | null`.
- `seo_description`, previously null for `forge-motos`/`clinica`/`advocacia`, is now
  populated for all six seeded tenants — a seed-content gap, not a code gap.
- A future tenant needing a real OG image must supply a PNG/JPG (SVG will not render
  in link previews) and its path goes straight into the existing `seo_og_image`
  column — no schema change required.
- Verification must include a tenant with `favicon_url` null (e.g.
  `dellaquila.localhost`) to confirm the `app/favicon.ico` fallback still renders —
  a regression here is invisible if only Forge Company (the one tenant with a real
  value) is checked.
- A tenant with `favicon_url` set renders **two** `<link rel="icon">` tags — the
  static `app/favicon.ico` (Next's always-on browser-probe fallback, a separate
  mechanism from the `icons` metadata field) plus the tenant's own. This is expected:
  browsers prefer an explicit `<link rel="icon">` over the implicit `/favicon.ico`
  probe, so the tenant-specific icon wins. Confirmed on both `next dev` and
  `wrangler dev` (real workerd).
