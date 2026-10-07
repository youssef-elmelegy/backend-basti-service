# Repository Guidelines

## Project Structure & Module Organization

This is a NestJS 11 backend service for the Basti platform. Source code lives in `src/`. Feature areas are organized under `src/modules/` and generally expose a `*.module.ts` with related controllers, services, DTOs, decorators, or interfaces. Shared framework code belongs in `src/common/`.

Database code is under `src/db/`: Drizzle schemas in `src/db/schema/`, generated migrations in `src/db/migrations/`, maintenance scripts in `src/db/scripts/`, and seed data in `src/db/seeds/`. Translation catalogs live in `src/i18n/en/` and `src/i18n/ar/`. End-to-end tests live in `test/`; unit specs belong beside source files as `*.spec.ts`.

## Build, Test, and Development Commands

- `pnpm install` installs dependencies using the pinned pnpm version.
- `pnpm start:dev` runs the API in watch mode at the `/api` prefix.
- `pnpm build` compiles TypeScript to `dist/`.
- `pnpm start:prod` runs the compiled app with `node dist/main`.
- `pnpm lint` runs ESLint with fixes.
- `pnpm format` applies Prettier to `src/**/*.ts` and `test/**/*.ts`.
- `pnpm type-check` runs `tsc --noEmit`.
- `pnpm test`, `pnpm test:cov`, and `pnpm test:e2e` run Jest unit, coverage, and e2e suites.
- `pnpm db:generate`, `pnpm db:migrate`, and `pnpm db:studio` manage Drizzle migrations and inspection.

## Coding Style & Naming Conventions

Use TypeScript with NestJS dependency injection and decorators. Follow the existing file naming style: `auth.controller.ts`, `auth.service.ts`, `signup.dto.ts`, `jwt-auth.guard.ts`, and `response.types.ts`. Use `PascalCase` for classes, `camelCase` for variables and functions, and `UPPER_SNAKE_CASE` for exported constants. Prefer explicit return types. ESLint, Prettier, Husky, and lint-staged enforce formatting.

## Testing Guidelines

Jest is configured for unit tests under `src/` with the `*.spec.ts` suffix. E2E tests use `test/jest-e2e.json` and live in `test/` as `*.e2e-spec.ts`. Add focused tests for service logic, guards, request flows, and database behavior when changing observable API behavior. Run `pnpm type-check` plus the relevant Jest command before handing off.

## Commit & Pull Request Guidelines

Recent history uses short conventional-style prefixes such as `fix:` and `migration:`. Keep commits focused, imperative, and specific, for example `fix: include printing type in order response`. PRs should describe the behavioral change, mention database migrations or env changes, link related issues when available, and include validation commands run.

## Security & Configuration Tips

Environment values are validated in `src/env.ts`; never commit secrets. Use placeholder local values only when they satisfy validation. Treat `pnpm db:reset` and direct schema pushes as destructive development actions.
