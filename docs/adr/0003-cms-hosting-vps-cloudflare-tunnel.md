# 3. Always-on services (Strapi, NocoDB, Flipt) on a São Paulo VPS behind Cloudflare Tunnel

Date: 2026-07-22
Status: Accepted

## Context

ADR 0001 moved the web app to Cloudflare and **deferred** hosting for the always-on
services (Strapi CMS, NocoDB, Flipt). These are **internal back-office tools**, not on the
visitor hot path: Nuxt on Cloudflare serves clients via ISR (1 h cache) and only touches
Strapi on publish/revalidation. So the real requirements are reliable provisioning, enough
RAM (Strapi is the hog, ~0.6–1 GB at runtime; NocoDB ~0.2–0.3 GB; Flipt ~30 MB), and an
auth gate in front — not high availability or low end-user latency.

Options surveyed (2026-07):

- **Oracle Cloud Always Free (Ampere A1)** — genuinely free always-on, but the free A1
  allocation was **halved to 2 OCPU / 12 GB on 2026-06-15**, and the `sa-saopaulo-1` region
  has a recurring **"out of host capacity"** shortage that makes instance creation a scripted
  retry gamble. Rejected as the primary: unacceptable provisioning risk for a paid-client
  product. Kept as a $0 fallback if capacity frees up.
- **Scale-to-zero PaaS (Fly.io, Cloudflare Containers)** — both viable and cheap for sparse
  internal use (the services are effectively stateless: uploads → Supabase S3, DB → Supabase,
  Flipt → a repo YAML), but each adds a second edge/compute platform alongside Cloudflare.
  Fly.io has a São Paulo region (`gru`) with a regional price markup. Cloudflare Containers
  (GA 2026-04) is the most integrated but least battle-tested for a heavyweight Strapi.
- **Cheap always-on VPS (Vultr, AWS Lightsail — both São Paulo)** — fixed low cost, no cold
  start, a proven Docker host. Since **Cloudflare is already core infra** (Pages, for-SaaS,
  DNS), a VPS pairs with **Cloudflare Tunnel** (no public IP / no inbound ports, free TLS on
  our subdomains) and **Cloudflare Access** (free Zero-Trust auth gate, ≤50 users) to give the
  internal tools a managed-feeling, single-control-plane front without a second vendor.

## Decision

- **Host Strapi + NocoDB + Flipt on one AWS Lightsail VPS** in São Paulo (`sa-east-1`),
  2 GB bundle (1 vCPU / 2 GB / 55 GB NVMe, the largest free-trial-eligible tier — 90-day
  Lightsail trial, extendable ~6 months via new-account AWS Free Tier credits; ~R$62/mo
  after). Ubuntu 24.04. A 1–2 GB swapfile guards against Strapi memory spikes.
- **Run the services as Docker containers** via Docker Compose in `infra/vps/`
  (`docker-compose.yml`). The multi-stage `apps/cms/Dockerfile` is multi-arch, so it builds
  natively on the x86 Lightsail box. **No host ports are published** — services talk only over
  the internal compose network.
- **Cloudflare Tunnel is the sole ingress.** A `cloudflared` container
  (`docker-compose.tunnel.yml`) dials out to Cloudflare; ingress rules are **versioned in the
  repo** (`infra/vps/cloudflared/config.yml`, locally-managed tunnel) mapping
  `cms.` / `db.` / `flags.forgecompany.example.com` to the internal services. The per-tunnel
  credentials JSON lives only on the VM (gitignored). The VPS firewall allows **no inbound
  except SSH**; nothing else is reachable from the public internet.
- **Cloudflare Access gates every hostname.** One Access application per subdomain with an
  email policy restricted to `@forgecompany.example.com` — the authorization layer for the admin
  surfaces (free Zero-Trust tier). Configured in the Zero Trust dashboard (no Terraform in
  this project); steps live in `.github/SETUP.md`.
- **Two-phase rollout.** Phase 1: a throwaway **smoke test** — Strapi + a disposable Postgres
  sidecar (`docker-compose.smoke.yml`), reached over an SSH tunnel, no real credentials on the
  box — to prove the Docker build + monorepo + VPS work. Phase 2: point the services at the
  real cloud Supabase Postgres + Supabase S3, stand up the Cloudflare Tunnel + Access, verify
  end-to-end.
- This **supersedes the "deferred" stance in ADR 0001** for always-on services. ADR 0001's
  web-hosting decision (Cloudflare Pages + Cloudflare for SaaS) is unchanged.

## Consequences

- We own the box: OS patching, Docker upgrades, and process supervision (Docker
  `restart: unless-stopped`) are ours. Cloudflare Tunnel removes the usually-painful parts
  (public IP exposure, TLS/cert management, reverse-proxy config).
- **Access is the authorization boundary** for the admin tools; the services themselves are
  not internet-reachable, so a misconfigured Strapi/NocoDB permission is not directly
  exploitable from outside. Access + Tunnel are free within the 50-user Zero-Trust tier.
- Best-effort availability is acceptable — editors and partners, not end users; the public
  site is served by Cloudflare and degrades gracefully if a service is briefly down.
- Cost: $0 during the trial/credit window, then ~R$62/mo for the 2 GB bundle. If RAM is
  tight under Strapi load, resize the Lightsail bundle live (4 GB) rather than re-architecting.
- `docs/GO_LIVE.md` / `.github/SETUP.md` gain the VPS provisioning, Cloudflare Tunnel, and
  Access setup steps; a repeatable CI-driven deploy is future work, not part of this ADR.
