# Onboarding a new client (landing page)

A client's landing page lives in **two systems**, both keyed on the same `domain`:

| System | Holds | Resolved by |
| ------ | ----- | ----------- |
| **Supabase `landing_pages`** | tenant identity, theme (colors/font), SEO, `status` | `apps/web/server/middleware/tenant.ts` — no published row ⇒ **404** |
| **Strapi** (published entry) | the page **blocks** (content) | `apps/web/server/api/blocks.get.ts` — filters `status: 'published'` |

> **Golden rule:** the `domain` must be **identical** in both places, and both must be
> **published**. A Supabase row without a Strapi entry renders an empty page; a Strapi
> entry without a Supabase row 404s.

Each client also needs a `clients` row (owner contact) that the `landing_pages` row
references via `client_id`.

---

## Local (development)

Locally we use `*.localhost` subdomains — browsers resolve them to loopback with no
`/etc/hosts` edits, and the tenant middleware strips the port. Pick a subdomain such as
`novocliente.localhost`.

### Fast path — the seed script (recommended)

1. **Supabase** — add the client + landing page. Edit the seeds so a `db reset`
   reproduces them, then apply live (no reset needed):
   - `infra/supabase/seed/01_clients.sql` — add a `clients` row.
   - `infra/supabase/seed/02_landing_pages.sql` — add a `landing_pages` row with the new
     `domain`, `status = 'published'`, and theme colors/font.
   - Apply to the running DB:
     ```bash
     docker exec -i "$(docker ps --format '{{.Names}}' | grep -m1 supabase_db)" \
       psql -U postgres -d postgres < infra/supabase/seed/01_clients.sql
     # (repeat for 02_landing_pages.sql; or just run: pnpm exec supabase db reset --workdir infra)
     ```

2. **Strapi content** — add a client spec to the `clients` array in
   `apps/cms/scripts/seed-content.cjs` (copy an existing entry, change the `domain` and
   copy), then run the seeder:
   ```bash
   cd apps/cms && node scripts/seed-content.cjs
   ```
   It **replaces** every listed domain's entry (delete + recreate, published). No API
   token needed — it runs inside the Strapi app context.

3. **Verify**:
   ```bash
   curl -s -H "Host: novocliente.localhost" http://localhost:3001/ | grep -oiE '<title>[^<]*</title>'
   ```
   Then open `http://novocliente.localhost:3001` (use `:3001` if `:3000` was taken).

### CMS path — how a non-developer does it (Strapi admin)

1. Create the Supabase `clients` + `landing_pages` rows (via Supabase Studio at
   `http://127.0.0.1:54323`, table editor) with the new `domain`, `status = published`.
2. Strapi admin → **Content Manager → Landing Page → Create**:
   - set **`domain`** to the exact same value,
   - add blocks (Header, Hero, …, CTA Form, Footer),
   - **Save → Publish**.
3. Open `http://<domain>:3001`.

---

## Production

Same two systems, plus DNS/SSL for the real hostname (e.g. `lp.cliente.com.br`).

1. **Supabase (prod project)** — insert the `clients` and `landing_pages` rows with the
   **real domain** and `status = 'published'` (SQL editor or an app admin flow). Set theme
   colors, font, and SEO fields.

2. **Strapi (prod)** — create and **publish** a Landing Page entry with the same `domain`
   and its blocks.

3. **Custom domain + SSL (Cloudflare for SaaS)** — see
   `docs/adr/0001-hosting-cloudflare.md`:
   - Add the client's hostname as a **Custom Hostname** on the Cloudflare for SaaS zone
     (provisions a free per-domain SSL certificate).
   - The client points their DNS (a `CNAME`) at the Cloudflare target.
   - The Nuxt app receives the request, resolves the tenant from the `Host` header, and
     renders — no per-client deploy.

4. **Verify** — load `https://<domain>`; confirm the tenant's theme, SEO title, and blocks
   render, and that a form submission creates a lead (which triggers the notification Edge
   Function in the cloud project).

---

## Checklist

- [ ] `clients` row created (owner name/email/whatsapp).
- [ ] `landing_pages` row created — correct `domain`, `status = 'published'`, theme + SEO.
- [ ] Strapi Landing Page entry created with the **same** `domain` and **published**.
- [ ] (Prod) Cloudflare custom hostname added + client DNS `CNAME` pointed.
- [ ] Page loads with the right theme and blocks; test lead submits successfully.

See also: `docs/LOCAL_DEVELOPMENT.md` (full local runbook) and
`docs/adr/0001-hosting-cloudflare.md` (hosting/SSL).
