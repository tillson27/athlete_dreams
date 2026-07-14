# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /workspace

COPY common/package*.json ./common/
COPY client/package*.json ./client/
RUN npm ci --prefix common && npm ci --prefix client

COPY common ./common
RUN npm run build --prefix common

COPY client ./client
RUN npm run build --prefix client

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
WORKDIR /app

COPY --from=builder --chown=node:node /workspace/client/.next/standalone ./
COPY --from=builder --chown=node:node /workspace/client/.next/static ./client/.next/static
COPY --from=builder --chown=node:node /workspace/client/public ./client/public

USER node
EXPOSE 3000
CMD ["node", "client/server.js"]
