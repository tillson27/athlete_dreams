# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS builder
WORKDIR /workspace
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY common/package*.json ./common/
COPY app/package*.json ./app/
RUN npm ci --prefix common && npm ci --prefix app

COPY common ./common
RUN npm run build --prefix common

COPY app ./app
RUN npm run build --prefix app

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=4000 \
    PRISMA_SKIP_POSTINSTALL_GENERATE=true
WORKDIR /workspace
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

COPY common/package*.json ./common/
COPY app/package*.json ./app/
RUN npm ci --omit=dev --prefix common \
    && npm ci --omit=dev --prefix app \
    && npm cache clean --force

COPY --from=builder /workspace/common/dist ./common/dist
COPY --from=builder /workspace/app/dist ./app/dist
COPY --from=builder /workspace/app/prisma ./app/prisma
COPY --from=builder /workspace/app/node_modules/.prisma ./app/node_modules/.prisma
COPY --from=builder /workspace/app/node_modules/@prisma/client ./app/node_modules/@prisma/client

USER node
WORKDIR /workspace/app
EXPOSE 4000
CMD ["node", "dist/index.js"]
