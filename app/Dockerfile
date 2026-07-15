# syntax=docker/dockerfile:1

# Multi-stage arm64 image for the FAD/ARC API (Graviton Fargate runtime).
#
# Build context is the REPO ROOT because `fad-common` is a `file:../common`
# workspace dependency of `app/`:
#   docker build -f app/Dockerfile -t arc-api .
#
# argon2 is a native (glibc) addon, so this uses the Debian-based `slim`
# images, not Alpine (musl) — avoids a from-source argon2 rebuild.

ARG NODE_IMAGE=node:22.22.2-bookworm-slim

# ── Stage 1: build ──────────────────────────────────────────────────────────
# Builds `common` (tsc), then `app` (prisma generate + tsc). Runs on arm64 so
# the generated Prisma query engine matches the Graviton runtime.
FROM ${NODE_IMAGE} AS builder
WORKDIR /repo

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    HUSKY=0

COPY common/package.json common/package-lock.json* ./common/
RUN npm --prefix common ci || npm --prefix common install
COPY common/tsconfig.json ./common/tsconfig.json
COPY common/src ./common/src
RUN npm run build --prefix common

COPY app/package.json app/package-lock.json* ./app/
RUN npm --prefix app ci || npm --prefix app install
COPY app/tsconfig.json ./app/tsconfig.json
COPY app/prisma ./app/prisma
COPY app/src ./app/src
RUN npm run build --prefix app

# ── Stage 2: runtime ────────────────────────────────────────────────────────
# Slim Node image carrying only production deps, the generated Prisma client,
# compiled `dist/`, and `prisma/` (schema + migrations for the migrate/seed
# RunTasks). The seed (`tsx prisma/seed.ts`) also imports the two pure-data
# client/lib modules from `../../client/lib`, so those + `tsx` are included.
FROM ${NODE_IMAGE} AS runtime
WORKDIR /repo/app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=8080 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    HUSKY=0

# fad-common's built dist requires its own runtime deps (zod) resolved from
# /repo/common/node_modules — Node does not fall back to /repo/app/node_modules
# for a require() originating in /repo/common/dist. Install common's prod deps.
COPY common/package.json common/package-lock.json* ./../common/
RUN (npm --prefix ./../common ci --omit=dev || npm --prefix ./../common install --omit=dev) \
  && npm cache clean --force
COPY --from=builder /repo/common/dist ./../common/dist

COPY app/package.json app/package-lock.json* ./
RUN (npm ci --omit=dev || npm install --omit=dev) \
  && npm cache clean --force

COPY app/prisma ./prisma
COPY --from=builder /repo/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /repo/app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /repo/app/dist ./dist

# The migration/seed RunTasks (ApiStack) invoke `npx prisma migrate deploy` and
# `npx prisma db seed` (→ the `prisma.seed` script `tsx prisma/seed.ts`). The
# Prisma CLI and tsx are app devDependencies excluded by `--omit=dev`, so copy
# both (at the exact locked versions the builder resolved) and recreate their
# .bin shims so `prisma` and the spawned `tsx` are on PATH for those tasks only.
COPY --from=builder /repo/app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /repo/app/node_modules/@prisma/engines ./node_modules/@prisma/engines
COPY --from=builder /repo/app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /repo/app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder /repo/app/node_modules/@esbuild/linux-arm64 ./node_modules/@esbuild/linux-arm64
RUN ln -sf ../prisma/build/index.js node_modules/.bin/prisma \
  && ln -sf ../tsx/dist/cli.mjs node_modules/.bin/tsx

# Pure-data modules the Prisma seed imports via ../../client/lib/*.
COPY client/lib/mockAthletes.ts client/lib/athleteProfiles.ts ./../client/lib/

# Pure helpers the seed imports via ../src/shared/* (e.g. displayDate).
# CONTRACT: seed imports must stay within client data modules + src/shared
# pure helpers — anything else won't exist in this runtime image.
COPY app/src/shared ./src/shared

# HOME must exist and be writable: Prisma/npx write caches there at runtime.
RUN groupadd --system --gid 1001 arc \
  && useradd --system --uid 1001 --gid arc --home-dir /home/arc --create-home arc \
  && chown -R arc:arc /repo /home/arc
USER arc
ENV HOME=/home/arc

EXPOSE 8080

CMD ["node", "dist/index.js"]
