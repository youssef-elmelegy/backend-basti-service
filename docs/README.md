# Documentation — Basty Backend Service

This folder holds the long-form documentation for the backend service. The [root README](../README.md) is the short version: what the service is, how to get it running, and where everything lives. Come here when you need the detail behind that.

## What's in here

| File                                           | What it covers                                                                                                                                                            | Read it when                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)       | The complete guide — setup, every environment variable, request pipeline, auth and roles, migrations, i18n, external services, deployment, observability, troubleshooting | You're setting the project up, deploying it, changing infrastructure, or something is broken |
| [NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md) | House style for files, folders, constants, variables, functions, classes, controllers, types, interfaces, decorators, database objects, DTOs, and enums                   | You're writing new code — read it before, not after                                          |

## Where to start

**New to the project?** Read the [root README](../README.md) first for orientation, then the guide's [Getting started](DEVELOPER_GUIDE.md#getting-started) and [Project layout](DEVELOPER_GUIDE.md#project-layout) sections.

**Setting up locally?** [Getting started](DEVELOPER_GUIDE.md#getting-started) and [Environment variables](DEVELOPER_GUIDE.md#environment-variables). Note that `.env.example` is not exhaustive — the Zod schema in [src/env.ts](../src/env.ts) is authoritative, and the app prints every missing key on a failed boot.

**Deploying or touching infrastructure?** [Deployment](DEVELOPER_GUIDE.md#deployment) covers the GitHub Actions workflow, the Docker Compose topology, the Caddy setup, required secrets, and the manual deploy procedure.

**Writing a feature?** [NAMING_CONVENTIONS.md](NAMING_CONVENTIONS.md), then [How a request flows](DEVELOPER_GUIDE.md#how-a-request-flows) and [Common tasks](DEVELOPER_GUIDE.md#common-tasks).

**Something's broken?** [Troubleshooting](DEVELOPER_GUIDE.md#troubleshooting) covers the failures that actually happen here — boot-time env validation, CORS, auth refresh loops, rate limiting behind the proxy, failed migrations during deploy, and push notifications.

## Related documentation

- **API reference** — generated from the code, served at `/api/docs` (Scalar). Locally: `http://localhost:3000/api/docs`. In production: `https://api.basty.ly/api/docs`, behind HTTP Basic Auth.
- **Admin dashboard** — [test-dashboard/docs/](../../test-dashboard/docs/), the frontend that consumes this API.

## Keeping these current

These files describe real behavior — deployment steps, environment variables, cross-cutting conventions — so they go stale in ways that cost someone hours. Update them in the same change that alters the behavior:

- Adding or removing an environment variable → update the guide's env tables **and** `.env.example`. If it's needed in production, add it to the workflow's `.env` block and to the GitHub Secrets list in the guide.
- Changing the deploy pipeline, Docker setup, or Caddy config → update [Deployment](DEVELOPER_GUIDE.md#deployment).
- Adding a feature module → add it to the module list in the guide and to the table in the root README.
- Changing a guard, interceptor, or filter → update [How a request flows](DEVELOPER_GUIDE.md#how-a-request-flows).

Note that the deploy workflow ignores changes to `docs/**` and `README.md`, so documentation-only commits don't trigger a deployment.
