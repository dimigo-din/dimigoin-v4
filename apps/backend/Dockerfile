FROM node:22-alpine AS base

FROM base AS system-deps
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache curl ca-certificates \
    && update-ca-certificates \
    && wget -q -t3 'https://packages.doppler.com/public/cli/rsa.8004D9FF50437357.key' -O /etc/apk/keys/cli@doppler-8004D9FF50437357.rsa.pub \
    && echo 'https://packages.doppler.com/public/cli/alpine/any-version/main' | tee -a /etc/apk/repositories \
    && apk add doppler

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/typescript-config ./packages/typescript-config
COPY packages/biome-config/package.json ./packages/biome-config/package.json

FROM deps AS build
WORKDIR /app
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --workspace @dimigoin-v4/backend --include-workspace-root
COPY . .
RUN npm run build:backend

FROM deps AS prod-deps
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --workspace @dimigoin-v4/backend --omit=dev

FROM system-deps AS production
WORKDIR /app/apps/backend
COPY --chown=node:node --from=build /app/apps/backend/dist ./dist
COPY --chown=node:node --from=build /app/apps/backend/src ./src
COPY --chown=node:node --from=build /app/apps/backend/drizzle ./drizzle
COPY --chown=node:node apps/backend/package.json apps/backend/tsconfig.json apps/backend/drizzle.config.ts .
WORKDIR /app
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=prod-deps /app/packages/typescript-config ./packages/typescript-config
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node apps/backend/entrypoint.sh ./entrypoint.sh
RUN chmod 700 ./entrypoint.sh

HEALTHCHECK --interval=1s --timeout=3s --start-period=60s --retries=1 \
  CMD curl -fsS http://localhost:3000/health || exit 1

USER node
ENTRYPOINT ["./entrypoint.sh"]
