# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22-alpine

# ---------- deps ----------
FROM node:${NODE_VERSION} AS deps
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml .pnpmrc ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- builder ----------
FROM deps AS builder
COPY . .
RUN pnpm run build

# ---------- runtime ----------
FROM node:${NODE_VERSION} AS runtime
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate \
 && apk add --no-cache wget tini
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml .pnpmrc ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod && \
    pnpm add drizzle-kit

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/i18n ./src/i18n
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
# DB schema is managed via `pnpm db:push` (run manually after schema changes:
#   docker exec basti-backend pnpm db:push --force
# drizzle-kit is still installed in this image to support that command.
CMD ["node", "dist/src/main"]
