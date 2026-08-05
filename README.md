# Basty — Backend Service

The API behind Basty, a cake and sweets ordering platform. It serves the customer mobile app, the admin/bakery dashboard, and the driver flows from a single NestJS application.

Built with **NestJS 11**, **Drizzle ORM** on **PostgreSQL**, and **TypeScript**. Every response is bilingual (English / Arabic) and driven by the request's `Accept-Language`.

---

## Table of contents

- [What this service does](#what-this-service-does)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Project structure](#project-structure)
- [API documentation](#api-documentation)
- [Authentication & roles](#authentication--roles)
- [Internationalization](#internationalization)
- [Database & migrations](#database--migrations)
- [Deployment](#deployment)
- [Conventions](#conventions)

---

## What this service does

The domain is split into feature modules under `src/modules`:

| Area            | Modules                                                          |
| --------------- | ---------------------------------------------------------------- |
| Identity        | `auth` (customers), `admin-auth` (staff), `driver`               |
| Catalog         | `featured-cake`, `sweet`, `addon`, `items`, `tags`               |
| Cake customizer | `custom-cakes` (shapes, flavors, decorations, predesigned cakes) |
| Ordering        | `cart`, `order`, `payment`, `payment-method`, `coupon`, `offer`  |
| Operations      | `bakery`, `chef`, `region`, `location`                           |
| Engagement      | `notification` (FCM push), `review`, `slider-image`              |
| Platform        | `config`, `upload` (Cloudflare R2), `health`                     |

Cross-cutting behavior lives in `src/common`: guards, decorators, interceptors, exception filters, mail templates, and the translation service.

## Tech stack

- **Runtime** — Node.js 22.x, pnpm 10.33
- **Framework** — NestJS 11 on Express 5
- **Database** — PostgreSQL via Drizzle ORM + drizzle-kit
- **Auth** — Passport JWT (access + refresh tokens), bcrypt, httpOnly cookies
- **Validation** — `class-validator` / `class-transformer` for DTOs, Zod for environment parsing
- **Docs** — OpenAPI via `@nestjs/swagger`, rendered with Scalar
- **i18n** — `nestjs-i18n`, plus Google Cloud Translate and Lara for content translation
- **Notifications** — Firebase Admin (FCM)
- **Email** — Brevo HTTP API
- **Storage** — Cloudflare R2 (S3-compatible)
- **Monitoring** — Sentry / GlitchTip, wired through a custom `SentryLogger`

## Getting started

**Prerequisites:** Node.js 22.x, pnpm 10.33+, and a PostgreSQL instance (local, Docker, or Neon).

```bash
pnpm install
cp .env.example .env    # then fill in the real values
pnpm db:migrate         # apply schema migrations
pnpm seed               # optional: seed reference data
pnpm start:dev
```

The API listens on `http://localhost:3000/api` and the docs on `http://localhost:3000/api/docs`.

Environment variables are validated by Zod at boot (`src/env.ts`). A missing or malformed value fails startup with an explicit error instead of surfacing later as a runtime bug.

## Environment variables

`.env.example` is the authoritative list. The groups:

| Group       | Keys                                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime     | `NODE_ENV`, `PORT`, `LOG_LEVEL`                                                                                                                               |
| Database    | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SSL`                                                                                   |
| JWT         | `JWT_ACCESS_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, `JWT_SETUP_PROFILE_EXPIRES_IN`, `JWT_RESET_PASSWORD_EXPIRES_IN` |
| Security    | `BCRYPT_SALT_ROUNDS`, `CORS_ORIGINS`, `DOCS_USERNAME`, `DOCS_PASSWORD`                                                                                        |
| Email       | `BREVO_API_KEY`, `MAIL_FROM`, `MAIL_FROM_NAME`, `MAIL_REPLY_TO`                                                                                               |
| Push        | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`                                                                                        |
| Storage     | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`                                                                |
| Translation | `GCP_PROJECT_ID`, `GCP_CLIENT_EMAIL`, `GCP_PRIVATE_KEY`, `LARA_ACCESS_KEY_ID`, `LARA_ACCESS_KEY_SECRET`                                                       |
| Payments    | `MASARAT_URL`, `MASARAT_USER_ID`, `MASARAT_PIN`, `MASARAT_PROVIDER_ID`, `TADAWUL_URL`, `TADAWUL_ID`, `TADAWUL_TOKEN`, `TADAWUL_WEBHOOK_URL`                   |
| Monitoring  | `SENTRY_DSN`                                                                                                                                                  |

`DATABASE_URL` is derived from the `DB_*` parts at boot — you don't set it yourself.

`DOCS_USERNAME` and `DOCS_PASSWORD` are optional; setting **both** puts `/api/docs` behind HTTP Basic Auth. Always set them in production.

## Available scripts

**Development**

| Command            | Description                            |
| ------------------ | -------------------------------------- |
| `pnpm start:dev`   | Watch mode                             |
| `pnpm start:debug` | Watch mode with the inspector attached |
| `pnpm build`       | Compile to `dist/`                     |
| `pnpm start:prod`  | Run the compiled build                 |

**Quality**

| Command                                 | Description                      |
| --------------------------------------- | -------------------------------- |
| `pnpm lint`                             | ESLint with `--fix`              |
| `pnpm format`                           | Prettier over `src/` and `test/` |
| `pnpm type-check`                       | `tsc --noEmit`                   |
| `pnpm test` / `test:watch` / `test:cov` | Jest unit tests                  |
| `pnpm test:e2e`                         | End-to-end tests                 |

Husky + lint-staged run ESLint and Prettier on staged files at commit time.

**Database**

| Command            | Description                                 |
| ------------------ | ------------------------------------------- |
| `pnpm db:generate` | Generate a migration from schema changes    |
| `pnpm db:migrate`  | Apply pending migrations                    |
| `pnpm db:push`     | Push the schema directly (development only) |
| `pnpm db:studio`   | Open Drizzle Studio                         |
| `pnpm db:reset`    | Drop and rebuild — **destructive**          |
| `pnpm seed`        | Seed reference data                         |

## Project structure

```
src/
├── common/           # Guards, decorators, interceptors, filters, mail, translation
├── constants/        # Shared constant values
├── db/
│   ├── schema/       # Drizzle table definitions (one file per entity)
│   ├── migrations/   # Generated SQL migrations
│   ├── scripts/      # Reset, schema push, translation migration
│   └── seeds/        # Seed data
├── i18n/             # en/ and ar/ translation catalogs
├── modules/          # Feature modules (controllers, services, DTOs)
├── types/            # Shared TypeScript types
├── utils/            # Shared helpers
├── env.ts            # Zod-validated environment
├── instrument.ts     # Sentry init — must be imported first
└── main.ts           # Bootstrap
```

Each feature module follows the same shape: `*.module.ts`, `*.controller.ts`, `*.service.ts`, and a `dto/` folder.

## API documentation

Every route is prefixed with `/api`. Interactive docs are served at `/api/docs` (Scalar, backed by the generated OpenAPI document) and include:

- Bearer auth, so you can paste an access token and call endpoints directly
- A global optional `Accept-Language` header (`en` | `ar`)
- Tag groupings that mirror the modules

## Authentication & roles

Two separate identities, each with its own JWT strategy:

- **Customers** — `auth` module
- **Staff** — `admin-auth` module, email and password

Access tokens are short-lived and refresh tokens are delivered as httpOnly cookies; the client silently refreshes on a 401.

Admin roles are `super_admin`, `admin`, `manager`, and `driver`. Route access is enforced by the guards in `src/common/guards`:

| Guard               | Purpose                                                              |
| ------------------- | -------------------------------------------------------------------- |
| `JwtAuthGuard`      | Requires a valid customer token                                      |
| `JwtWithAdminGuard` | Requires a valid admin token                                         |
| `FlexibleJwtGuard`  | Accepts either identity                                              |
| `AdminRolesGuard`   | Restricts to specific admin roles, via the `@AdminRoles()` decorator |
| `RefreshTokenGuard` | Guards the refresh endpoint                                          |

Mark a route as unauthenticated with `@Public()`. `AdminExtractionMiddleware` runs globally and attaches the admin context to the request when an admin token is present.

Rate limiting is global via `@nestjs/throttler` — 200 requests per minute per IP. `trust proxy` is enabled so the limiter sees the real client IP behind Caddy/Cloudflare rather than the proxy's.

## Internationalization

All user-facing content is bilingual. Language resolution order: `?lang=` query → `Accept-Language` header → `x-custom-lang` header → `en` fallback.

Translation is applied globally rather than per-handler:

- `I18nResponseInterceptor` translates success responses
- `I18nExceptionFilter` translates error responses

Catalogs live in `src/i18n`. Content stored in the database (product names, descriptions) is translated through the `TranslationModule`, backed by Google Cloud Translate and Lara.

## Database & migrations

Schema is defined in code under `src/db/schema` — one file per entity, with enums centralized in `enums.ts`.

The normal change flow:

```bash
# 1. edit the relevant file in src/db/schema/
pnpm db:generate    # 2. produce the SQL migration
pnpm db:migrate     # 3. apply it
```

Use `db:push` only for fast local iteration. Anything reaching production goes through a generated migration so the change is reviewable and replayable.

## Deployment

Two supported targets:

**Docker (primary).** A multi-stage `Dockerfile` builds a slim production image running as `node dist/src/main` under tini. `infra/docker-compose.yml` brings up Postgres alongside the backend, with Caddy config in `infra/caddy` for TLS and reverse proxying. `infra/server-setup.sh` provisions a fresh host.

Migrations run **before** the app starts, as a one-shot container:

```bash
docker compose run --rm backend pnpm db:migrate
```

**GitHub Actions.** `.github/workflows/deploy-backend.yml` deploys on push to `main` — it writes the production `.env` from repository secrets, ships it over SSH, and restarts the stack. Doc-only changes are ignored.

A `vercel.json` and `Procfile` are also present for alternative hosting.

## Conventions

See [docs/NAMING_CONVENTIONS.md](docs/NAMING_CONVENTIONS.md) for the full guide covering files, constants, variables, functions, classes, controllers, types, interfaces, decorators, database objects, DTOs, and enums.

Two rules worth calling out:

- **Search inputs** must go through `buildSearchPattern` from `@/utils`, which escapes `%`, `_`, and `\` and caps input length. Never interpolate a raw `%${term}%` into a `LIKE`.
- **Sentry must initialize first.** `src/instrument.ts` is imported at the top of `main.ts` before anything else loads — keep it there.
