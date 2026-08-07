FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/backoffice/package.json ./apps/backoffice/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/biome-config/package.json ./packages/biome-config/package.json

RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci --workspace dimigoin-backoffice-v4

COPY . .
RUN npm --workspace dimigoin-backoffice-v4 run build

FROM nginx:1.27.2-alpine-slim

COPY apps/backoffice/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/backoffice/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
