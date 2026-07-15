---
name: db-migrate-and-seed
description: Draft Prisma migrations (AI, create-only), have the user apply them, then seed and verify the database — locally and on AWS.
allowed-tools: Bash, Read, Glob, Grep, AskUserQuestion
---

# DB Migrate & Seed Skill

The recurring database lifecycle for this repo: **draft → user-apply → seed → verify**, with a hard human/AI boundary. Use it for every schema change (e.g. `init`, `add_stripe_connect`, `add_user_tokens`) and every fresh database (new dev machine, `test`/`prod` bring-up, re-seed).

## Triggers

`create a migration` · `draft a migration` · `apply migrations` · `seed the database` · `$db-migrate-and-seed` (`/db-migrate-and-seed`)

## Roles ([STRICT] — from root `AGENTS.md` Prisma rules; that document governs on conflict)

| Action | Who | Command |
|---|---|---|
| Draft a migration (create-only) | **AI** | `npm run migrate:create --prefix app -- --name <snake_case_name>` |
| Regenerate the Prisma client | AI or user | `npm run build-client --prefix app` |
| Apply locally | **User** | `npx prisma migrate dev` (from `app/`) |
| Apply on AWS (`test`/`prod`) | **User / CI** | `prisma migrate deploy` via the dedicated ECS RunTask — never on container boot (`docs/delivery-plan.md` → runbook) |
| Seed | User (local shell) / RunTask (AWS) | `npx prisma db seed` (from `app/`) |
| `migrate status` / other Prisma CLI | **User only** | AI must not run apply/reset/deploy/studio/validate/format |

Existing migration files are **immutable** — never edit one after creation. If an **unapplied, uncommitted** draft is wrong, delete the entire draft directory and re-draft; once applied or committed, correct forward with a new migration.

## Prerequisites

- A reachable Postgres at `DATABASE_URL` in `app/.env` (example: `postgresql://fad:fad@localhost:5432/fad_dev`). Quick local start:
  `docker run --name fad-pg -e POSTGRES_USER=fad -e POSTGRES_PASSWORD=fad -e POSTGRES_DB=fad_dev -p 5432:5432 -d postgres:16`
- **Drafting also needs the database** — `migrate dev --create-only` diffs via a shadow database on the same server, so the create-only step fails without a reachable Postgres and sufficient privileges to create the shadow DB.
- Workspace installed (`npm install`) and `common` built if the seed imports build on it.

## Workflow

### 1. Draft (AI-safe)

1. Confirm the schema edit in `app/prisma/schema.prisma` is complete and `npm run build-client --prefix app` + `npm run type-check` pass.
2. Run `npm run migrate:create --prefix app -- --name <name>`.
3. **Read the generated SQL** end-to-end before handing off: verify it contains exactly the intended DDL, nothing destructive you didn't plan, and extension statements where needed (see Gotchas).
4. For anything destructive (drop/rename/narrow), use the **expand/contract** pattern across multiple migrations (`docs/delivery-plan.md` → Quality gates) — never a breaking change in one step.

### 2. Apply (user-run)

- Local: `cd app && npx prisma migrate dev` — applies pending migrations and regenerates the client. Verify with `npx prisma migrate status`.
- AWS: trigger the migration ECS RunTask (`prisma migrate deploy`) **before** new tasks take traffic; see `cdk/README.md` once authored (task step 16) and `docs/delivery-plan.md`.

### 3. Seed

- `cd app && npx prisma db seed` (configured as `tsx prisma/seed.ts` in `app/package.json`).
- Seeds must be **idempotent** (upsert by unique keys — slug/handle/email); re-running must not duplicate rows.

### 4. Verify

- AI-safe checks: `npm run test` (integration tests against the migrated DB), hit `GET /v1/health/ready`, and spot-check via application endpoints (e.g. `GET /v1/athletes` returns the seeded roster).
- User checks: `npx prisma migrate status` (clean), row counts vs the seed's expected totals.

## Gotchas

- **`citext`:** the schema uses `@db.Citext` (`User.email`); a vanilla Postgres lacks the extension and the first apply fails. Durable fix (works on fresh local DBs **and** fresh RDS databases): enable the `postgresqlExtensions` preview feature and declare `extensions = [citext]` in the datasource **before drafting**, so the migration itself emits `CREATE EXTENSION IF NOT EXISTS "citext"`. Avoid relying on a manual one-off `CREATE EXTENSION` per database.
- **Stale generated client:** after any schema change or fresh checkout, run `npm run build-client --prefix app` or type-checks fail with enum/model mismatches.
- **Shadow-database failures** during drafting usually mean missing DB privileges or an unreachable `DATABASE_URL` — fix the environment; do not hand-write migration SQL.
- One migration per PR; migration name describes the change (`snake_case`).

## Cross-references

- Root `AGENTS.md` → *[STRICT] Prisma CLI Usage* (authoritative rules).
- `docs/delivery-plan.md` → migration discipline, runbook, rollback (expand/contract; RDS PITR as disaster path).
- `docs/backend-build-sheet.md` → which migrations each phase introduces.
