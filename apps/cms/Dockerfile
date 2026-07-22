# Strapi 5 CMS — multi-stage build for the Oracle Cloud Ampere A1 (arm64) VM.
# node:24-bookworm-slim matches the repo's Node 24 LTS pin and is multi-arch
# (arm64 + amd64). Deliberately NOT alpine: Strapi's sharp native dep wants glibc;
# musl is the top source of broken Strapi image builds.

# ── builder ───────────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS builder

# Toolchain for native module builds (sharp).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@11.12.0 --activate

WORKDIR /app

# Workspace manifests first, so the install layer caches until a manifest changes.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY apps/cms/package.json apps/cms/
COPY packages/ui/package.json packages/ui/
COPY packages/types/package.json packages/types/
COPY packages/config/package.json packages/config/

# Install only what the cms package (and its workspace deps) needs.
RUN pnpm install --frozen-lockfile --filter cms...

# Source for cms + its only workspace dependency.
COPY packages/types packages/types
COPY apps/cms apps/cms

# Build the Strapi admin/server bundle, then produce a pruned, self-contained
# runtime dir (--legacy = the deterministic deploy mode in pnpm 10/11).
RUN pnpm --filter cms build
RUN pnpm --filter cms deploy --prod --legacy /prod/cms

# pnpm deploy honors apps/cms/.gitignore, which excludes the build output (dist/),
# so overlay the compiled server + admin bundle that Strapi needs at runtime.
RUN cp -r apps/cms/dist /prod/cms/dist

# ── runtime ───────────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder --chown=node:node /prod/cms ./

# COPY --chown already set ownership on the app files; WORKDIR created /app as
# root. The non-root user only needs to own /app itself plus the runtime-writable
# dirs (uploads, and .tmp for the volume mount). Named volumes mounted at these
# paths inherit this ownership on first mount.
RUN mkdir -p /app/.tmp /app/public/uploads \
  && chown node:node /app /app/.tmp /app/public /app/public/uploads

USER node
EXPOSE 1337

# Run Strapi directly from the deployed bin — no pnpm needed at runtime.
CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]
