# Backend Foundation, Nate Contract Alignment & AWS Test-Deployment Readiness - Steps 11-15

## Step 11 - Community feed endpoint (derived, follows-aware)

### Metadata
**Status:** Incomplete
**Prereqs:** 7, 9
**Size:** medium
**Owner:** unassigned

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
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

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
**Status:** Incomplete
**Prereqs:** 2, 13
**Size:** medium
**Owner:** unassigned

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
- [ ] Step-specific tasks complete
- [ ] `$infra-review` (`/infra-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 15 - WebStack + client static-export knob

### Metadata
**Status:** Incomplete
**Prereqs:** 13, 14
**Size:** medium
**Owner:** unassigned

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
- [ ] Step-specific tasks complete
- [ ] `$infra-review` (`/infra-review`) run
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
