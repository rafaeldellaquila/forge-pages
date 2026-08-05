# Onboarding a new client (landing page)

A client's landing page is **one row** in Supabase, keyed on its `domain`:

| Column group | Holds | Resolved by |
| ------------ | ----- | ----------- |
| `domain`, `status`, `client_id` | tenant identity | `middleware.ts` + `app/page.tsx` — no published row ⇒ **404** |
| `primary_color`, `secondary_color`, `font_family`, `background_*`, `divider_glyph` | theme (ADR-0005) | rendered as per-tenant CSS variables |
| `seo_title`, `seo_description`, `seo_og_image`, `canonical_url` | page metadata | Next.js `metadata` |
| `blocks` (JSONB array) | the page **content** | validated by `lib/schemas/blocks.ts`, rendered by `components/blocks/` |

> **Golden rule:** the row must exist with `status = 'published'` and its `domain` must
> match the request `Host` exactly (minus the port). An empty `blocks` array (`[]`, the
> column default) renders a themed but contentless page.

Each client also needs a `clients` row (owner contact) that the `landing_pages` row
references via `client_id`.

In production the domain additionally needs a **Cloudflare for SaaS custom hostname** for
DNS/SSL. That's the whole onboarding: one row, one hostname — no CMS entry, no per-client
deploy (ADR-0007).

---

## Local (development)

Locally we use `*.localhost` subdomains — browsers resolve them to loopback with no
`/etc/hosts` edits, and the middleware strips the port. Pick a subdomain such as
`novocliente.localhost`.

### Via Supabase Studio (quickest)

1. Open Studio at `http://127.0.0.1:54323` → Table Editor.
2. `clients` → **Insert row**: `name`, `email`, `whatsapp`.
3. `landing_pages` → **Insert row**: `client_id` (the row above), `domain =
   novocliente.localhost`, `status = published`, theme colors/font, SEO fields.
4. Open the new row's `blocks` cell and paste the block array (see §Block JSON below).
5. Open `http://novocliente.localhost:3000`.

### Via the seed files (so a `db reset` reproduces it)

1. `infra/supabase/seed/01_clients.sql` — add a `clients` row.
2. `infra/supabase/seed/02_landing_pages.sql` — add a `landing_pages` row with the new
   `domain`, `status = 'published'`, theme, and its `blocks` array.
3. Apply:
   ```bash
   pnpm exec supabase db reset --workdir infra
   ```
   Or, without wiping the DB, pipe a single seed file into the running container:
   ```bash
   docker exec -i "$(docker ps --format '{{.Names}}' | grep -m1 supabase_db)" \
     psql -U postgres -d postgres < infra/supabase/seed/02_landing_pages.sql
   ```

### Verify

```bash
curl -s -H "Host: novocliente.localhost" http://localhost:3000/ | grep -oiE '<title>[^<]*</title>'
```

---

## Block JSON

`blocks` is an ordered array; each entry has a `type` discriminator plus that block's
fields. Types and required fields are defined in `lib/types/blocks.ts` and enforced by
`lib/schemas/blocks.ts` — read those two files rather than guessing, and copy an existing
tenant's array as a starting point.

```json
[
  { "type": "header", "variant": "default", "ctaLabel": "Fale com a gente" },
  { "type": "hero", "variant": "default", "headline": "…", "subheadline": "…" },
  { "type": "cta-form", "headline": "…", "ctaLabel": "Enviar" },
  { "type": "footer", "copyright": "…" }
]
```

A block whose JSON fails validation fails loudly at fetch time — the Zod error names the
offending path. Adding a **new** block type means a new interface, a new schema, and a new
component (`mise run gen:block <name>` scaffolds the component and prints the rest).

---

## Production

1. **Supabase (prod project `ofpnglnnzpowlzsyfbit`)** — insert the `clients` and
   `landing_pages` rows with the **real domain** and `status = 'published'`, including the
   theme, SEO fields, and the `blocks` array. Studio or the SQL editor, same as local.

2. **Custom domain + SSL (Cloudflare for SaaS)** — see
   `docs/adr/0001-hosting-cloudflare.md`:
   - Add the client's hostname as a **Custom Hostname** on the Cloudflare for SaaS zone
     (provisions a free per-domain SSL certificate).
   - The client points their DNS (a `CNAME`) at the Cloudflare target.
   - The Worker receives the request, resolves the tenant from the `Host` header, and
     renders — no per-client deploy.

3. **Verify** — load `https://<domain>`; confirm the tenant's theme, SEO title, and blocks
   render, and that a form submission creates a `leads` row (check it in Studio, filtered by
   `landing_page_id`).

4. *(Optional)* Enable **Cloudflare Web Analytics** for the new hostname in the Cloudflare
   dashboard — zero config, no env var.

---

## Checklist

- [ ] `clients` row created (owner name/email/whatsapp).
- [ ] `landing_pages` row created — correct `domain`, `status = 'published'`, theme + SEO.
- [ ] `blocks` array filled and passing validation (page renders content, not just theme).
- [ ] (Prod) Cloudflare custom hostname added + client DNS `CNAME` pointed.
- [ ] Page loads with the right theme and blocks; test lead submits successfully.

See also: `docs/LOCAL_DEVELOPMENT.md` (full local runbook) and
`docs/adr/0001-hosting-cloudflare.md` (hosting/SSL).
