# forge-pages — MVP Rewrite Phase History

> Full per-phase build + verification detail, split out of `.claude/CLAUDE.md` §11 to
> keep that file under its 200-line budget. `.claude/CLAUDE.md` §11 keeps a one-line
> summary per phase; this file is the record of what was actually built and verified.

- **Fase 0 — Reset repo, infra, docs** — completed 2026-08-04. Next.js 16.3.0 + React
  19.2.8 + Tailwind 4.3.3 + Zod 4.4.3; flat app at root, monorepo gone. Verified:
  `biome check` + `tsc --noEmit` clean, `next build` and `opennextjs-cloudflare build`
  pass, tenant resolution by `Host` header confirmed on **both** `next dev` (:3000) and
  `wrangler dev` (:8787, real workerd) including port stripping. Supabase local + cloud
  (`ofpnglnnzpowlzsyfbit`) migrated: `blocks jsonb` added, `strapi` schema +
  `webhook_retries` + retry cron + lead webhook dropped, anon/authenticated grants
  restored to least privilege. Not yet built (Fase 1+): `lib/schemas/blocks.ts`,
  `lib/supabase.ts`, `lib/background.ts`, `components/blocks/*`, `app/api/leads/` —
  `app/page.tsx` is still a stub that prints the resolved tenant host.

- **Fase 1 — Core multi-tenant + Forge Company real content** — completed 2026-08-05.
  Built `lib/supabase.ts` (cached `getLandingPageByHost`, publishable key), `lib/tenant.ts`,
  `lib/schemas/blocks.ts` (Zod for all 11 types), `lib/background.ts`, `lib/fonts.ts`;
  `app/layout.tsx` injects tenant CSS vars + fonts + `generateMetadata`, `app/page.tsx`
  renders blocks, `app/not-found.tsx` handles an unclaimed host. 7 block components +
  `BlockRenderer` + shared `Section`/`Seam`/`Eyebrow`/`CtaButton`/`MobileMenu`/
  `BackgroundParticles`. Forge Company's page ported from `forge_company_apresentacao.html`
  into the seed as 8 blocks; brand SVGs in `public/brand/`. Architecture decisions in
  ADR-0008. Verified: `biome check` + `tsc --noEmit` clean; all 4 seeded tenants resolve
  and an unknown host 404s on **both** `next dev` (:3000) and `wrangler dev` (:8787, real
  workerd), including static asset serving; bogus `variant` falls back to `default`
  (HTTP 200), a malformed block 500s naming the exact path (`blocks.4.plans.0.price`);
  layout measured over CDP (doc height 4329px, 8 blocks, all 6 anchors resolve). Not yet
  built (Fase 2+): `app/api/leads/`, the real lead form, `trust-icons`/`stats`/`services`/
  `testimonials` components.

- **Fase 2 — Lead capture (form → Supabase)** — completed 2026-08-05. `middleware.ts`
  matcher now includes `/api` so route handlers resolve the tenant through the one
  `x-tenant-host` path; new `lib/schemas/leads.ts` (Zod, every string length-capped),
  `lib/turnstile.ts` (siteverify, fail-closed in production), `lib/leads.ts` (the app's
  only write path, sole holder of the secret key), `app/api/leads/route.ts`,
  `types/turnstile.d.ts`. `CtaFormBlock` is now a Server Component wrapping the client
  `LeadForm` (fields + tenant `selectOptions` + explicit-render Turnstile widget + UTM
  capture + status machine), with the existing `whatsappNumber` kept as the secondary
  route. Migration `20260805000000_revoke_anon_lead_insert.sql` drops `anon_insert_leads`
  and revokes `anon` INSERT (applied local + cloud). `20260805000001_add_lead_domain.sql`
  adds `leads.domain not null`, backfilled from `landing_pages`. Trust boundary in
  ADR-0009. Verified: `biome check` + `tsc --noEmit` clean; on **both** `next dev` and
  `wrangler dev` (:8787, real workerd, including the outbound siteverify fetch) — 201 +
  row with the Host-derived `landing_page_id` and matching `domain`, unknown host 404
  with zero rows written, a body supplying its own `landing_page_id`/`domain`/`status`
  stripped by Zod, `intent` from another tenant 400, over-length/missing fields 400,
  malformed JSON 400, empty token 403, and a genuine token against the always-fail secret
  403 with nothing inserted; browser end-to-end on both runtimes (widget renders and
  solves, success state replaces the form, and on failure the alert shows, submit
  re-enables, typed values survive and the widget re-solves after reset). Not yet built
  (Fase 3+): `trust-icons`/`stats`/`services`/`testimonials` components, the real
  `whatsappNumber`.

- **Fase 3 — Second/third tenant** — completed 2026-08-05. Closed the last two Fase 1
  gaps: `BlockRenderer` now maps all 11 Zod-validated types (added `TrustIconsBlock`,
  `StatsBlock`, `ServicesBlock` + client `ServiceTabs` for tab switching,
  `TestimonialsBlock`; all four gained `anchorId`, per ADR-0008's deferred half), and
  `globals.css`'s neutral ramp is now per-tenant (`landing_pages.theme_mode`,
  `lib/theme.ts`, ADR-0010) instead of hardcoded dark-only. Seeded two new tenants
  exercising both: `dellaquila.localhost` (light theme, example portfolio content — no
  fabricated testimonials under the maintainer's real identity) and
  `imobiliaria.localhost` (dark theme, fictional demo real-estate agency, incl.
  `testimonials`). Both `whatsappNumber`s are placeholders, same convention as every
  other seeded tenant — replace before Fase 4 promotes either to its real domain.
  Migration `20260805000002_add_theme_mode.sql` adds `theme_mode` (default `'dark'`,
  no existing tenant affected). Pushed to cloud along with the previously local-only
  `20260805000001_add_lead_domain.sql`.

  Verified: `biome check` + `tsc --noEmit` clean; `next build` and
  `opennextjs-cloudflare build` pass (root segments still `ƒ` dynamic, per ADR-0008 §1);
  local `supabase db reset` applies both new migrations + seed with no errors. On
  **both** `next dev` (:3000) and `wrangler dev` (:8787, real workerd): all 4 content
  tenants + the two new ones return 200, unknown host still 404s, every seeded
  `anchorId` resolves, `--tenant-surface`/`--tenant-ink` read the light ramp
  (`#f7f5f2`/`#1c1a17`) on `dellaquila.localhost` and the unchanged dark ramp
  (`#2b2116`/`#f3eadb`) on every other tenant, and `forgecompany.localhost` /
  `forge-motos.localhost` render byte-identical body heights to pre-Fase-3 — no
  regression from the `@theme` → `--tenant-*` indirection. Screenshots confirm both new
  pages read correctly in their theme (light: warm off-white with dark text; dark: near-
  black with cream text), including the services tab switcher and testimonial star
  ratings. `db diff --linked` after the cloud push is clean except the pre-existing
  `pg_net` schema-location drift (predates the MVP rewrite) — not touched, since moving
  an extension's schema risks breaking any `pg_cron`/`pg_net` job silently and isn't
  Fase 3 scope; still open.

  Not yet done: real `dellaquila.dev`/`imobiliaria.forgecompany.example.com` domain
  promotion + real WhatsApp numbers (Fase 4), Turnstile real-vs-dummy local key
  verification (Fase 2 loose end), `wrangler deploy` `.env` upload check (Fase 4),
  `pg_net` drift reconciliation.

- **Fase 4 — Deploy (in progress, started 2026-08-05).** Closed 3 of the 4 carried-over
  items above, surfaced one real bug, and confirmed the actual cloud/CI starting point
  is earlier than assumed:
  - `pg_net` drift: confirmed the extension has zero consumers (its only user, the
    webhook retry cron, was already dropped in `20260804000000_mvp_rewrite_reset.sql`).
    `20260805000003_drop_unused_pg_net.sql` drops it outright; `db diff --linked` is
    now fully clean.
  - `wrangler deploy` `.env` check: confirmed (against `workers-sdk` source via
    Context7) that `.env` auto-loading is hardcoded to `wrangler dev` only — `deploy`
    never reads it, so the file-leak risk doesn't exist. But the same investigation
    found a real gap: `deploy.yml` set runtime secrets as GitHub Actions job `env:`,
    which only reaches the `NEXT_PUBLIC_*` build-time inlining step — `wrangler deploy`
    does not forward the CI runner's shell env into the Worker's runtime bindings. Fixed
    by adding `cloudflare/wrangler-action`'s `secrets:` input (`wrangler secret bulk`)
    for `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_SECRET_KEY`/
    `TURNSTILE_SECRET_KEY`. Not yet run for real — `deploy.yml`'s trigger is still
    `workflow_dispatch` only.
  - Turnstile: confirmed the `.env` values are real keys (`0x4...`-prefixed, correct
    lengths — checked shape only, values never printed) and that `lib/turnstile.ts`'s
    server-side verify needs no change. The remaining risk is Cloudflare-side, not
    code: a real widget only renders/solves on hostnames listed in its Hostname
    Management config, and Cloudflare explicitly recommends against including local
    domains for production sitekeys — `localhost` has to be added there deliberately
    for the human-solve test to work on `*.localhost`. Not yet confirmed done.
  - "Domain promotion" turned out not to be a migration at all: a read-only
    `supabase db dump --linked --data-only` showed cloud's `clients`, `landing_pages`,
    and `leads` are **completely empty** — there was no existing `forgecompany.example.com`
    row to promote. Drafted (and dry-run-verified locally inside a rolled-back
    transaction) ready-to-paste SQL for all three real domains as `status = 'draft'`
    rows, matching the local seed content and keeping the same WhatsApp placeholders —
    handed to the user as a file for Supabase Studio's SQL editor, since this project's
    content model is Studio-edited, not migration-driven. Not yet pasted/applied.
  - Checked GitHub state directly: all 11 secrets `.github/SETUP.md` lists are already
    configured (names confirmed via `gh secret list`; values not inspected). Branch
    protection on `main` is still unconfigured (404 from the branches/protection API).
    `build.yml`/`deploy.yml`/`backup.yml`/`claude-review.yml` are all still
    `workflow_dispatch`-only — only `ci.yml` has a live trigger.
  - Found one vestigial variable: `NEXT_PUBLIC_SITE_URL` is defined in `.env.example`,
    documented in `docs/SECRETS.md`/`.github/SETUP.md`, and set as a GitHub secret, but
    nothing in the app reads it — canonical URLs already come from the per-tenant
    `landing_pages.canonical_url` DB column via `tenant.canonicalUrl` in
    `app/layout.tsx`'s `generateMetadata`. Left as-is (not scope of this session); worth
    a decision before Fase 4 closes — wire it to something real or drop it.
  - Custom-domain wiring itself (ADR-0001: "Cloudflare for SaaS API ... to be wired when
    the first client is onboarded") has **no code at all yet** — confirmed by reading
    the ADR, not assumed. For exactly 3 known domains, manual per-domain setup in the
    Cloudflare dashboard (not the SaaS API) is almost certainly right for this phase —
    building API automation for a fixed, small tenant count would be the over-
    engineering CLAUDE.md §10 rules out; automate only once onboarding stops being a
    one-off.

  Not yet done (blocking real Fase 4 completion, roughly in dependency order): real
  WhatsApp numbers for all three promoted tenants; confirming Turnstile's Hostname
  Management includes `localhost` and completing the human-solve browser test; pasting
  the drafted tenant-content SQL into Studio; DNS + Cloudflare for SaaS custom-hostname
  setup per domain (manual, dashboard); flipping each `landing_pages.status` to
  `'published'` only after both the number and the domain are real; uncommenting
  `deploy.yml`'s trigger (or running it once via `workflow_dispatch` as a controlled
  first deploy).

  **2026-08-06 follow-up.** Closed two of the remaining items, resolved the third as a
  deliberate skip rather than "not yet done":
  - `wrangler deploy --dry-run` — clean. Build compiles, all routes still `ƒ` dynamic
    (ADR-0008), bundle 6.5 MB / 1.3 MB gzip, all three bindings resolve. Proves the
    build path only — no Worker was actually uploaded.
  - `CLOUDFLARE_API_TOKEN` Workers scope — a direct `GET .../workers/scripts` call
    succeeded, which a Pages-only token could not do. Read access confirmed; write is
    only provable by a real deploy, but the "minted for Pages" fear looks unfounded.
  - `NEXT_PUBLIC_SITE_URL` — removed entirely (repo files + the GitHub secret itself,
    via `gh secret delete`). Zero code consumers; canonical URLs already come from the
    per-tenant `landing_pages.canonical_url` column, the only correct source in a
    multi-tenant-by-domain app.
  - Branch protection — **not applied, deliberately.** First attempt 404'd (CLI session
    had only `WRITE`); the org owner then added the CLI session as repo `ADMIN` and it
    still failed, with GitHub's real reason surfacing: `403 "Upgrade to GitHub Pro or
    make this repository public"`. Verified independently (GitHub's own community docs)
    that this applies identically to both classic branch protection *and* the newer
    Rulesets feature — neither works on a private repo below GitHub Team, regardless of
    admin access. Owner declined the paid upgrade and declined making the repo public
    (a miss-click surfaced the upgrade prompt, not an actual want to pay), so this is
    now a **documented, accepted gap** — see `docs/GO_LIVE.md` §2 — not an open task.
    Only two things can unlock it later: upgrading `forgecompany-tech` to GitHub Team,
    or making the repo public.
