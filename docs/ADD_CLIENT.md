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

> Editing an existing tenant's page instead of creating a new one? Skip to
> [Editing an existing landing page](#editing-an-existing-landing-page).

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

## Editing an existing landing page

Editing is a read-modify-write of the same one row described above — usually its `blocks`
column, sometimes its theme/background/SEO columns. There's no diffing tool and no CMS.

**Locate the row first, by `domain`** (unique) — not by `client_id` alone. Confirm it's the
right tenant before changing anything.

**Read the current `blocks` array in full before writing anything back.** It's a single
JSONB value holding every section of the page — an update built from anything other than the
full current array silently drops whatever block(s) you didn't include. Edit only what needs
to change, then write the whole array back.

Three edit surfaces, pick based on where the change needs to live:

| Surface | Best for |
| ------- | -------- |
| Studio cell edit (Table Editor) | A small one-off change, especially in **production** where seed files don't apply |
| Seed file (`infra/supabase/seed/02_landing_pages.sql`) + `supabase db reset --workdir infra` | A change that should survive a local reset (fixing a demo tenant for good) |
| Direct SQL `UPDATE` (Studio SQL editor or `psql`) | A large JSON edit that's awkward in Studio's cell editor |

Two things can go wrong with an edit, and only one of them is loud:

- A field that fails Zod validation (wrong type, missing required field) fails **loudly** at
  fetch time, naming the exact JSON path — easy to catch, the page won't render.
- A misspelled `variant` (e.g. `"centred"` instead of `"centered"`) fails **silently** — it
  falls back to `'default'` and the page still renders, just not as intended. A clean page
  load after an edit is not proof the edit did what you meant; check the rendered result
  against the actual request, not just the absence of an error.

If the edit adds a second block of a type already present elsewhere on the page (e.g. a
second `value-proposition`), give it its own `anchorId` — a duplicate or missing `anchorId`
breaks in-page nav links silently (a dead `#fragment`, no error). If the edit touches a
`background` (on `header`, `hero`, `differentials`, or the page-level `background_*`
columns), keep colors going through `colorToken` (`primary`\|`secondary`\|`custom`) rather
than hardcoding a hex value.

Non-block fields on the same row follow the same rule: `theme_mode` (`dark`\|`light` only —
picks one of two fixed neutral ramps, not a free palette), `primary_color`/`secondary_color`,
`font_family`/`secondary_font_family` (must be a name in the curated registry, `lib/fonts.ts`
— not free text), and the SEO columns.

**Verify** by reloading the tenant and confirming the specific change is visible — not just
that the page still loads. For a production edit, also check the *other* blocks on the page
are unchanged, which catches an accidental partial-array write.

### Editing checklist

- [ ] Correct row located by exact `domain`.
- [ ] Full current `blocks` array read before writing (no partial/blind update).
- [ ] `anchorId` still unique across same-type blocks after the edit.
- [ ] Colors still routed through `colorToken`, not hardcoded.
- [ ] Page reloaded and the specific change confirmed visible — not just "no error."
- [ ] (Prod) Other blocks on the page confirmed unchanged.

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
