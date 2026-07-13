# Backend Foundation, Nate Contract Alignment & AWS Test-Deployment Readiness - Steps 11-15

## Step 11 - Community feed endpoint (derived, follows-aware)

### Metadata
**Status:** Complete
**Prereqs:** 7, 9
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13

### Completion Notes
- **New `app/src/api/community/` feature folder** (`CommunityRouterFactory` basePath `/v1/community` → `GET /feed` with `auth.optional`, thin `CommunityController` that parses `communityFeedQuerySchema` + forwards `req.authenticatedUserId`, and `CommunityFeedService` holding all derivation). Registered with one appended line in `app/src/app.ts`. Consumes contracts from `fad-common` only (`communityFeedQuerySchema`, `CommunityFeedItem`, `CommunityFeedResponse`, `FeedCategory`) — no redefinition.
- **Derived, never stored** (mirrors `client/lib/communityFeed.ts`): per published athlete the service emits milestone (first accomplishment, `category=milestone`/`kind=result`, headline `Hit a milestone — …`), race (latest race result by `sortOrder`, `race`/`result`, `Raced …`), roadmap (next `AthleteEvent` by `eventStartDate asc`, `race`/`roadmap`, `Is racing …`), and training (the `presentation.training` snapshot, `training`/`roadmap`, `Logged a training run — …`). Derivation lives in pure, exported, unit-tested mapping functions (`buildOrderedFeedItems`, `sortFeedItems`); the controller stays thin.
- **Repository:** added one lightweight `AthleteRepository.listPublishedFeedSources({ primarySport?, athleteIds? })` (published-only; each of raceResults/accomplishments/events capped at `take: 1` since the feed surfaces one card per category per athlete — lean, no rich include). Existing `AthleteRepository` methods untouched; `followedOnly` reuses `FollowRepository.listForUser`.
- **feedItemId decision:** used `<athleteSlug>-<category>-<sourceId>` per this step's explicit guidance + Context §9 (the `feed.ts` schema *comment* still says `<kind>`; the field itself is a plain `z.string()`, so both forms validate — chose category as it is the stable, more specific discriminator; the roadmap card's source id is the event row id, training's is the literal `training`). No contract or seed changes.
- **photoUrl decision (as flagged):** the contract field is `z.string().url().nullable()`, but seeded `photoRefs` are **bare Unsplash asset IDs** (e.g. `1594882645126-14020914d58d`), not URLs. Since the schema demands `.url()`, the mapper emits the ref only when it already parses as an absolute http(s) URL and otherwise emits `null`; against the current seed that means feed `photoUrl` is uniformly `null` (verified). Contract and seed left unchanged, consistent with the logged step-12 ref-vs-url decision — resolving refs→URLs is a later concern.
- **isVerified** derives strictly from the source carrying a non-empty `resultUrl`: seeded race results (from `previousRaces[0].links[0].href`) are verified; seeded accomplishments have no `resultUrl` so milestones are unverified; roadmap/training are always unverified. (This intentionally follows the derive-from-source contract rather than the client mock's hardcoded `verified: true` on milestones/races.)
- **Determinism:** ordered by an occurred-at key (race → parsed `displayDate`; roadmap → `eventStartDate`; milestone → `occurredOn ?? createdAt`; training → sentinel 0 so it trails) desc, then `feedItemId` asc — same DB input yields byte-identical ordering (asserted by a two-call determinism test). Cursor is treated as a simple base64url offset window over that ordering; garbage/out-of-range decodes to offset 0 / empty page (never throws), per Context §11.
- **Tests** (`app/src/api/community/community.test.ts`): pure mapper unit tests (per-category derivation, isVerified-from-resultUrl, photoUrl pass-through vs bare-ref null, category skipping, ordering + stability) run always; an auth-gate test asserts `followedOnly=true` while anonymous → 401; `RUN_DB_TESTS`-gated integration tests hit the seeded roster (derivation subset assertions for `felix-tremblay`, category filter, `sport=ROAD_CYCLING` filter incl. `naomi-osei`, follows-aware path restricted to the followed athlete, empty feed for a follower with no follows, two-call determinism). Fixtures use unique `step11-<epoch>-…` emails with `afterAll` cleanup; no global-count assertions.
- `$backend-review` (`/backend-review`, uncommitted + community focus) — no violations: feature-folder layout, thin controller, Prisma confined to the repository, typed `UnauthorizedError`, `fad-common` types, small guard-claused mappers, allowed why/intent comments only.
- `$ci` (`/ci`) green (exit 0): common build, type-check across common/app/client, lint:fix "No ESLint warnings or errors", full build, tests. `RUN_DB_TESTS=1 npx vitest run` from `app/` → **6 files, 58 tests passed** (prior 45 + 13 new). No lockfile/`package.json` drift.

### Context

**Objective:** Replace `client/lib/communityFeed.ts`'s mock builder with a real, derived feed.
**Done When:**
- `GET /v1/community/feed` (public, `auth.optional`) returns `communityFeedItemSchema` items derived from published athletes' race results (kind `result`), roadmap events (kind `roadmap`), and `presentation.training` snapshots — never stored rows.
- Query filters: `sport`, `category` (`race | training | milestone`), `followedOnly` (authenticated callers only; 401 if set while anonymous).
- Ordering is deterministic (source date desc, then id) so SSR/client render identically; `isVerified` derives from the source's `resultUrl`.
- Tests: derivation correctness against the seed roster, filters, follows-aware path, anonymous vs authed.

**References:**
- Context §9 (feed item example shape), §7; `docs/backend-build-sheet.md` → Phase 1 *Nate alignment additions*; `client/lib/communityFeed.ts` (semantic source: milestone = first highlight, race = latest result + next roadmap, training = presentation snapshot).

### Plan
- New `app/src/api/community/` feature folder: `CommunityRouterFactory` (`/v1/community`), controller, `CommunityFeedService`.
- Service composes from `AthleteRepository` (published athletes + results/events/highlights) and `FollowRepository` (when `followedOnly`); pure mapping functions for each feed category to keep derivation unit-testable.
- Feed item ids: `<athleteSlug>-<category>-<sourceId>` (stable, matches Context §9).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 12 - Client API layer + flagged data-source swap

### Metadata
**Status:** Incomplete
**Prereqs:** 5, 7, 9, 10, 11
**Size:** medium
**Owner:** unassigned

### Context

**Objective:** Give the client its first real API integration without breaking mock mode (the GH Pages deploy keeps working).
**Done When:**
- `client/lib/api.ts` exists: typed fetch wrapper over `NEXT_PUBLIC_API_BASE_URL`, request/response types imported from `fad-common`, standard error-envelope handling.
- `NEXT_PUBLIC_DATA_SOURCE=mock|api` (default `mock`) switches the directory, athlete profile, and community pages between mock modules and client-side API fetches; `client/.env.example` documents both vars.
- With a locally running API + seeded DB and `NEXT_PUBLIC_DATA_SOURCE=api`, the three surfaces render the same roster as mock mode.
- Mock mode (`npm run build` with defaults) produces byte-identical behavior to today.

**References:**
- Context §1 (success criteria), §10 (client impact); `client/AGENTS.md` ([STRICT] import types from `fad-common`; server components by default — the flagged fetch surfaces become client components only where interactivity already demanded it).
- Files: `client/app/(marketing)/athletes/*`, `client/app/(marketing)/community/*`, `client/lib/{mockAthletes,athleteProfiles,communityFeed}.ts`.

### Plan
- Author `api.ts` with per-endpoint helpers (`fetchAthleteDirectory`, `fetchAthleteProfile`, `fetchCommunityFeed`) returning `fad-common` types.
- Introduce a thin data-source module that re-exports either mock-derived or API-backed loaders based on the flag, so page components import one interface.
- Keep static params generation on mock data when exporting (documented limitation until SSR — Context §2 out-of-scope edge cases).

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 13 - CDK skeleton + NetworkStack

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13

### Completion Notes
- Authored the `cdk/` package (hand-rolled, no `cdk init` bloat): `package.json` (`aws-cdk-lib ^2.261.0`, `constructs ^10.6.0`; devDeps `aws-cdk` CLI, `typescript`, reused `tsx` as the `cdk.json` app runner per dependency-reuse), `tsconfig.json` (repo style, strict, `noEmit`), `cdk.json` (`"app": "npx tsx bin/fad.ts"` + modern context feature flags), `bin/fad.ts` (reads `-c env=test|prod` default `test`, resolves `config/`, instantiates `NetworkStack`; region-only env → account-agnostic, no `fromLookup`), `config/{types,test,prod,index}.ts` (typed `EnvironmentConfig`: `multiAz`, `instanceSize`, `natStrategy`, `natGatewayCount`, `desiredCount`, `useSpot`, `priceClass`, `domain`, `envName` — test=lean, prod=HA per `docs/infrastructure-and-scaling.md` cost/HA table), `lib/network-stack.ts` (2-AZ VPC, public+private subnets, NAT per `natStrategy` — test `NatProvider.instanceV2` t4g.nano / prod 2× gateway, free S3 gateway endpoint, least-privilege SG chain ALB:443/80 → service:8080 → database:5432, stack tags `project=arc`/`env=<envName>`), and `AGENTS.md` (+ generated `CLAUDE.md`/`GEMINI.md` mirrors). Package-local: intentionally NOT wired into root `package.json` scripts/postinstall (documented in `cdk/AGENTS.md`).
- Synth verified with NO AWS credentials for both envs: `npx cdk synth -c env=test` and `-c env=prod` succeed. Test template = 1 NAT instance (t4g.nano, AMI via public SSM param — no account lookup) + S3 gateway endpoint + 3 SGs (correct 8080/5432 ingress chain) + 2 public/2 private subnets + `project=arc`/`env=test` tags. Prod template = 2 NAT gateways + 2 EIPs (HA) + S3 gateway endpoint + same SG chain/subnets + `env=prod` tags. Sole synth output is an upstream cosmetic `InstanceProps#keyName` deprecation WARNING from CDK's internal `NatInstanceProviderV2` (aws/aws-cdk#30806) — not fixable from our code, does not affect the template or synth.
- **Sync-fix (worktree-safe agents sync):** root-caused the mis-stamp — when `scripts/sync-agents-instructions.js` (via `scripts/agents-md-header.js`) ran from the MAIN checkout, `collectAgentsFiles` traversed into `.claude/worktrees/agent-*/` and stamped those committed `AGENTS.md` files with `.claude/worktrees/...` chain paths (and rewrote sibling worktrees). Fix: new shared `scripts/repo-paths.js` — `getRepoRoot()` resolves the repo root robustly via `git rev-parse --show-toplevel` (fallback to path logic), and `collectAgentsFiles()` prunes any nested git checkout (a subdir with its own `.git`), so traversal never crosses a worktree boundary. Both entry scripts now import the shared helper (removes duplicated traversal). **Verified inside this worktree:** `npm run script:agents:sync` reports 0/4 existing AGENTS.md updated (only the new `cdk/AGENTS.md` stamped, with the correct `` `cdk/AGENTS.md` _(this file)_ > `AGENTS.md` _(root)_ `` chain); `git status` shows NO changes to any existing AGENTS.md/CLAUDE.md/GEMINI.md; sibling worktrees confirmed untouched; a simulated main-checkout run now finds only the 4 canonical files (was 16).
- `$infra-review` (`/infra-review`) executed: least-privilege SGs, private-subnet compute/DB, `restrictDefaultSecurityGroup` flag, Graviton NAT + free S3 endpoint + `PriceClass_100` cost levers all validated; `NatProvider.instanceV2` confirmed as the current (non-deprecated) NAT-instance construct; account-agnostic region-only synth confirmed as the supported credential-free pattern. No critical issues.
- `npm run ci` green (type-check + lint:fix + build + test: 2 passed / 1 skipped DB probe). cdk is not wired into root CI; the sync-fix caused no breakage (root `build` runs the sync twice with zero AGENTS.md drift).

### Context

**Objective:** Create the `cdk/` package (reserved but nonexistent today) and its first stack.
**Done When:**
- `cdk/` contains `package.json` (CDK v2, TypeScript), `cdk.json`, `tsconfig.json`, `bin/fad.ts`, `config/{test,prod}.ts` exposing the planned parameters (`multiAz`, `instanceSize`, `natStrategy`, `desiredCount`, `useSpot`, `priceClass`, domain names), and `AGENTS.md` (package conventions; sync script mirrors it).
- `lib/network-stack.ts`: VPC (2 AZ), public/private subnets, `natStrategy: 'gateway' | 'instance'`, shared security groups, free S3 gateway endpoint.
- `npx cdk synth -c env=test` succeeds locally with no AWS credentials (no lookups/context requiring an account).
- `scripts/sync-agents-instructions.js` is **worktree-safe**: when run inside a nested git worktree (e.g. `.claude/worktrees/agent-*/`), it must resolve the repo root via `git rev-parse --show-toplevel` (or equivalent) instead of treating the worktree as a subdirectory — observed 2026-07-13 mis-stamping `AGENTS.md` precedence headers with `.claude/worktrees/...` chain paths during parallel step execution.

**References:**
- Context §10 (cdk impact); `docs/aws-architecture-and-orchestration.md` (stack graph + justifications); `docs/infrastructure-and-scaling.md` (CDK cost/HA parameters table — source of the config values); `docs/backend-build-sheet.md` → *Infra & Deploy track* (file list).
- Root `AGENTS.md`: run `npm run script:sync:all` so `CLAUDE.md`/`GEMINI.md` mirrors are generated for the new `cdk/AGENTS.md`.

### Plan
- Scaffold the package (no `cdk init` boilerplate bloat — hand-rolled minimal files matching repo lint/tsconfig style); wire root `type-check` to include `cdk` only if trivial, else keep package-local scripts and note it.
- Implement `NetworkStack` with the parameter object from `config/`; tag all resources (`project=arc`, `env=<env>`).
- Set `test` config to the lean profile and `prod` to the HA profile from the parameters table.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$infra-review` (`/infra-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 14 - DataStack + ApiStack + Dockerfile + migration/seed tasks

### Metadata
**Status:** Complete
**Prereqs:** 2, 13
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13

### Completion Notes
- **`app/Dockerfile`** (multi-stage, arm64, repo-root build context — `fad-common` is `file:../common`): stage 1 (`node:22.22.2-bookworm-slim`, Debian not Alpine because argon2 is a native glibc addon) installs+builds `common` (tsc) then `app` (`prisma generate` + `tsc`); runtime stage carries only production deps, the generated Prisma client (with the arm64 query engine), `dist/`, `prisma/` (schema + migrations for the RunTasks), a non-root `arc` user (uid 1001, with a writable `$HOME` for Prisma/npx caches), and `CMD ["node", "dist/index.js"]`. Build command documented in the Dockerfile header (survives comment rules as a required build-instruction header): `docker build -f app/Dockerfile -t arc-api .` from repo root. Added a repo-root `.dockerignore` (excludes node_modules/dist/.git/cdk/docs/.ai/client, re-includes only `client/lib/{mockAthletes,athleteProfiles}.ts`).
- **Seed-image decision:** `prisma db seed` runs `tsx prisma/seed.ts`, which imports the two pure-data client modules via `../../client/lib/{mockAthletes,athleteProfiles}.ts` (both verified to have zero imports). Chose to (a) copy those two files into the runtime image at `/repo/client/lib/` so the seed's relative import resolves unchanged, and (b) copy `tsx` + `esbuild` + `@esbuild/linux-arm64` and the `prisma` CLI + `@prisma/engines` from the builder stage (exact locked versions) with recreated `.bin` shims — the migrate/seed RunTasks (`npx prisma migrate deploy` / `npx prisma db seed`) need the Prisma CLI and the spawned `tsx`, both excluded by `--omit=dev`. Also install `common`'s prod deps (`zod`) into `/repo/common/node_modules` because a `require()` originating in `common/dist` does not fall back to `app/node_modules`. No app source touched.
- **Docker build VERIFIED locally** (host arm64, Docker 29.4.2, `--platform linux/arm64`): image builds clean; smoke checks confirm non-root `arc` user, generated `libquery_engine-linux-arm64-openssl-3.0.x.so.node`, `dist/index.js` + `prisma/migrations/` + both `client/lib` data files present. `node dist/index.js` boots (loads `fad-common`/zod, DI container, pino JSON logger), attempts `prisma.$connect()`, fails only on DB reach (P1001) against a fake DB — proving the app entrypoint works. `npx prisma migrate deploy` resolves the CLI (binaryTarget `linux-arm64-openssl-3.0.x`). The seed via `tsx prisma/seed.ts` compiles, resolves the `client/lib` imports, hashes with argon2, and reaches `prisma.user.upsert()` before the same expected DB-connect failure — the full seed path is functional.
- **`cdk/lib/data-stack.ts`:** RDS PostgreSQL 16, Graviton `t4g` (parsed from `instanceSize`), gp3 (allocated + 4× autoscale), private subnets + the NetworkStack database SG, `multiAz` param-driven, backups + PITR (`backupRetention` days from config: test 7 / prod 14), Secrets Manager-generated master creds (`arc/<env>/rds/master`), storage encrypted, removal policy param-driven (test `DESTROY` + no deletion protection / prod `SNAPSHOT` + deletion protection). Exports `dbInstance` + `dbSecret` + `databaseName` (`arc`) for ApiStack.
- **`cdk/lib/api-stack.ts`:** ECR repo (`arc-<env>-api`, scan-on-push, untagged-expiry lifecycle); `ApplicationLoadBalancedFargateService` on ARM64/LINUX runtime platform, `desiredCount` from config, CPU-target autoscaling (min 2 → max 4 at 60%), **deployment circuit breaker with rollback**, `minHealthyPercent 100`/`maxHealthyPercent 200` for zero-downtime, health check `/v1/health/ready` (healthy 2 / unhealthy 3, 60s Prisma-connect grace), container port 8080 (`PORT` set to match the service SG). Env (`NODE_ENV`/`LOG_LEVEL`/`CORS_ALLOWED_ORIGINS` from config) + secrets: `JWT_SECRET` (dedicated generated secret `arc/<env>/api/jwt`), and the DB creds injected as ECS secrets from the RDS secret JSON fields — the container assembles `DATABASE_URL` at start (`export DATABASE_URL=... && exec ...`) so the password never appears in plaintext and no app change is needed. **Migration + seed ECS Fargate task definitions** share the API image with command overrides (`npx prisma migrate deploy` / `npx prisma db seed`) — never on container boot. CloudWatch log group (retention from config) + Container Insights + 6 alarms (ALB 5xx, unhealthy targets, ECS CPU, ECS memory, RDS free storage, RDS CPU). To avoid a Network⇄Api SG dependency cycle, the ALB is built with the NetworkStack `albSecurityGroup` and passed to the construct with `openListener: false` (the shared service SG is never mutated).
- **Config extension** (`config/types.ts` + `test.ts`/`prod.ts`): added `rdsAllocatedStorageGib`, `rdsBackupRetentionDays`, `rdsRemovalPolicy`, `serviceCpu`, `serviceMemoryMib`, `minCapacity`, `maxCapacity`, `cpuTargetUtilizationPercent`, `logRetentionDays`, `nodeEnv`, `logLevel`, and a `DATABASE_NAME` const — all driven by the `docs/infrastructure-and-scaling.md` sizing table (test lean = 256/512 CPU-mem, t4g.small, 20GB, 14d logs, DESTROY; prod HA = 512/1024, t4g.medium, MultiAZ, 50GB, 30d logs, SNAPSHOT). Wired DataStack + ApiStack into `bin/fad.ts` after NetworkStack via cross-stack refs.
- **Hardening handoff (noted in ApiStack):** synth is credential-free (NO `fromLookup`, no ACM/Route53) so the ALB listener is plain HTTP — TLS/ACM, the CloudFront front door, and WAF are owned by steps 15/16.
- **Synth VERIFIED credential-free both envs:** `npx cdk synth -c env=test` and `-c env=prod` both exit 0 with AWS creds unset. Templates skimmed: DataStack test = postgres 16 / db.t4g.small / gp3 20GB / MultiAZ false / 7d backup / encrypted / DeletionPolicy Delete; prod = db.t4g.medium / MultiAZ true / 14d / deletion protection / Snapshot. ApiStack = ECR scan-on-push, service DesiredCount 2 + CircuitBreaker {Enable,Rollback} + 100/200 healthy + 60s grace, 3 ARM64 task defs (service/migration/seed) with the DATABASE_URL-assembly commands + JWT/DB secrets, HTTP:80 listener, health path `/v1/health/ready`, autoscale 2→4 @60%, all 6 alarms, and 3 execution roles each granted secret-read + ECR-pull + logs. Only advisory synth warnings remain (the known upstream `keyName` NAT deprecation from step 13, plus cross-stack-reference-strength and feature-flag notices).
- `$infra-review` (`/infra-review`) executed: verified construct correctness against `aws-cdk-lib@2.261.0`, least-privilege SG reuse, private-subnet DB, encryption, secrets-not-plaintext, circuit breaker + zero-downtime rolling deploy, Graviton/gp3/capped-logs cost levers, and that the migrate/seed task execution roles can pull the image + read secrets + log. No critical issues; non-critical/deferred: HTTP-only listener (→ 15/16) and RDS credential rotation (Secrets Manager, later).
- `$ci` (`/ci`) — `npm run ci` green (common build, type-check across common/app/client, lint:fix, full build incl. client Next build, app tests 2 passed / 23 skipped DB-gated). Needed to copy the gitignored `app/.env` from the primary checkout into the worktree first (per the CI skill's worktree env-sync note) so `JWT_SECRET` was present for the DI container; that `.env` stays gitignored. cdk is package-local (not in root CI): its own `type-check` + both synths pass. No root breakage; no lockfile/package.json drift.

### Context

**Objective:** Author the database and API compute stacks plus the container image they run.
**Done When:**
- `app/Dockerfile`: multi-stage arm64 build (install → prisma generate → tsc → slim runtime), non-root user, `dist/index.js` entrypoint; builds locally.
- `lib/data-stack.ts`: RDS PostgreSQL (params: `instanceSize`, `multiAz`), gp3, private subnets, automated backups + PITR, Secrets Manager master credentials.
- `lib/api-stack.ts`: ECR repo; `ApplicationLoadBalancedFargateService` (Graviton/arm64, `desiredCount`, CPU-target autoscaling, **deployment circuit breaker with rollback**, health check `/v1/health/ready`); secrets/config injected from Secrets Manager + SSM; SG chain ALB→Fargate→RDS:5432; CloudWatch log group with capped retention; **migration and seed ECS RunTask task definitions** (`prisma migrate deploy` / `prisma db seed`) — never run on container boot.
- `npx cdk synth -c env=test` passes; alarms defined for ALB 5xx, target health, ECS CPU/mem, RDS storage (Context §13).

**References:**
- Context §12 (migration race prevention, rollback), §13; `docs/aws-architecture-and-orchestration.md` (component justifications + deploy orchestration); `docs/infrastructure-and-scaling.md` (sizing).

### Plan
- Dockerfile: build `common` first (workspace file: dep), then `app`; runtime image contains only `dist`, generated Prisma client, and production deps.
- DataStack exports endpoint + secret ARN; ApiStack consumes via cross-stack refs from `bin/fad.ts` wiring.
- Migration/seed task defs share the API image with command overrides.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$infra-review` (`/infra-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 15 - WebStack + client static-export knob

### Metadata
**Status:** Complete
**Prereqs:** 13, 14
**Size:** medium
**Owner:** claude-opus-4.8
**Completed At:** 2026-07-13

### Completion Notes
- **`client/next.config.ts` static-export knob:** introduced a readable single mode-switch `buildMode = GITHUB_PAGES ? 'pages' : STATIC_EXPORT ? 'domain' : 'server'` (documented as a contract comment). `pages` keeps the legacy `/athlete_dreams` basePath/assetPrefix + trailingSlash EXACTLY as before; `domain` is a plain `output: 'export'` with NO basePath/assetPrefix (served at the domain root) for the S3/CloudFront deploy; `server` is the default Next build. `output` and `images.unoptimized` are on for both export modes; basePath/assetPrefix/trailingSlash stay gated on `pages` only — so the `GITHUB_PAGES` config resolves byte-identically to the prior file, and the default server config is unchanged. Documented `STATIC_EXPORT` in `client/.env.example`.
- **Three-mode verification (all green):**
  - `STATIC_EXPORT=true npm run build --prefix client` → exit 0, emits `client/out/` with `index.html` + `404.html` (Next names the not-found page `404.html`), asset paths are domain-root (`/_next/...`), and a full-tree grep found **0** files containing `/athlete_dreams` (no basePath leakage). `sitemap.xml`, `robots.txt`, `opengraph-image` all emitted.
  - `GITHUB_PAGES=true npm run build --prefix client` → exit 0, emits `client/out/` with `index.html` + `404.html` and asset paths correctly carrying the `/athlete_dreams/_next/...` basePath prefix (byte-compatible with the legacy export).
  - `npm run build --prefix client` (default) → exit 0, server build, no `out/` emitted; the register pages render as static `○`.
- **Export-compatibility fix (pre-existing `nate` blocker, in-scope for the knob):** at the branch base BOTH export modes failed — the metadata routes (`app/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`) lacked `export const dynamic = 'force-static'` (required under `output: 'export'`), and the three onboarding pages (`app/register/{athletics,personal-basics,values-social}/page.tsx`) read `await searchParams` (inherently dynamic — cannot statically export). Fixes: (1) added `dynamic = 'force-static'` to the three metadata routes (they already render as `○ (Static)` in server mode, so no behavior change); (2) moved the `from` query-param read out of each register server page into its already-`'use client'` form via `useSearchParams()` (wrapped the form in `<Suspense>`; moved the `EditReturnBanner` conditional into the form). UX is byte-preserved (same `?from=review` param → same banner + "Save & return to review" button); the pages now prerender statically in all modes. No `app/src/**`, deploy-workflow, or `deploy-client-pages.yml` changes.
- **`cdk/lib/web-stack.ts`:** private S3 bucket (`BLOCK_ALL` public access, BucketOwnerEnforced, S3-managed encryption, enforceSSL) fronted by CloudFront with **Origin Access Control** via `S3BucketOrigin.withOriginAccessControl` (the AWS-recommended modern OAC pattern; auto-generates the OAC + a `SourceArn`-scoped bucket policy granting only this distribution `s3:GetObject`). Default behavior → S3 (redirect-to-https, CACHING_OPTIMIZED, compress). Behaviors `/v1/*` and `/webhooks/stripe` → the ApiStack ALB via a single shared `LoadBalancerV2Origin` (**HTTP_ONLY** origin protocol — step 14 left the ALB on HTTP; HTTPS hardening handed off to step 16 in the class TSDoc), `AllowedMethods.ALLOW_ALL`, `CachePolicy.CACHING_DISABLED`, `OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER` (forwards all viewer headers except Host so the raw Stripe webhook body survives and the ALB gets the correct Host). `errorResponses` map S3 403 **and** 404 → `/404.html` with a 404 response code. `priceClass` from config (`PriceClass_100` both envs). ACM DNS-validated `Certificate` (stacks are already us-east-1) for `clientDomain` (+ `clientAlternateDomain` SAN in prod). Route 53 A **and** AAAA alias records per client domain.
- **Credential-free synth (non-negotiable):** the hosted zone is imported with `HostedZone.fromHostedZoneAttributes` (NOT `fromLookup`) using `hostedZoneId`/`zoneName` from config. Added `hostedZoneId` + `zoneName` to `DomainConfig` (`cdk/config/types.ts`) with a public-API-contract TSDoc stating the user MUST replace the placeholder before deploying WebStack; per-env values carry the obvious placeholder `Z0PLACEHOLDER000000` for zone `athletearc.ca`. Wired WebStack into `cdk/bin/fad.ts` after ApiStack via the cross-stack ALB ref `api.service.loadBalancer`.
- **Synth VERIFIED credential-free both envs:** `npx cdk synth -c env=test` and `-c env=prod` both exit 0 with AWS creds unset. Templates skimmed — **test** `Arc-test-Web`: OAC (`s3`/`always`/`sigv4`), private bucket (all 4 PublicAccessBlock flags true) + OAC bucket policy scoped to the distribution ARN, Distribution aliases `[test.athletearc.ca]` / `PriceClass_100` / cert (TLSv1.2_2021 sni-only) / default S3 behavior (CACHING_OPTIMIZED) / `/v1/*` + `/webhooks/stripe` behaviors (all 7 methods, CACHING_DISABLED `4135ea2d…`, ALL_VIEWER_EXCEPT_HOST_HEADER `b689b0a8…`) → ALB origin (`http-only`), 403+404→`/404.html`, 2 Route53 RecordSets (A+AAAA), bucket removal DESTROY + autoDelete. **prod** `Arc-prod-Web`: aliases `[athletearc.ca, www.athletearc.ca]`, 4 RecordSets (A+AAAA × 2 domains), bucket removal RETAIN. Only the known upstream advisory warnings from steps 13/14 (NAT `keyName` deprecation, cross-stack-reference strength) — none from WebStack.
- `$infra-review` (`/infra-review`) executed: validated `S3BucketOrigin.withOriginAccessControl` as the current recommended OAC construct (OAI is legacy) and `ALL_VIEWER_EXCEPT_HOST_HEADER` as correct for an ALB/custom origin (forwards everything except Host, CloudFront substitutes the origin host) against current AWS docs; confirmed least-privilege OAC bucket policy, private bucket, credential-free `fromHostedZoneAttributes` synth, and the HTTP-origin → HTTPS handoff note to step 16. No critical issues.
- `$frontend-review` (`/frontend-review`) executed against the client changes: the register refactor keeps pages as server components and reads the query param only in the already-client forms (minimal, UX-preserving); `next.config.ts`/`.env.example` are config/docs. No `fad-common`/money-helper/story-first violations introduced. Re-indented the register form JSX after the fragment-wrap so nesting is consistent (project uses `next lint`, not prettier; `lint:fix` is green).
- `$ci` (`/ci`) — `npm run ci` green (common build, type-check across common/app/client, `lint:fix`, full build incl. client server build with all routes static, app tests 3 passed / 42 skipped DB-gated). Copied the gitignored `app/.env` from the primary checkout into the worktree first (CI skill worktree note) for the DI container's `JWT_SECRET`; it stays gitignored. cdk is package-local (not in root CI): its own `type-check` + both synths pass. No root breakage; no lockfile/package.json/AGENTS-mirror drift.

### Context

**Objective:** Author the client hosting stack and the production-domain static export path.
**Done When:**
- `client/next.config.ts` gains a `STATIC_EXPORT=true` mode: `output: 'export'`, **no basePath/assetPrefix** (the `GITHUB_PAGES` path keeps its `/athlete_dreams` basePath untouched), unoptimized images; `STATIC_EXPORT=true npm run build --prefix client` emits `client/out/` and is documented in `client/.env.example`.
- `lib/web-stack.ts`: private S3 bucket + OAC, CloudFront distribution (`priceClass` param; default behavior → S3; `/v1/*` and `/webhooks/stripe` behaviors → ALB origin, caching disabled, all methods + auth headers forwarded), ACM cert (us-east-1) for `test.athletearc.ca` + `api.test.athletearc.ca`, Route 53 alias records (zone looked up by name; synth works without an account via config-provided zone attributes).
- `npx cdk synth -c env=test` passes.

**References:**
- Context §10; `docs/aws-architecture-and-orchestration.md` → *Front door* + *Open items → Web build note*; `docs/delivery-plan.md` (DNS per environment).

### Plan
- Next config: derive a single `exportMode = GITHUB_PAGES ? 'pages' : STATIC_EXPORT ? 'domain' : 'server'` switch to keep the three modes readable.
- WebStack: OG images and sitemap are build-time static in export mode — no extra origin needed; add a 404 → `not-found.html` mapping.
- Raw-body preservation for the future Stripe webhook: the `/webhooks/stripe` behavior must not alter bodies (origin request policy: all viewer headers except Host).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$infra-review` (`/infra-review`) run
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
