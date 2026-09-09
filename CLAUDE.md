# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

NestJS 11 + TypeORM 0.3 + PostgreSQL 17 API backing the NEXUS HQ Angular frontend. Single-organization backend (no multi-tenancy). README.md is in Spanish and is the source of truth for setup/behavior details; this file focuses on what's needed to work in the code.

## Commands

- `npm run start:dev` — run with ts-node (restart manually after changes; there's no watch mode).
- `npm run build` — compile `src` to `dist` via `tsc`.
- `npm start` — run the compiled `dist/main.js`.
- `npm run db:migrate` — run the TypeORM migration (transactional) against `DATABASE_URL`.
- `npm run db:seed` — idempotent seed (org, admin, teams, players, areas, events, tasks); safe to re-run, never overwrites existing rows.
- `npm test` — **runs `npm run build` first**, then `node --test test/api.test.cjs`. The test file requires compiled output from `dist/`, not `src/` — always rebuild before trusting test results after a source change. There's no per-test filter script; use Node's built-in test name filtering if needed (e.g. `node --test --test-name-pattern="roster" test/api.test.cjs`, after building).
- `docker compose up -d --wait db` / `docker compose stop` — local PostgreSQL via Compose (dev-only credentials).

Requires a `.env` (copy from `.env.example`): `DATABASE_URL`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SESSION_HOURS`, `CORS_ORIGIN`.

## Architecture

**Feature-per-page module.** Each Angular page has a matching `src/feature/<name>/` with a `.controller.ts`, `.service.ts`, `.module.ts` triad: `auth`, `dashboard`, `teams`, `calendar`, `tasks`, `organization`. Services talk to the DB directly via injected TypeORM `DataSource` (repositories / `QueryBuilder` / transactions) — there is no repository abstraction layer or ORM-agnostic interface. No stored procedures; all logic lives in service methods.

**Areas vs. teams.** `teams` and `areas` are different tables. An area represents either a team or an internal (non-team) area. `events` and `tasks` store `area_id` with an FK into `areas`, but the API request/response DTOs use `team` (a name string) to match the shape Angular expects. `src/common/areas.service.ts` (`AreasService.resolve(name)`) is the single place that maps a team/area name to its `area_id` — calendar and tasks services both depend on it rather than duplicating the lookup.

**Auth is custom, not Passport/JWT.** `src/common/auth.guard.ts` is a global `APP_GUARD`: it parses `Authorization: Bearer <64-hex-char token>`, looks up a `Session` row by `tokenHash(token)` (SHA-256, in `src/common/password.ts`) with `expiresAt > now`, then loads the `User` and attaches `req.user` / `req.sessionId`. Passwords are hashed with scrypt + random salt (also in `password.ts`), never returned by the API. Routes are protected by default; use `@Public()` (exported from `auth.guard.ts`) to opt out, as `auth.controller.ts` does for `/auth/login`. The guard also enforces role authorization inline: non-GET/HEAD/OPTIONS requests require `role === "manager"` (viewers are read-only), except `POST /auth/logout`, which is always allowed to end your own session.

**Global request pipeline** is assembled in `src/setup.ts` (called from `main.ts` and reused by the test bootstrap): `api` global prefix, `helmet()`, CORS restricted to `CORS_ORIGIN`, a global `ValidationPipe({ whitelist, forbidNonWhitelisted, transform })`, and `DbErrorFilter` (`src/common/db-error.filter.ts`) which maps Postgres error codes to HTTP status (`23505` → 409 conflict, `23503`/`23514`/`22007`/`22008` → 400, else 500) instead of leaking raw DB errors. `AppModule` (`src/app.module.ts`) also wires a global `ThrottlerGuard` (120 req/min/IP default; login endpoint overrides to 5/min via `@Throttle`).

**DTO/validation conventions** (`src/common/dtos.ts`): string fields that come from user input are typically both `@Transform`-trimmed and validated; dates use `@Matches(/^\d{4}-\d{2}-\d{2}$/)` + `@IsDateString({ strict: true })`; times use a `HH:mm` regex. Follow this pattern for new DTOs rather than relying on `@IsDateString` alone.

**Database layer** (`src/database/`): `entities.ts` defines all TypeORM entities and exports the `entities` array; `data-source.ts` builds `databaseOptions`/`AppDataSource` with `synchronize: false` (migrations are the only schema-change path — don't enable synchronize); `migrations/initial.ts` is the one migration; `seed-data.ts` contains the idempotent seed logic shared by `seed.ts` (CLI, via `AppDataSource`) and the test bootstrap (via an in-memory `pg-mem` DataSource). `database/001-schema.sql` is a manual-install reference for the same schema — never run it and then also run the migration against the same database.

**Roster replacement** (`teams.service.ts`): replacing a team's roster deletes all `Player` rows for that team and re-inserts with fresh UUIDs inside a transaction with a pessimistic write lock on the `Team` row, to avoid partial writes under concurrent edits. There are no external references to player IDs, so regenerating them is safe.

## Testing

`test/api.test.cjs` is a single Node `--test` file (CommonJS, requires from `dist/`) that boots the full `AppModule` with `pg-mem` standing in for PostgreSQL (via `DataSource` override in a `Test.createTestingModule`), runs the real migration and seed against it, and drives the app with `supertest`. When adding endpoints or changing behavior, extend this file rather than introducing a second test setup. Because pg-mem emulates Postgres, it does not validate real concurrency behavior (e.g. the pessimistic locking in roster replacement) — the README notes this explicitly.

## Angular integration

Response shapes intentionally keep frontend-facing field names (`team`, `who`, `win`, `players`, `date`, `time`) even where the internal schema differs (e.g. `area_id` vs. `team`). See `docs/API.md` for the full endpoint contract and `docs/requests.http` for example requests.
