# Basti Backend Service — Documentation

The API behind the Basti platform: a NestJS 11 service backing the admin dashboard and the customer mobile app. It handles authentication, the bakery/chef/product catalogue, the custom-cake builder, orders and dispatch, payments, reviews, coupons/offers, and push notifications — all bilingual (English / Arabic).

- **Live API:** `https://api.basty.ly/api`
- **API reference (Scalar):** `https://api.basty.ly/api/docs` — HTTP Basic Auth
- **Consumed by:** the admin dashboard (`test-dashboard`, at `dashboard.basty.ly`) and the customer mobile app

---

## Table of contents

1. [Stack](#stack)
2. [Getting started](#getting-started)
3. [Environment variables](#environment-variables)
4. [Project layout](#project-layout)
5. [How a request flows](#how-a-request-flows)
6. [Authentication & roles](#authentication--roles)
7. [Database & migrations](#database--migrations)
8. [Internationalisation](#internationalisation)
9. [External services](#external-services)
10. [Deployment](#deployment)
11. [Observability](#observability)
12. [Common tasks](#common-tasks)
13. [Troubleshooting](#troubleshooting)

---

## Stack

| Concern          | Choice                                                              |
| ---------------- | ------------------------------------------------------------------- |
| Runtime          | Node.js 22.x                                                        |
| Package manager  | pnpm 10.33.0 (pinned via `packageManager`)                          |
| Framework        | NestJS 11 on Express 5                                              |
| Database         | PostgreSQL 16                                                       |
| ORM / migrations | Drizzle ORM + drizzle-kit                                           |
| Validation       | `class-validator` / `class-transformer` (DTOs), Zod (env)           |
| Auth             | Passport JWT, access + refresh tokens in httpOnly cookies           |
| API docs         | `@nestjs/swagger` document rendered by Scalar                       |
| i18n             | `nestjs-i18n` (en/ar) + Google Cloud Translate and Lara for content |
| Storage          | Cloudflare R2 (S3-compatible)                                       |
| Email            | Brevo HTTP API                                                      |
| Push             | Firebase Admin (FCM)                                                |
| Errors/logs      | Sentry SDK pointed at a self-hosted GlitchTip                       |
| Hosting          | Docker Compose on a VPS, fronted by Caddy                           |

---

## Getting started

### Prerequisites

- Node.js 22.x
- pnpm 10.33.0 — `corepack enable && corepack prepare pnpm@10.33.0 --activate`
- A PostgreSQL 16 database (local, Docker, or Neon)

### First run

```bash
pnpm install
cp .env.example .env      # then fill in real values — see below
pnpm db:migrate           # apply schema migrations
pnpm seed                 # optional: load reference/demo data
pnpm start:dev            # watch mode on http://localhost:3000/api
```

Every route is served under the global `/api` prefix (set in [src/main.ts](../src/main.ts)). Once running:

- API root — `http://localhost:3000/api`
- Docs — `http://localhost:3000/api/docs`
- Health — `http://localhost:3000/api/health`

> **Note on `.env.example`:** it covers the core variables but is not exhaustive. The authoritative list is the Zod schema in [src/env.ts](../src/env.ts) — the process refuses to boot and prints every offending key if something required is missing or malformed. Treat a failed boot as the checklist.

### Scripts

| Command                                 | What it does                                         |
| --------------------------------------- | ---------------------------------------------------- |
| `pnpm start:dev`                        | Watch-mode dev server                                |
| `pnpm start:debug`                      | Watch mode with the Node inspector attached          |
| `pnpm build`                            | Compile TypeScript to `dist/`                        |
| `pnpm start:prod`                       | Run the compiled build (`node dist/main`)            |
| `pnpm lint`                             | ESLint with `--fix`                                  |
| `pnpm format`                           | Prettier over `src/` and `test/`                     |
| `pnpm type-check`                       | `tsc --noEmit`                                       |
| `pnpm test` / `test:watch` / `test:cov` | Jest unit tests (`*.spec.ts` under `src/`)           |
| `pnpm test:e2e`                         | Jest e2e suite (`test/jest-e2e.json`)                |
| `pnpm db:generate`                      | Generate a migration from schema changes             |
| `pnpm db:migrate`                       | Apply pending migrations                             |
| `pnpm db:push`                          | Push schema straight to the DB (dev only)            |
| `pnpm db:studio`                        | Drizzle Studio browser UI                            |
| `pnpm db:reset`                         | **Destructive** — drop and recreate the schema       |
| `pnpm seed`                             | Seed via ts-node; `seed:prod` runs the compiled seed |

Husky + lint-staged run ESLint and Prettier on staged files at commit time.

---

## Environment variables

Validated by Zod at boot in [src/env.ts](../src/env.ts). Anything without a default is **required** — the app will not start without it.

### Core

| Variable    | Default       | Notes                                              |
| ----------- | ------------- | -------------------------------------------------- |
| `NODE_ENV`  | `development` | `development` \| `production`                      |
| `PORT`      | `3000`        | HTTP port                                          |
| `LOG_LEVEL` | `info`        | `silent` \| `error` \| `warn` \| `info` \| `debug` |

### Database

| Variable      | Default | Notes                                                                   |
| ------------- | ------- | ----------------------------------------------------------------------- |
| `DB_HOST`     | —       | **Required.** `postgres` when running under Docker Compose              |
| `DB_PORT`     | `5432`  |                                                                         |
| `DB_USERNAME` | —       | **Required**                                                            |
| `DB_PASSWORD` | —       | **Required**                                                            |
| `DB_DATABASE` | —       | **Required**                                                            |
| `DB_SSL`      | `false` | `true` adds `sslmode=require&channel_binding=require` — needed for Neon |

`DATABASE_URL` is **derived** from these, not read from the environment by the app; `env.DATABASE_URL` is always populated. (drizzle-kit, by contrast, will accept a `DATABASE_URL` directly if you set one — see [drizzle.config.ts](../drizzle.config.ts).)

### Auth

| Variable                        | Default  | Notes                         |
| ------------------------------- | -------- | ----------------------------- |
| `JWT_ACCESS_SECRET`             | —        | **Required**, min 8 chars     |
| `JWT_ACCESS_EXPIRES_IN`         | `900`    | Seconds (15 min)              |
| `JWT_REFRESH_SECRET`            | —        | **Required**, min 8 chars     |
| `JWT_REFRESH_EXPIRES_IN`        | `604800` | Seconds (7 days)              |
| `JWT_SETUP_PROFILE_EXPIRES_IN`  | `600`    | Profile-setup token, seconds  |
| `JWT_RESET_PASSWORD_EXPIRES_IN` | `3600`   | Password-reset token, seconds |
| `BCRYPT_SALT_ROUNDS`            | `10`     | Production uses 12            |

### HTTP

| Variable                          | Default | Notes                                                                     |
| --------------------------------- | ------- | ------------------------------------------------------------------------- |
| `CORS_ORIGINS`                    | `[]`    | Comma-separated. **Empty means `*`** — always set it in production        |
| `DOCS_USERNAME` / `DOCS_PASSWORD` | unset   | Both set ⇒ `/api/docs` is behind HTTP Basic Auth. Unset ⇒ docs are public |

### Email (Brevo)

| Variable         | Notes                                |
| ---------------- | ------------------------------------ |
| `BREVO_API_KEY`  | **Required**                         |
| `MAIL_FROM_NAME` | **Required** — sender display name   |
| `MAIL_FROM`      | **Required** — must be a valid email |
| `MAIL_REPLY_TO`  | Optional                             |

### Storage (Cloudflare R2)

`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — all **required**. `R2_PUBLIC_URL` must be a valid URL; a trailing slash is stripped automatically.

### Translation

| Variable                                                  | Notes                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| `GCP_PROJECT_ID` / `GCP_CLIENT_EMAIL` / `GCP_PRIVATE_KEY` | Inline service-account credentials for Google Cloud Translate |
| `LARA_ACCESS_KEY_ID` / `LARA_ACCESS_KEY_SECRET`           | **Required** — Lara translation                               |

### Push (Firebase Admin)

| Variable                | Notes                                                                          |
| ----------------------- | ------------------------------------------------------------------------------ |
| `FIREBASE_PROJECT_ID`   | **Required** — canonical project is `basty-notifications`                      |
| `FIREBASE_CLIENT_EMAIL` | **Required**                                                                   |
| `FIREBASE_PRIVATE_KEY`  | **Required** — quote it; literal `\n` sequences are converted to real newlines |

### Payments

`MASARAT_URL`, `MASARAT_USER_ID`, `MASARAT_PIN`, `MASARAT_PROVIDER_ID`, `TADAWUL_URL`, `TADAWUL_ID`, `TADAWUL_TOKEN`, `TADAWUL_WEBHOOK_URL` — all **required**. The `*_URL` values must be valid URLs.

> These are required unconditionally, so a local dev environment still needs placeholder URLs that parse (e.g. `http://localhost:1`) even if you never exercise payments.

### Monitoring

| Variable         | Notes                                                      |
| ---------------- | ---------------------------------------------------------- |
| `SENTRY_DSN`     | Optional — GlitchTip DSN; reporting is disabled when unset |
| `SENTRY_RELEASE` | Set by CI to `basti-backend@<sha>`                         |

---

## Project layout

```
src/
├── main.ts                 # Bootstrap: prefix, pipes, CORS, docs, logger
├── app.module.ts           # Root module — imports every feature module
├── env.ts                  # Zod-validated environment
├── instrument.ts           # Sentry/GlitchTip init (imported first in main.ts)
├── sentry-logger.ts        # Nest logger that also forwards to GlitchTip
├── common/                 # Cross-cutting concerns
│   ├── decorators/         # @CurrentUser, @CurrentAdmin, @Public, pagination, sort
│   ├── guards/             # JWT guards, refresh guard, AdminRolesGuard
│   ├── strategies/         # Passport access/refresh strategies
│   ├── interceptors/       # i18n response translation
│   ├── filters/            # i18n exception translation
│   ├── middleware/         # AdminExtractionMiddleware (runs on every route)
│   ├── services/           # email, firebase, storage (R2), mail client
│   ├── translation/        # Translation module (Google / Lara)
│   └── email-templates/
├── constants/              # Global constants + Swagger examples
├── db/
│   ├── index.ts            # Drizzle instance + pg Pool
│   ├── schema/             # One file per table, re-exported from index.ts
│   ├── migrations/         # Generated SQL + journal
│   ├── scripts/            # Maintenance/backfill scripts
│   ├── seeds/              # Seed data and seeder
│   └── utils/
├── i18n/                   # en/ and ar/ message catalogues
├── modules/                # 24 feature modules
└── utils/                  # errors, response handler, search, validators
```

Every feature module follows the same shape — `controllers/`, `services/`, `dto/`, `decorators/`, and a `*.module.ts`. See [NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md) for the full house style before adding code.

**Path alias:** `@/*` → `src/*`. Scripts run through ts-node need `-r tsconfig-paths/register` for it to resolve.

### Feature modules

`auth` · `admin-auth` · `region` · `bakery` · `chef` · `driver` · `featured-cake` · `sweet` · `addon` · `tags` · `items` · `custom-cakes` (shapes, flavors, decorations, pre-designed cakes) · `cart` · `order` · `payment` · `payment-method` · `coupon` · `offer` · `review` · `location` · `notification` · `slider-image` · `config` · `upload` · `health`

That's 28 controllers in total.

---

## How a request flows

1. **`AdminExtractionMiddleware`** runs on every route and attaches `request.admin` when an admin token is present.
2. **`ThrottlerGuard`** (global) — 200 requests per minute per IP. `app.set('trust proxy', 1)` is set so the real client IP is read from `X-Forwarded-For` behind Caddy/Cloudflare, rather than rate-limiting the proxy itself.
3. **Route guards** — JWT guard variants, plus `AdminRolesGuard` where `@AdminRoles(...)` is declared.
4. **`ValidationPipe`** (global) with `whitelist`, `forbidNonWhitelisted`, and `transform` on. Unknown body properties are rejected outright, so DTOs must declare every field a client may send.
5. **Controller → service → Drizzle.**
6. **`I18nResponseInterceptor`** translates response messages into the request's language.
7. **`I18nExceptionFilter`** does the same for thrown exceptions.

Language is resolved from `?lang=`, the `Accept-Language` header, or `x-custom-lang`, falling back to `en`.

Responses follow a consistent envelope:

```jsonc
{
  "code": 200,
  "success": true,
  "message": "…", // already translated
  "data": {},
  "timestamp": "…",
}
```

---

## Authentication & roles

Two separate surfaces:

- **`auth`** — customer/mobile-app authentication.
- **`admin-auth`** — dashboard authentication (`/api/admin-auth/login`, `/refresh`, `/check-auth`, …).

Access and refresh tokens are issued as **httpOnly cookies**, so browser clients must send `withCredentials: true` and the API must list the dashboard origin in `CORS_ORIGINS` (credentialed CORS cannot use a `*` origin). The dashboard refreshes transparently on a 401 against `/admin-auth/refresh`.

**Admin roles** (`admin_role_enum`): `super_admin`, `admin`, `manager`, `driver`.

Restrict a route with the decorator plus the guard:

```ts
@AdminRoles('super_admin', 'admin')
@UseGuards(JwtWithAdminGuard, AdminRolesGuard)
@Patch(':id')
update(...) {}
```

`AdminRolesGuard` throws `ForbiddenException` when `request.admin` is absent or its role isn't in the allowed list. A route with no `@AdminRoles` metadata passes the guard unconditionally — so the guard alone is not authentication; always pair it with a JWT guard.

---

## Database & migrations

Drizzle ORM over a `pg` Pool ([src/db/index.ts](../src/db/index.ts)). The pool registers an `error` handler because Neon terminates idle connections and an unhandled `error` event on an idle client would otherwise crash the process.

Schema lives in [src/db/schema/](../src/db/schema/) — one file per table, all re-exported from `index.ts`. Tables cover users, admins, regions, bakeries, chefs, orders and order items, carts, the custom-cake builder (shapes, shape-variant images, flavors, decorations, designed-cake configs, pre-designed cakes), payment methods, reviews, reports, coupons, offers, slider images, tags, notifications, app config, and region/bakery item pricing and stock.

### Changing the schema

```bash
# 1. Edit the relevant file in src/db/schema/
# 2. Generate SQL from the diff
pnpm db:generate
# 3. Review the generated file in src/db/migrations/ — always read it
# 4. Apply
pnpm db:migrate
```

Commit the generated SQL **and** the updated `meta/` journal together. Production applies migrations with `pnpm db:migrate` as a one-shot container before the new app container starts.

`pnpm db:push` skips migration files entirely and syncs the schema directly — convenient locally, but it leaves no artifact for production, so never use it as a substitute for `db:generate`.

### Maintenance scripts

In [src/db/scripts/](../src/db/scripts/): translation backfills and migration, a location-schema push, non-stockable item-store cleanup, a migration-journal repair, and `reset.ts`. Run them with ts-node and the tsconfig-paths loader, e.g.:

```bash
pnpm ts-node -r tsconfig-paths/register --project tsconfig.json src/db/scripts/<script>.ts
```

`pnpm db:reset` drops and recreates everything. It is destructive and has no confirmation prompt — never point it at production.

---

## Internationalisation

Two distinct layers:

- **Interface messages** — static catalogues in [src/i18n/](../src/i18n/) (`en/`, `ar/`), served by `nestjs-i18n`. `watch: true` reloads them in dev. The response interceptor and exception filter translate outgoing messages automatically, so services can return message keys rather than prose.
- **Content** — user-authored data (product names, descriptions) stored bilingually and machine-translated via Google Cloud Translate / Lara through `TranslationModule`.

---

## External services

| Service                | Used for                                        | Configured by             |
| ---------------------- | ----------------------------------------------- | ------------------------- |
| Cloudflare R2          | Image/file storage, served from `R2_PUBLIC_URL` | `R2_*`                    |
| Brevo                  | Transactional email (OTP, password reset)       | `BREVO_API_KEY`, `MAIL_*` |
| Firebase Admin         | FCM push to dashboard and mobile app            | `FIREBASE_*`              |
| Google Cloud Translate | Content translation                             | `GCP_*`                   |
| Lara                   | Content translation                             | `LARA_*`                  |
| Masarat, Tadawul       | Payment providers                               | `MASARAT_*`, `TADAWUL_*`  |
| GlitchTip              | Errors, logs, releases                          | `SENTRY_DSN`              |

Push notifications carry a per-recipient language (`language_enum` on the recipient), because a push's language belongs to whoever receives it, not to the request that triggered it — a bakery admin accepting an order sends a push to the customer.

---

## Deployment

Production runs on a **VPS under Docker Compose**, fronted by **Caddy**, and deploys automatically via GitHub Actions.

### Topology

```
Cloudflare
   │
   ▼
Caddy (host, :443, automatic TLS)
   ├── api.basty.ly        → 127.0.0.1:3000   (basti-backend container)
   ├── dashboard.basty.ly  → /var/www/dashboard  (static SPA)
   └── glitchtip.basty.ly  → GlitchTip
                              │
                    basti-backend ──► basti-postgres (:5432, localhost-only)
                                          volume: pgdata
```

Both containers publish only to `127.0.0.1`, so Postgres and the API are unreachable from the internet except through Caddy.

### Automated deploy

[.github/workflows/deploy-backend.yml](../.github/workflows/deploy-backend.yml) fires on push to `main` (ignoring `README.md`, `docs/**`, `.editorconfig`, `.prettierrc`) or by manual dispatch. Concurrency group `deploy-backend` with `cancel-in-progress: false`, so deploys queue rather than clobber each other.

Steps:

1. Load the SSH deploy key and trust the host key.
2. Render `.env` from GitHub Secrets, then **fail the build if any value rendered empty** (`grep -E '^[A-Z_]+=$'`) — this catches a missing or renamed secret before it reaches the server.
3. Upload `.env` over SSH (`cat >`, not scp) and `chmod 600` it.
4. On the server: `git reset --hard origin/main`, then
   - `docker compose build backend` — Postgres stays up;
   - `docker compose run --rm --no-deps -T --entrypoint '' backend pnpm db:migrate` — migrations run **before** the swap, so a failed migration aborts the deploy and the old container keeps serving;
   - `docker compose up -d --build --force-recreate`;
   - `sudo systemctl reload caddy`.
5. Health check `http://127.0.0.1:3000/api/health`, retrying 12× at 5s intervals (~60s; the app takes roughly 20s to boot). On failure it dumps the last 80 log lines and fails the job.
6. Register the release and deploy in GlitchTip.

Two flags in step 4 exist for non-obvious reasons and should not be dropped: `-T` plus `</dev/null` stop `compose run` from swallowing the rest of the SSH heredoc as stdin (which silently skipped the `up`/`ps`/`reload` lines), and `--force-recreate` guarantees the container is actually replaced when compose's image-digest detection fails to notice a rebuild.

### Required GitHub Secrets

`SSH_PRIVATE_KEY`, `SERVER_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `DOCS_USERNAME`, `DOCS_PASSWORD`, `BREVO_API_KEY`, `MAIL_FROM_NAME`, `MAIL_FROM`, `MAIL_REPLY_TO`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`, `LARA_ACCESS_KEY_ID`, `LARA_ACCESS_KEY_SECRET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `SENTRY_DSN`, `MASARAT_URL`, `MASARAT_USER_ID`, `MASARAT_PIN`, `MASARAT_PROVIDER_ID`, `TADAWUL_URL`, `TADAWUL_ID`, `TADAWUL_TOKEN`, `TADAWUL_WEBHOOK_URL`, `GLITCHTIP_AUTH_TOKEN`.

Note that `NODE_ENV`, `PORT`, `LOG_LEVEL`, `DB_HOST`, `DB_SSL`, token lifetimes, `BCRYPT_SALT_ROUNDS` (12), and `CORS_ORIGINS` (`https://dashboard.basty.ly`) are hardcoded in the workflow, not secrets — change them there.

### Manual deploy

```bash
ssh elmelegy@<SERVER_HOST>
cd ~/basti/backend-basti-service
git pull origin main
cd infra
docker compose --env-file ../.env build backend
docker compose --env-file ../.env run --rm --no-deps -T --entrypoint '' backend pnpm db:migrate </dev/null
docker compose --env-file ../.env up -d --force-recreate
docker compose --env-file ../.env ps
curl -fsS http://127.0.0.1:3000/api/health
```

`--env-file ../.env` is required so compose can substitute `${DB_USERNAME}` and friends into the Postgres service definition.

### Docker image

Three-stage build ([Dockerfile](../Dockerfile)): `deps` (pnpm install with a cache mount) → `builder` (`pnpm build`) → `runtime` (prod deps only, plus `drizzle-kit` so the migration step and manual `db:push --force` work). `tini` is the entrypoint for correct signal handling. The runtime stage copies `dist/`, `src/i18n`, `src/db/migrations`, `drizzle.config.ts`, and `tsconfig.json`.

### Alternative targets

`vercel.json` and `Procfile` exist for Vercel and Heroku-style deploys respectively. Note the entrypoint paths differ — `Procfile` runs `dist/src/main.js` (matching the Docker `CMD`), while `vercel.json` builds `dist/main.js`. The VPS + Docker path above is the one in active use.

---

## Observability

- **Errors and logs** → self-hosted GlitchTip at `https://glitchtip.basty.ly`. [src/instrument.ts](../src/instrument.ts) is imported first in `main.ts` — before any other module — because the SDK must patch the runtime before application code loads. Keep it first.
- **`SentryLogger`** ([src/sentry-logger.ts](../src/sentry-logger.ts)) writes to stdout _and_ forwards to GlitchTip. `bufferLogs: true` on `NestFactory.create` means no startup lines are lost while the custom logger is being installed.
- **Releases** are tagged `basti-backend@<git-sha>` and registered by CI, so stack traces map to a specific deploy.
- **Health** — `GET /api/health` (public) pings the database and reports uptime; used by the container healthcheck, the deploy gate, and uptime monitors. It returns **200 even when the database is unreachable** — inspect the `db` field to distinguish healthy from degraded. A green deploy therefore proves the process is up, not that Postgres is reachable.
- **Container logs** — `docker logs basti-backend --tail 100 -f`.

---

## Common tasks

**Add a feature module**

```bash
pnpm nest g module modules/<name>
```

Then create `controllers/`, `services/`, `dto/` inside it, register the module in [src/app.module.ts](../src/app.module.ts), and add a Swagger tag in `main.ts` if it should be grouped in the docs. Follow [NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md).

**Add an endpoint** — define a DTO with `class-validator` decorators (remember `forbidNonWhitelisted`: undeclared fields are rejected), add `@ApiOperation`/`@ApiResponse` for the docs, apply guards and `@AdminRoles` as needed, and return through the shared response handler in [src/utils/response.handler.ts](../src/utils/response.handler.ts).

**Add a translated message** — add the key to both [src/i18n/en/](../src/i18n/en/) and [src/i18n/ar/](../src/i18n/ar/), then return the key; the interceptor resolves it.

**Search endpoints** — always build `LIKE` patterns with `buildSearchPattern` from `@/utils`. It escapes `%`, `_`, and `\` and caps input length. Raw `` `%${term}%` `` interpolation is not acceptable.

**Rotate a secret** — update the GitHub Secret, then re-run the deploy workflow (`workflow_dispatch`) so a fresh `.env` is written to the server.

---

## Troubleshooting

**App won't boot, "Invalid environment variables"** — the Zod error dump lists every offending key; fix `.env` against [src/env.ts](../src/env.ts).

**CORS failures from the dashboard** — `CORS_ORIGINS` must contain the exact dashboard origin. An empty value falls back to `*`, which browsers reject for credentialed (cookie-bearing) requests.

**401s that never recover** — check that cookies are being set: the client needs `withCredentials`, and the origin must be allowed. `/admin-auth/refresh` and `/admin-auth/login` deliberately do not trigger the client's refresh retry.

**Rate limiting hitting everyone at once** — if `trust proxy` or the Caddy `X-Forwarded-For` headers are misconfigured, every request appears to come from the proxy IP and shares one 200/min bucket.

**Migration fails during deploy** — the workflow aborts before swapping containers, so the old version keeps serving. Fix the migration, push again. To inspect: `docker compose --env-file ../.env run --rm --no-deps -T --entrypoint '' backend pnpm db:migrate`.

**Deploy "succeeds" but old code is still running** — this is what `--force-recreate` prevents; confirm it is still present in the workflow.

**`/api/docs` returns 401** — expected when `DOCS_USERNAME`/`DOCS_PASSWORD` are set. Unset both to make docs public.

**Push notifications not arriving** — confirm `FIREBASE_PROJECT_ID` is `basty-notifications` (not the older `baasti` project) and that the client's service-worker Firebase SDK version matches the npm one.
