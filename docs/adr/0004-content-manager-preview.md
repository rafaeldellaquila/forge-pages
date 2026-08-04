# 4. Strapi Content Manager Preview via a decoupled `/preview` route

Date: 2026-08-01
Status: Accepted

## Context

Editors had no way to see a draft `landing-page` entry rendered as a real page before
publishing — they either published blind or eyeballed raw fields in the Strapi Content
Manager. Strapi 5.50 ships a native "Preview" feature (an iframe of the live frontend
showing draft content), which we're enabling for `api::landing-page.landing-page` — the
only content type with `draftAndPublish` enabled.

Strapi's own recipe assumes a conventional multi-page site: a per-content-type slug
resolver and cookie-based Next.js draft mode, so a preview session survives client-side
navigation across many pages. forge-pages doesn't fit that shape — one Nuxt app resolves
a tenant from the `Host` header and renders exactly **one** route (`/`) per client,
entirely from a `blocks` Dynamic Zone, with `routeRules: { '/**': { isr: 3600 } }`
caching every response for an hour. Reusing that recipe as-is would risk leaking draft
content into the public ISR/CDN cache and would require relaxing the frontend's CSP
(`xFrameOptions: DENY`) globally just to let Strapi's admin iframe the site at all.

## Decision

- **A dedicated `/preview` route**, entirely decoupled from the production tenant path.
  `server/middleware/tenant.ts` (Host-header resolution, `.eq('status','published')`) is
  untouched. `/preview` resolves its own tenant from an explicit `domain` query param,
  without the published-only filter — a client's Supabase tenant row can still be
  `draft` pre-launch while its content is being previewed.
- **No cookie, no redirect hop.** Because there's no page tree to preserve navigation
  state across, the Strapi `preview.config.handler` (`apps/cms/config/admin.ts`) returns
  the final `${CLIENT_URL}/preview?domain&documentId&secret&status` URL directly — no
  intermediate Next.js-style draft-mode redirect. `/preview` re-validates the shared
  `PREVIEW_SECRET` (`timingSafeEqual`) on every request instead.
- **Fetch by `documentId`, not domain-filter.** `server/api/preview-blocks.get.ts` calls
  `GET /api/landing-pages/:documentId?status=draft|published` — structurally separate
  from the production `blocks.get.ts` (different Strapi response shape: single object vs.
  array). `documentId` is stable across draft/published versions; filtering by `domain`
  would risk missing an in-progress draft if the `domain` field itself is mid-edit.
- **Scoped, not global, cache/CSP relaxation.** `routeRules['/preview']` and
  `['/api/preview-blocks']` disable ISR (`isr: false`, `cache-control: no-store`) so
  draft content never enters the public cache. Only `/preview` gets a relaxed
  `frame-ancestors` CSP (the Strapi origin, derived from `STRAPI_URL` — no separate
  "admin domain" var) and `xFrameOptions: false`; every other route keeps
  `xFrameOptions: DENY`. `/preview` also sends `x-robots-tag: noindex, nofollow` and is
  disallowed in `robots.txt`.
- **`CLIENT_URL` reuses `NUXT_PUBLIC_SITE_URL`** rather than a new duplicate-value var —
  this also fixed a pre-existing gap where that var was documented as a `cms` consumer in
  `docs/SECRETS.md` but was never added to `.mise.toml`'s `CMS_VARS` allowlist.
- **`PREVIEW_SECRET`** is one instance-wide secret (not per-tenant/per-link), consumed
  verbatim by both apps, checked via `preview-auth.ts` middleware before any handler
  logic runs, with the same Upstash rate-limit pattern as `leads.post.ts` (30/IP/hour,
  fails open if Upstash is unconfigured).

## Consequences

- **Accepted risk**: anyone holding `PREVIEW_SECRET` plus a `domain` can view that
  tenant's draft content — a shareable-link model, matching Strapi's own design. Not
  treated as an oversight; mitigated by rate limiting and the secret never being logged
  or exposed client-side.
- **Strapi's `allowedOrigins` is `string[]`, not a string** — Strapi's own documentation
  examples pass `env('CLIENT_URL')` directly, which type-checks as `string` and fails
  Strapi 5.50's actual `PreviewConfig` type (`allowedOrigins?: string[]`). Caught during
  implementation via `strapi develop`'s TS compile step, not from the docs.
- **Live Preview (keystroke-level auto-refresh while editing) is experimental in Strapi
  and explicitly doesn't reliably detect Dynamic Zone field edits** — which is this
  product's entire content model. `PreviewBridge.vue` still implements the postMessage
  handshake (`strapiUpdate` → `refreshNuxtData()`) since it's cheap, but Save-triggered
  reload (reopening/refreshing `/preview`) is the dependable path, not real-time WYSIWYG.
  Not verified in-browser during this change (no admin session available in the
  verification environment) — confirm actual keystroke behavior next time someone uses
  it, and update this note if it's better or worse than expected.
- **A second, cache-bypassed tenant-resolution code path now exists** alongside
  `tenant.ts`, intentionally — keeping them decoupled means the production path's
  guarantees (published-only, ISR-cached, `Host`-resolved) are never weakened by preview
  logic, at the cost of some duplicated shape (both read the same Supabase columns).
- The existing "read-only" `STRAPI_API_TOKEN` **can** read `status=draft` entries — this
  was verified end-to-end, so no new token needed. "Read-only" refers to write access
  (no mutations), not to publication status.
