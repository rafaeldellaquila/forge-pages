# 9. Lead capture trust boundary

Date: 2026-08-05
Status: Accepted

## Context

Fase 1 shipped `CtaFormBlock` as a WhatsApp deep link, deferring the form because an input
field with no endpoint behind it drops real leads on the floor. Fase 2 builds the endpoint,
which means deciding what the browser is allowed to say about a lead.

`leads` has three columns the visitor must not control: `landing_page_id` (which tenant's
inbox the lead lands in), `intent` (the qualifier the founder segments on), and `status`
(the pipeline stage). A form that posts a JSON body can claim any of them. On top of that,
the endpoint is public and unauthenticated by design — anyone can POST to it — while rate
limiting stays deferred (ADR-0007).

A second, smaller decision was forced by the existing `middleware.ts` matcher, which
excluded `/api` (Next's boilerplate default). Route handlers therefore never saw
`x-tenant-host` and had no tenant to attribute a lead to.

## Decision

### 1. The tenant comes from the `Host` header, never from the request body

`middleware.ts`'s matcher now includes `/api`, so `POST /api/leads` calls the same
`getCurrentTenant()` that `app/layout.tsx` and `app/page.tsx` use, and
`landing_page_id` is `tenant.id` from that lookup. The body's own `landing_page_id` — if a
client sends one — is stripped by Zod (objects strip unknown keys by default) and never
reaches the insert.

The lookup also filters `status = 'published'`, so a draft or archived page cannot collect
leads, and an unclaimed host returns 404 before any write is attempted.

Rejected: serialising the resolved tenant id into a header from the middleware. That is the
same trade ADR-0008 already rejected for the render path — it puts the Supabase client in
the edge bundle and queries the row twice. Rejected: letting the handler read `Host`
itself. It works and is equally trustworthy, but it duplicates the port-stripping rule and
creates a second tenant-resolution path for the sake of keeping one line of boilerplate.

### 2. `intent` is constrained to the tenant's own `selectOptions`

The handler builds the allowlist from the tenant's `cta-form` blocks
(`selectOptions[].value`) and rejects anything else with a 400. The row is already fetched
for `tenant.id`, so the check costs nothing.

This keeps the column meaningful: a value in `leads.intent` is always one the tenant
actually offered, so filtering in Supabase Studio is trustworthy. A page with two
`cta-form` blocks contributes both option sets, since the visitor could have submitted
either.

**Known trade-off:** editing `selectOptions` in Studio invalidates any form already open in
a visitor's tab — their submit returns 400 and they must reload. At hand-onboarded scale
this is rarer than the alternative failure (a column nobody can trust).

Rejected: accepting any string with a length cap. It never produces a spurious 400, but any
HTTP client can then write arbitrary text into a field the founder segments on.

### 3. Turnstile fails closed in production, open in development

`verifyTurnstile()` skips the check when `TURNSTILE_SECRET_KEY` is unset — but only when
`NODE_ENV !== 'production'`, which preserves the graceful no-op `.env.example` documents for
a fresh clone. In production a missing secret throws. Failing requests until the config is
fixed is recoverable; silently accepting every bot for as long as the misconfiguration goes
unnoticed is not.

The client resets the widget after any rejected submit, because tokens are single-use with
a ~300s TTL: without a reset the visitor's second attempt fails with `timeout-or-duplicate`
and they are locked out by their own first mistake.

### 4. `anon` loses its insert path on `leads`

`20260805000000_revoke_anon_lead_insert.sql` drops the `anon_insert_leads` policy and
revokes `INSERT` on `public.leads` from `anon`. Every lead now arrives through the route
handler, which verifies Turnstile and inserts with the secret key (`service_role`).

The anon path was the one way to reach `leads` while skipping the bot check. It is unused
today because `SUPABASE_PUBLISHABLE_KEY` is server-only, but "unused and reachable" is a
worse resting state than "removed": the day that key is put behind `NEXT_PUBLIC_` for a
client-side read, the bypass ships with it.

### 5. Responses carry no PII and no field detail

Every rejection returns a fixed string (`Invalid input`, `Unknown tenant`, `Bot check
failed`) with no echo of the submitted values. The whole body is personal data
(`rules/data-privacy.md`), and error strings end up in logs. Client-side `required` /
`minLength` attributes give the visitor the specific feedback instead.

A failed insert is deliberately *not* caught: it throws, Next logs it with the Postgres
message, and the client gets a 500. A lost lead is the worst outcome this app has and the
Postgres message is the only clue to why; shaping a tidier JSON body would trade that clue
for nothing the client can act on.

### 6. `leads` stores the `domain`, snapshotted from the same resolved row

`landing_page_id` is a uuid, and the founder reads leads in Supabase Studio's grid with no
admin UI to join it for them (ADR-0007) — "which client is this lead from" costs a manual
join or a memorised uuid on every glance. `20260805000001_add_lead_domain.sql` adds
`domain text not null`, backfilled from `landing_pages`, and `insertLead()` writes it from
the tenant row the `Host` already resolved.

It is a provenance snapshot, not a cached join: a tenant that later migrates domain keeps
the old value on historical leads, because the question the column answers is "where did
this lead come from", not "where does this client live now". `landing_page_id` remains the
foreign key and the only thing ownership is decided by — nothing branches on `domain`, so
the duplication cannot cause a wrong decision, only a stale label.

`insertLead()` takes the tenant row (`Pick<LandingPageConfig, 'id' | 'domain'>`) rather than
two arguments, so the pair can never be assembled from two different sources. Both are
equally out of the client's reach: a body sending its own `domain` is stripped by the same
Zod default that strips `landing_page_id`.

No index. Filtering by domain is the read pattern, but cardinality is one value per client
and the table is small; `idx_leads_created_at` already covers the default sort.

Rejected: a `leads_with_domain` view joining `landing_pages`. It never goes stale, but the
founder edits `status` in Studio as leads move through the pipeline, and a joined view is
not editable in place — reading and editing would live in two different places.

## Consequences

- `middleware.ts` now runs on `/api` requests. Confirmed still Edge-compatible: the
  OpenNext build bundles the middleware without the "Node.js middleware is not currently
  supported" error, so the `middleware.ts`-not-`proxy.ts` constraint is unaffected.
- Input caps in `lib/schemas/leads.ts` (name 120, message 2000, token 2048, …) are the only
  thing bounding request size while rate limiting is deferred. They are not a substitute:
  revisit before paid traffic, as CLAUDE.md §7 already notes.
- `lib/leads.ts` is the app's only write path and the only holder of the secret key.
  Keeping it in its own module — separate from `lib/supabase.ts`, which reads with the
  publishable key — makes "does this file touch the secret key" answerable by filename.
- No new environment variables. `SUPABASE_SECRET_KEY`, `TURNSTILE_SECRET_KEY` and
  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` were already in `.env.example` and `docs/SECRETS.md`.
- Verified on both runtimes (CLAUDE.md §12): the full matrix on `next dev` and on
  `wrangler dev` (real workerd), including the outbound siteverify fetch from the Worker.
