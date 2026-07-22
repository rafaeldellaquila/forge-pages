# Always-on services deploy runbook (VPS + Cloudflare Tunnel + Access)

Deploys **Strapi CMS**, **NocoDB**, and **Flipt** onto one São Paulo VPS as Docker
containers, fronted entirely by **Cloudflare Tunnel** (no public ports) and gated by
**Cloudflare Access** (Zero-Trust login). Decision + rationale: `docs/adr/0003-cms-hosting-vps-cloudflare-tunnel.md`.

```
Editor/partner ──HTTPS──▶ Cloudflare edge ──▶ Access (email gate) ──▶ Tunnel
                                                                        │  (cloudflared dials OUT;
                                                                        ▼   VPS has no inbound ports)
                                            cms.forgecompany.example.com  ─▶ cms:1337    (Strapi)
                                            db.forgecompany.example.com   ─▶ nocodb:8080 (NocoDB)
                                            flags.forgecompany.example.com─▶ flipt:8080  (Flipt)
```

These are **internal back-office tools**. The public site (Nuxt on Cloudflare Pages) reads
Strapi only on publish/revalidation, so brief downtime here does not take client pages down.

---

## Files in this directory

| File | Role |
|---|---|
| `docker-compose.yml` | The 3 services. **No host ports published** — internal network only. |
| `docker-compose.tunnel.yml` | Adds `cloudflared` (production ingress). |
| `docker-compose.smoke.yml` | Throwaway Postgres + loopback `1337` for a pre-flight test. |
| `cloudflared/config.yml` | Versioned Tunnel ingress rules (edit the UUID). |
| `forge-services.env.example` | Env template → copy to `forge-services.env` **on the VM only**. |
| `.gitignore` | Keeps `forge-services.env` and `cloudflared/credentials/` out of git. |

---

## Prerequisites

- **Cloudflare**: the `forgecompany.example.com` zone is already on Cloudflare (DNS managed there),
  and Zero Trust is enabled (free plan, ≤50 users — enough for the team).
- **AWS**: an account eligible for the Lightsail trial / Free Tier credits (see ADR 0003 —
  the trial is 90 days; the 4 GB bundle is *not* trial-eligible, so use the 2 GB one).
- Your workstation can SSH to the VM and has the repo checked out.

---

## Step 1 — Provision the Lightsail VM

**Console** → Lightsail → Create instance:
- Region: **São Paulo (`sa-east-1`)**, any AZ.
- Blueprint: **OS Only → Ubuntu 24.04 LTS**.
- Bundle: **2 GB RAM / 1 vCPU / 55 GB NVMe** (`$12/mo`, trial-eligible; resize live later if tight).
- Name: `forge-services`. Create.

Then, over SSH (`ssh ubuntu@<instance-ip>` with the Lightsail key):

```bash
# 1. System + swap (guards Strapi memory spikes on a 2 GB box)
sudo apt-get update && sudo apt-get -y upgrade
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 2. Docker Engine + compose plugin (official convenience script)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu   # re-login for this to take effect
```

**Firewall**: in the Lightsail console → instance → **Networking**, remove the default
HTTP (80) / HTTPS (443) rules. Keep **only SSH (22)**. The Tunnel needs no inbound ports —
`cloudflared` dials outbound. (Optionally restrict SSH to your IP.)

---

## Step 2 — Get the code onto the VM

```bash
git clone https://github.com/forgecompany-tech/forge-pages.git
cd forge-pages
```

(Or `scp` a checkout up. The Docker build context is the repo root — the whole pnpm
workspace must be present so the multi-stage `apps/cms/Dockerfile` can build Strapi.)

---

## Step 3 — Fill the environment file (secrets live only here)

```bash
cp infra/vps/forge-services.env.example infra/vps/forge-services.env
# generate 6 fresh Strapi secrets:
for i in 1 2 3 4 5 6; do openssl rand -base64 16; done
```

Edit `infra/vps/forge-services.env`:
- **Strapi secrets** — `APP_KEYS` (two comma-separated values), `API_TOKEN_SALT`,
  `ADMIN_JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `JWT_SECRET`, `ENCRYPTION_KEY`. Fresh values,
  never reused from local/prod.
- **`DATABASE_URL`** — the cloud Supabase Postgres connection string (project
  `ofpnglnnzpowlzsyfbit`). Use the **pooler** connection string, `?sslmode=require`.
- **`SUPABASE_S3_*`** — Supabase Storage S3 endpoint + keys + `landing-page-assets` bucket
  (so uploads don't land on the local disk volume). See `docs/SECRETS.md`.
- **NocoDB** — `NC_AUTH_JWT_SECRET` (`openssl rand -base64 32`); leave `NC_DB` blank to keep
  NocoDB metadata local and add Supabase as an in-app data source afterward.

This file is gitignored — it must never be committed.

---

## Step 4 — Create the Cloudflare Tunnel

Install `cloudflared` on the VM (or run these where you're authenticated, then copy the
credentials up):

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cf.deb
sudo dpkg -i cf.deb

cloudflared tunnel login                 # opens a browser; pick the forgecompany.example.com zone
cloudflared tunnel create forge-pages    # prints the tunnel UUID + writes ~/.cloudflared/<UUID>.json
```

Wire it into the repo layout:

```bash
mkdir -p infra/vps/cloudflared/credentials
cp ~/.cloudflared/<UUID>.json infra/vps/cloudflared/credentials/
# edit infra/vps/cloudflared/config.yml → replace both <TUNNEL_UUID> with the real UUID

# Point the three hostnames at the tunnel (creates proxied CNAMEs in Cloudflare DNS):
cloudflared tunnel route dns forge-pages cms.forgecompany.example.com
cloudflared tunnel route dns forge-pages db.forgecompany.example.com
cloudflared tunnel route dns forge-pages flags.forgecompany.example.com
```

The credentials JSON stays on the VM only (gitignored); the ingress rules in `config.yml`
are versioned.

---

## Step 5 — Gate each hostname with Cloudflare Access

**Zero Trust dashboard** → Access → Applications → **Add a self-hosted application**, once
per hostname (`cms.`, `db.`, `flags.forgecompany.example.com`):

1. Application domain = the hostname.
2. Session duration = e.g. 24h.
3. Add a policy: **Allow**, rule → *Emails ending in* `@forgecompany.example.com` (or an explicit
   allow-list of team emails). Add other identity rules only if needed.
4. Save.

Now every hostname requires a Cloudflare Access login before the request ever reaches the
service — this is the authorization boundary for the admin surfaces. The services themselves
are not reachable from the public internet.

> Strapi/NocoDB keep their *own* admin logins too; Access is the outer gate.

---

## Step 6 — Deploy

```bash
# from the repo root on the VM
docker compose -f infra/vps/docker-compose.yml \
               -f infra/vps/docker-compose.tunnel.yml up -d --build
docker compose -f infra/vps/docker-compose.yml \
               -f infra/vps/docker-compose.tunnel.yml ps
```

First build takes a few minutes (Strapi admin bundle). `restart: unless-stopped` keeps
everything up across reboots.

---

## Step 7 — Verify

- `https://cms.forgecompany.example.com/admin` → Access login → Strapi admin. Register the admin
  user (first boot) or log in. Create the read-only API token for Nuxt (`STRAPI_API_TOKEN`).
- `https://db.forgecompany.example.com` → Access login → NocoDB. Create the workspace; add the
  Supabase Postgres connection as a data source to manage `leads`.
- `https://flags.forgecompany.example.com` → Access login → Flipt UI showing the flags from
  `infra/flipt/feature-flags.yaml`.
- Point the app at prod: set `STRAPI_URL=https://cms.forgecompany.example.com` and
  `FLIPT_URL=https://flags.forgecompany.example.com` (GitHub secrets + Cloudflare Pages env).
  Note: server-to-server calls from Nuxt to a hostname behind Access need an **Access service
  token** (header `CF-Access-Client-Id`/`CF-Access-Client-Secret`), OR bypass Access for the
  Nuxt egress IP. Simplest: keep the public API read path on a service-token policy.

---

## Pre-flight smoke test (optional, before the real deploy)

Proves the Docker build + monorepo + VM work, with no real credentials and nothing exposed:

```bash
# Strapi + a throwaway Postgres; 1337 bound to loopback only
docker compose -f infra/vps/docker-compose.yml \
               -f infra/vps/docker-compose.smoke.yml up -d --build cms db
# from your workstation, tunnel in over SSH and open http://localhost:1337/admin
ssh -L 1337:localhost:1337 ubuntu@<instance-ip>
# tear down (drops the throwaway DB volume):
docker compose -f infra/vps/docker-compose.yml \
               -f infra/vps/docker-compose.smoke.yml down -v
```

`forge-services.env` still needs the six Strapi secrets filled (the smoke overlay supplies
only the DB env).

---

## Operations

```bash
# logs
docker compose -f infra/vps/docker-compose.yml -f infra/vps/docker-compose.tunnel.yml logs -f cms

# redeploy after pulling new code
git pull
docker compose -f infra/vps/docker-compose.yml -f infra/vps/docker-compose.tunnel.yml up -d --build

# rotate a secret: edit forge-services.env, then `up -d` (recreates the affected container)
```

- **Resize**: if Strapi is OOM-killed under load, stop the instance and bump the Lightsail
  bundle to 4 GB (data on the instance disk survives a resize).
- **Backups**: Strapi content and leads live in **Supabase** (backed up by `backup.yml`), not
  on this box. Only `nocodb-data` (NocoDB metadata) and `cms-uploads` (if S3 is not set) are
  local — snapshot the Lightsail instance if you rely on them.
- **Updates**: `docker compose pull` for `nocodb`/`flipt`/`cloudflared` (pinned to `:latest`);
  rebuild `cms` from source on code changes.

## Security notes

- No inbound ports except SSH; all service traffic is outbound-initiated via `cloudflared`.
- Cloudflare Access is the authz gate on every hostname (least privilege; `@forgecompany.example.com`).
- `forge-services.env` and `cloudflared/credentials/` are gitignored — secrets never enter git.
- Strapi CORS stays restricted to the Nuxt site origin (see `apps/cms/config/middlewares.ts`).
