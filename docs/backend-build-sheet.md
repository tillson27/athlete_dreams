# Backend Build Sheet — Phases 0–4 + Infra & Deploy

Concrete, per-file implementation plan for completing the FAD/ARC backend business logic and standing up AWS hosting. Read alongside `docs/architecture.md` (current state) and `docs/infrastructure-and-scaling.md` (hosting design, cost levers, scaling stages).

## Conventions (inherited — see `AGENTS.md`, `app/AGENTS.md`)

- **Zod-first**: edit `common/src/zod/` → `npm run build --prefix common` → update `app/`. Never redefine request/response types in `app/`; import from `fad-common`.
- **Repository-per-aggregate**: all Prisma access via `app/src/repositories/`. Controllers/services never import `PrismaClient`.
- **Typed domain errors** (`app/src/shared/errors.ts`); the global `errorHandler` maps them to HTTP.
- **Money in integer cents**; **dates ISO-8601 in transport**, `Date` at the boundary.
- **[STRICT] AI limits**: I draft migrations only (`npm run migrate:create --prefix app -- --name <name>`) — **you apply** them. Migration files are immutable once created. **AI never deploys.**

## Locked decisions (from planning)

| Decision | Choice |
|---|---|
| Payment provider | **Stripe Connect — Standard accounts (OAuth)**, **direct charges, fee 0** — funds never touch the platform |
| Athlete onboarding | One Standard OAuth flow: connect an existing Stripe account **or** create a new one (Stripe-hosted) |
| Funding models | **Direct (immediate) donations only** for now — all-or-nothing (Kickstarter) pledges are **deferred**; see "Deferred" below |
| Money custody | Athlete is merchant of record; owns Stripe fees, refunds, disputes, payouts. Platform takes **0** and holds nothing. |
| Persistence | **Event-sourced ledger** (`DonationEvent`, append-only); campaign totals are projections folded from it |
| Overfunding past target | **Allowed** — mark `FUNDED` at target, keep accepting until `closesAt` |
| Cost-line vs target | **Strict equality** (Σ `costLines.amountCents` == `targetAmountCents`) |
| Refresh-token transport | **httpOnly secure cookie** (no `authSessionSchema` change) |
| Email provider | **Resend** for current verification/reset emails; SES remains an AWS-native alternative for later invites/receipts |
| Compute / client hosting | **ECS Fargate + ALB** / **static S3 + CloudFront** (SSR later) |
| Base branch | **`nate`** — integration base; all implementation branches cut from it (see `docs/delivery-plan.md`) |
| Domain / market | **athletearc.ca** (hardcoded across the client) · Canada-first launch · default currency **CAD** |

Scope: **Phases 0–4** (crowdfunding + accounts/teams). Pillars 2 & 3 (Brands/sponsorships, ambassador programs) are deferred to a later Phase 5 — confirmed by `nate`, which deleted the `/brands` and `/ambassadors` routes for a runners-only launch.

## Frontend contract alignment (`nate` base)

The `nate` frontend ships launch surfaces on deliberate mock seams — each names its backend replacement:

| Client seam | What it mocks | Backend owner |
|---|---|---|
| `client/lib/session.ts` (localStorage) | sign-up / sign-in / sign-out, `published` flag, session restore | Phase 4 auth (+ publish state via Phase 1) |
| `client/lib/follows.ts` | follow graph keyed by athlete slug | Phase 1 (`Follow` model + endpoints) |
| `client/lib/athleteEdits.ts` (manage editor) | highlights / races / roadmap / gallery CRUD | Phase 1 — the canonical athlete-generated content model |
| `client/lib/athleteProfiles.ts` (`RichAthleteProfile`) | rich profile read model ("mirrors a future `athleteProfileSchema`") | Phase 1 read path |
| `client/lib/communityFeed.ts` | feed derived from results / roadmap / training | Phase 1 feed endpoint (derived, not stored) |
| `/register/*` 4-step onboarding (localStorage) | draft profile persistence + publish | Phase 1 (`PATCH /v1/athletes/me` + publish) |

**Normalization split (decided):** normalize what the manage editor edits — **highlights, race results, roadmap, gallery, personal bests** — plus identity/story fields (`handle`, `runnerLevel`, `disciplineLabel`, `storyIntro`, `storyBody`, core values, `publishedAt`). Curated presentation (arc chapters, training snapshot, instagram posts, power profile, tones/icons) stays in a `presentation Json` column until the editor grows to cover it. **Verification** is derived, not stored: a result/PB carries an official `resultUrl` → badge.

Contract reconciliations: the client narrows sports to `RUNNING | TRACK_AND_FIELD | ROAD_CYCLING` (add `ROAD_CYCLING` to `SportCategory`), adds `runnerLevel (ELITE | COMPETITIVE | EVERYDAY)`; directory and feed list **published** athletes only; photo upload + feed cheers are deferred (see Deferred).

---

## Phase 0 — Foundation & unblock

**Goal:** make the API runnable against Postgres, testable, and seedable.

**Prisma / migrations**
- `npm run migrate:create --prefix app -- --name init` → produces `app/prisma/migrations/<ts>_init/` (I draft; **you** run `prisma migrate dev`/`deploy` to apply). This is the #1 blocker today — no migrations exist. Full recurring procedure: the `$db-migrate-and-seed` (`/db-migrate-and-seed`) skill.
- The `init` migration **includes the nate profile-model evolution** (Phase 1 Δschema below) so the first applied schema is the right one — nothing is deployed yet, so there is no reason to migrate twice.

**App entry refactor** (`app/src/`)
- Split `index.ts` → `app.ts` (exports `buildApp(): Express`) + `index.ts` (`start()` only). Lets tests and the migration task import the app without binding a port.
- `PrismaService.ts`: add `$connect()` on boot and SIGTERM/SIGINT graceful shutdown (`server.close()` → `prisma.$disconnect()`).
- Health: replace `/v1/health` with `/v1/health/live` (process up) and `/v1/health/ready` (`SELECT 1` via Prisma). ALB target-group health check → `/v1/health/ready`.

**Test harness**
- `app/package.json`: add devDeps `vitest`, `supertest`, `@types/supertest`; scripts `"test": "vitest run"`, `"test:watch": "vitest"`.
- `app/vitest.config.ts` (new).
- `app/src/test/buildTestApp.ts` (new) — returns `buildApp()` for `supertest`.
- Root `package.json`: add `"test": "npm run test --prefix app"` and include it in `ci`.

**Seed**
- `app/prisma/seed.ts` (new) — mirrors the nate launch roster: `client/lib/mockAthletes.ts` (8 athletes incl. `runnerLevel`, campaigns, accomplishments) **plus** `client/lib/athleteProfiles.ts` (rich profile content: PBs, highlights, races, roadmap, story, presentation JSON) so the client renders identically from live data.
- `app/package.json`: add `"prisma": { "seed": "tsx prisma/seed.ts" }`. **You** run `prisma db seed` after applying `init`.

**Fixes for known contract bugs**
- `app/src/repositories/PlatformRoleRepository.ts` (new): `assignRole(userId, role)`, `listRolesForUser(userId)`.
- `AthleteService.createProfileForUser` → also assign `ATHLETE` `PlatformRoleAssignment` (nothing sets platform roles today).

**Tests:** health readiness, sign-up→personal-team invariant, profile-create assigns `ATHLETE`.

---

## Phase 1 — Read path + nate contract alignment (no money yet)

**Δcontract** (`common/src/zod/`)
- `athlete.ts`: add `updateAthleteProfileRequestSchema` (`.strict()`, all optional: `headline`, `bio`, `hometown`, `countryCode`, `secondarySports[]`, `values[]`, `socialInstagramHandle`, `socialTwitterHandle`, `socialStravaUrl`, `heroMediaUrl`) → `UpdateAthleteProfileRequest`. Add `athleteDirectoryResponseSchema = paginationResponseSchema(athleteDirectoryItemSchema)`.
- `campaign.ts`: add `campaignSummarySchema` (feed card) + `activeCampaignFeedResponseSchema = paginationResponseSchema(campaignSummarySchema)`.

**Repositories**
- `AthleteRepository`:
  - `findBySlug` → `include: { accomplishments, media, events }` (fixes the hardcoded `[]` in the DTO).
  - `listDirectory` → **keyset pagination** on `(createdAt desc, id desc)`; accept `cursor`, return `{ items, nextCursor }` (today `cursor` is parsed then ignored).
  - `getCampaignStatsForAthletes(athleteIds: string[]): Promise<Map<string,{activeCampaignCount:number; totalRaisedCents:number}>>` via `groupBy` — **kills the N+1** in `buildDirectoryItem`.
  - `update(athleteId, patch)`, `addAccomplishment(athleteId, input)`, `addMedia(athleteId, input)`.
- `EventRepository` (new): `create(athleteId, input)`, `listForAthlete(athleteId)`.
- `CampaignRepository`: `listActiveFeed({limit, cursor})` (keyset); wire up the already-present `listActiveForAthlete` (dead code today).

**Services / controllers / routers**
- `AthleteService`: real `accomplishments`/`media`/`events` in `getProfileBySlug`; `updateMyProfile`, `addAccomplishment`, `addMedia`, `addEvent` (ownership via `authenticatedUserId`); `listDirectory` uses batched stats + returns paginated wrapper.
- `AthleteController`/`AthleteRouterFactory`: `PATCH /v1/athletes/me`, owner set-replace routes `PUT /v1/athletes/me/{personal-bests,highlights,races,roadmap,gallery}` (auth), and `POST /v1/athletes/me/publish` (auth). `GET /v1/athletes/:athleteSlug/campaigns` is mounted by `AthleteCampaignsRouterFactory` under the campaigns feature. Change `GET /v1/athletes` to return `{items, nextCursor}`.
- `CampaignService`: `listActiveFeed`, `listForAthlete(slug)`; **enforce Σ cost lines == target** in `createForAthlete` (else `ValidationError`).
- `CampaignController`/`CampaignRouterFactory`: `GET /v1/campaigns?status=active&limit=&cursor=` (feed, public).

**Nate alignment additions** (see *Frontend contract alignment* above)
- **Δschema** (folded into the Phase 0 `init` migration): `AthleteProfile` += `handle @unique`, `runnerLevel`, `disciplineLabel`, `storyIntro`, `storyBody String[]`, `coreValues Json`, `presentation Json`, `publishedAt DateTime?`; `AthleteAccomplishment` → highlight shape (+ `detail`, `resultUrl?`, `photoRefs String[]`); new `AthleteRaceResult` (name, `displayDate`, `resultSummary`, `resultUrl?`, `links Json?`, `photoRefs String[]`); new `PersonalBest` (label, value, `resultUrl?`, sortOrder); `AthleteEvent` += `displayDate` (roadmap); new `Follow` (`followerUserId`, `athleteId`, `@@unique`); `SportCategory` += `ROAD_CYCLING`; enum `AthleteLevel { ELITE COMPETITIVE EVERYDAY }`.
- **Δcontract**: grow `athleteProfileSchema` toward the client's `RichAthleteProfile`; `athleteDirectoryQuerySchema` += `runnerLevel`; new `followSchema`, `communityFeedItemSchema`, `publishAthleteProfileResponseSchema`.
- **Endpoints**: `POST`/`DELETE /v1/athletes/:athleteSlug/follow` + `GET /v1/users/me/follows` (auth); `GET /v1/community/feed` (public, derived from results/roadmap/training, filterable by sport/kind, follows-aware when authed); `POST /v1/athletes/me/publish` (guard: minimum content; directory/feed return **published only**); manage-editor CRUD as set-replace to match the editor's save-all model: `PUT /v1/athletes/me/{highlights,races,roadmap,gallery}`.
- **Repos**: `FollowRepository` (new); `AthleteRepository` gains set-replace writers for results/highlights/roadmap/gallery and published-only filters.

**Tests:** transparency rule, keyset pagination correctness, profile includes, directory batching (no N+1), follow/unfollow round-trip, feed derivation + follows filter, publish gating (unpublished hidden from directory/feed).

---

## Phase 2 — The money loop: direct donations (implemented; hosted verification pending)

We are **not** the merchant of record. Athletes hold **Standard** Connect accounts (they own funds, fees, refunds, disputes, payouts); we orchestrate **direct charges** with `application_fee = 0` and record everything to an **append-only event ledger**. Scope now is **immediate donations only** — funds are captured at donation time. All-or-nothing (Kickstarter) pledging is documented as a future add (see "Deferred" below); the event-ledger design keeps it additive.

**Access:** live Stripe credentials (Connect app + keys) are **deferred**. The direct-donation code path is implemented; the remaining gate is hosted Stripe **test mode** verification with real Connect webhook delivery. See `docs/infrastructure-and-scaling.md` → *Prerequisites & access*.

**Business alignment:** `docs/business/incorporation-and-finances.md` (from `nate`) independently locks the same model — non-custodial (backer → Stripe → athlete), zero platform fee, no MSB/FINTRAC exposure, KYC and chargebacks on Stripe + athlete. Default currency **CAD** (AthleteArc Inc., Canada-first). It adds one compliance follow-up: confirm CRA **digital-platform reporting** (OECD rules) with an accountant — the `DonationEvent` ledger already retains the data such reporting would need.

**Deps:** `stripe`. **Local env (`app/.env.example`):** `STRIPE_SECRET_KEY`, `STRIPE_CONNECT_WEBHOOK_SECRET`, Stripe onboarding/Checkout URL values, `DONATION_MINIMUM_CENTS`, `DEFAULT_CURRENCY`. **Deployed env:** see `cdk/README.md` → §1c for the canonical Secrets Manager/SSM names. *(No `PLATFORM_FEE_BPS` — the platform takes nothing.)*

**Schema**
- `AthleteProfile`: `stripeAccountId String? @unique`, `stripeChargesEnabledAt DateTime?`.
- `Donation` stays a per-contribution **projection**; `paymentProviderRef` stores the Checkout Session id and `stripePaymentIntentId` stores the PaymentIntent after success — no card data is stored, so PCI stays out of our system.
- `DonationEvent` (new, **append-only source of truth**): `id`, `donationId?`, `campaignId`, `athleteId`, `donationEventType`, `amountCents`, `currency`, `stripeAccountId`, `stripeObjectId`, `idempotencyKey @unique` (= Stripe event id), `occurredAt`, `rawPayload Json`.
- enum `DonationEventType { DONATION_SUCCEEDED DONATION_FAILED DONATION_REFUNDED DISPUTE_OPENED }`.
- `WebhookEvent` (new): `eventId @unique`, `provider`, `eventType`, `payload Json`, `processedAt` — idempotency/audit.

**Contract** (`common/`)
- `types/enums.ts`: add `DonationEventType`.
- `donation.ts`: `createDonationResponseSchema = { donation, checkoutUrl }`.
- `athlete.ts`: `athleteStripeStatusSchema = { stripeConnected, chargesEnabled, payoutsEnabled, onboardingUrl? }`.

**Infra service** — `app/src/services/infrastructure/StripeService.ts`
- Onboarding: `createConnectedAccount()`, `createAccountLink(accountId)`, `retrieveAccount(id)`.
- Charge: `createDonationCheckoutSession({ amountCents, stripeAccountId, metadata })` — hosted Checkout direct charge through the `Stripe-Account` header, **no** `application_fee_amount`, `transfer_data`, or `on_behalf_of`.
- `constructWebhookEvent(rawBody, signature)` — Connect signing secret.

**Repositories**
- `DonationEventRepository`: append ledger events with event-id idempotency.
- `DonationRepository`: create pending donations, map provider refs/payment intents, and update statuses.
- `WebhookEventRepository`: audit Stripe webhook receipt and processing.
- `AthleteRepository`: `setStripeAccount(athleteId, accountId)`, `setChargesEnabled(athleteId, at)`.
- `CampaignRepository`: `applyDonationEvent(campaignId, event, tx)` — **atomically** updates the projection (`raisedAmountCents` / `supporterCount`) and flips `FUNDED` when `raised >= target`.

**API**
- Onboarding: `POST /v1/athletes/me/stripe/onboarding-link` → `{ onboardingUrl }`; `GET /v1/athletes/me/stripe/status`.
- Donate: `POST /v1/donations` (`auth.optional` — **anyone can donate**): `createDonationCheckoutSession`; `Donation(PENDING)`; return `{ donation, checkoutUrl }`. Guards: campaign `ACTIVE`, not past `closesAt`, athlete Stripe ready (`charges_enabled`, `payouts_enabled`, active card payments), min amount.
- Webhook: `api/webhooks/` (new) — `POST /v1/webhooks/stripe` (Connect events, raw body).
  - **CRITICAL:** mount with `express.raw({ type: 'application/json' })` **before** the global `express.json` in `buildApp`.
  - Every handler: idempotency-gate on `WebhookEvent`, append to `DonationEvent`, then project in one `prisma.$transaction`:
    - `checkout.session.completed` / `checkout.session.async_payment_succeeded` → `DONATION_SUCCEEDED` (+ flip `FUNDED` at target).
    - `checkout.session.async_payment_failed`, `checkout.session.expired`, `payment_intent.payment_failed` → `DONATION_FAILED`.
    - `charge.refunded` → `DONATION_REFUNDED` (partial refunds do not set `DonationStatus.REFUNDED`); `charge.dispute.created` → `DISPUTE_OPENED`.
    - `account.updated` → set `stripeChargesEnabledAt` only when `charges_enabled`, `payouts_enabled`, and `capabilities.card_payments='active'`.
    - `account.application.deauthorized` → clear Stripe readiness.

**Tests:** hosted onboarding + readiness gating; Checkout success + live projection + `FUNDED` flip; overfunding accepted; webhook idempotency (duplicate event id); raw-body mount ordering; ledger→projection fold correctness; expired sessions, partial refunds, live/test webhook mode mismatches, and deauthorization.

---

## Phase 3 — Campaign lifecycle & transparency updates

> **Note:** Partially implemented. Current campaign creation persists transparent cost lines, owner-facing `PATCH /v1/campaigns/:campaignSlug/status` is mounted for guarded activation/completion/archival, and the Phase 2 money loop can flip `ACTIVE` campaigns to `FUNDED`. Campaign update posting/listing and receipt-backed reconciliation are still planned behavior.

**Δcontract** (`common/src/zod/campaign.ts`)
- `updateCampaignStatusRequestSchema` (`campaignStatus`, constrained), `campaignUpdateSchema`, `createCampaignUpdateRequestSchema` (`updateTitle`, `updateBody`).

**Repositories / services**
- `CampaignRepository`: `updateStatus` implemented; `addUpdate`, `listUpdates` planned.
- `CampaignService`: `changeStatus(userId, slug, status)` implemented with a **transition guard** — `DRAFT→ACTIVE` requires transparency valid + published athlete Stripe readiness; `ACTIVE|FUNDED→COMPLETED|ARCHIVED` is manual. `FUNDED` is set automatically by the Phase 2 money loop at target; terminal states are final. `postUpdate` (owner-only), `listUpdates` planned.
- Endpoints: `PATCH /v1/campaigns/:campaignSlug/status` implemented; `POST /v1/campaigns/:campaignSlug/updates`, `GET /v1/campaigns/:campaignSlug/updates` planned.

**Tests:** full transition matrix, publish-blocked-without-charges-enabled, owner-only update gate.

---

## Phase 4 — Accounts hardening & teams

**Deps:** `express-rate-limit`, `cookie-parser` (+ `@types/cookie-parser`).

**Auth: refresh tokens (no migration — `AuthSession` model already exists but is unused)**
- `AuthSessionRepository` (new): `create({userId, refreshTokenHash, userAgent, ipAddress, expiresAt})`, `findValidByHash`, `rotate`, `revoke`, `revokeAllForUser`.
- `JwtService`/new `RefreshTokenService`: opaque random token (`crypto.randomBytes`), store **hash** in `AuthSession.refreshTokenHash`.
- `AuthService`: `signUp`/`signIn` also issue a refresh token → **httpOnly secure cookie** (`SameSite=Lax`, path `/v1/auth`). Add `refresh(token)` (**rotation + reuse detection**: unknown-but-user-has-newer → `revokeAllForUser`), `signOut(token)`.
- `AuthRouterFactory`: `POST /v1/auth/refresh`, `POST /v1/auth/sign-out`. `buildApp`: `cookieParser()`.
- Distributed rate limiting: replace the current in-process `/v1/auth/*` limiter with a shared store and add light global limits.

**Email verification & password reset** — implemented with Resend (2026-07-19)
- `EmailVerificationToken` and `PasswordResetToken` store SHA-256 token hashes, expiry, and single-use consumption state.
- `EmailService` sends verification, welcome, and password-reset emails through Resend using env-configured sender settings.
- `AuthService` sends verification on sign-up, supports forgot/reset/resend/verify flows, and exposes verification state in the auth session contract.
- Verification is **idempotent** and **non-invalidating**: re-presenting a consumed link succeeds once the address is verified, and a resend leaves previously mailed links usable until they expire (48h). Password reset keeps the stricter invalidate-on-reissue behaviour.
- An unverified email does **not** gate publishing or account access — it renders as a nudge only.
- Remaining account-hardening work: refresh-token rotation, distributed rate limiting, cloud sender/domain operations, and team invites.

**Teams (contracts already exist: `createTeamRequestSchema`, `inviteTeamMemberRequestSchema`, `teamInvitationSchema`, `teamMembershipSchema`)**
- `TeamRepository`: `createTeam({name, ownerUserId})` (non-personal), `addMembership`, `updateRole`, `removeMembership` (soft: `leftAt`), `listMembers`.
- `TeamInvitationRepository` (new): `create` (hashed token + expiry), `findByTokenHash`, `accept`, `revoke`, `listForTeam`.
- `TeamService`: `createTeam`, `invite` (OWNER/MANAGER only → SES email), `acceptInvite(token, userId)`, `declineInvite`, `revokeInvite`, `listMembers`, `changeRole`, `leaveTeam` — authorization by `TeamRole`.
- Endpoints: `POST /v1/teams`, `GET/POST /v1/teams/:teamId/members`, `PATCH`/`DELETE /v1/teams/:teamId/members/:userId`, `POST`/`GET /v1/teams/:teamId/invitations`, `POST /v1/team-invitations/:token/accept`.

**Tests:** refresh rotation + reuse revocation, rate-limit 429, verify-email happy/expired, invite→accept, role gates.

---

## Infra & Deploy track (parallel to 0–4)

**[STRICT]** I author all IaC and pipelines; **you** run `cdk deploy` and all migration applies. Hard dependency: Phase 0's `init` migration must exist before `DataStack` is useful.

**`cdk/` (new — does not exist today)** — AWS CDK v2 (TypeScript)
- `cdk/bin/fad.ts`, `cdk/cdk.json`, `cdk/package.json`, `cdk/tsconfig.json`.
- `cdk/lib/network-stack.ts` — VPC (2 AZ), public/private subnets, `natStrategy: 'gateway'|'instance'`, security groups, free S3 gateway endpoint.
- `cdk/lib/data-stack.ts` — RDS PostgreSQL (`instanceSize`, `multiAz` params), gp3, automated backups + PITR, Secrets Manager master creds, private subnets.
- `cdk/lib/api-stack.ts` — ECR repo, `ApplicationLoadBalancedFargateService` (Graviton/arm64, `desiredCount`, `useSpot`, CPU-target autoscale), ACM cert, secrets → task env, SG → RDS, CloudWatch log group + retention. Target health check `/v1/health/ready`.
- `cdk/lib/web-stack.ts` — S3 (private + OAC) + CloudFront (`priceClass` param) + ACM (us-east-1) + Route 53 aliases. Behaviors `/v1/*` and `/v1/webhooks/stripe` → ALB origin (one domain, no CORS, Stripe raw body preserved).
- `cdk/lib/migration-task.ts` — ECS task definition running `prisma migrate deploy` (invoked as a discrete `RunTask` **before** new tasks take traffic — never on container boot; avoids multi-task races).
- `cdk/config/{prod,staging}.ts` — the cost/HA parameters (see `docs/infrastructure-and-scaling.md`).
- `cdk/README.md` — deploy runbook (all commands run by **you**).

**CI/CD (`.github/workflows/`)**
- `ci.yml` (new) — PR checks for `app`: type-check, lint, **test**, build (currently no app CI exists).
- `deploy-api.yml` (new) — on `app/**`/`common/**`: type-check/test → `docker build` (arm64) → push ECR (GitHub **OIDC** role, no static keys) → `cdk deploy ApiStack` → ECS `RunTask` migrate deploy.
- Replace `deploy-client-pages.yml` → `deploy-web.yml` — build client → S3 sync → CloudFront invalidation (or keep Pages until DNS cutover).

**Secrets/config**
- Move `.env` values to Secrets Manager (DB creds, `STRIPE_*`, `JWT_SECRET`) / SSM Parameter Store (non-secret config); CDK injects into the task definition.
- Update `app/.env.example` with every new var; document the GitHub OIDC IAM role.

---

## Cross-cutting checklist (every phase)

- Tests alongside each feature; keep `npm run ci` green (`$ci` / `/ci`).
- Update `app/.env.example` when adding env vars.
- Dependency-reuse check before adding any dep (`AGENTS.md` [STRICT]).
- Import shared types from `fad-common` only.
- Commit only when asked, via `$commit` (`/commit`).

---

## Deferred — All-or-nothing (Kickstarter) pledges (future feature)

**Not in current scope.** Direct donations (Phase 2) ship first. This is captured here so the design and seams are known. Thanks to the event-sourced ledger, it is **additive** — it does not rewrite the direct-donation path; the only shared seam is a `fundingModel` branch in the contribute endpoint (default `IMMEDIATE`).

**Why deferred:** direct donations are a request/response Stripe integration and a complete, shippable product. All-or-nothing turns the money loop into a **time-driven, scheduled system that charges saved cards in batches with partial failures** — roughly **+35–45% more code** but the harder **~60% of the correctness/testing risk**.

**Mechanism:** Stripe card auths expire in ~7 days, so we can't "hold" pledged money over a multi-week window. Instead: **save the card at pledge time (`SetupIntent`), then charge off-session at the deadline** only if the goal is met.

**What it adds on top of direct donations**
- **Schema:** `Campaign.fundingModel` (`IMMEDIATE | ALL_OR_NOTHING`, default `IMMEDIATE`) + `pledgedAmountCents`; `CampaignStatus` += `EXPIRED`; `DonationStatus` += `PLEDGED`, `CANCELED`; `Donation` += `stripeCustomerRef`, `stripePaymentMethodRef`; `DonationEventType` += `PLEDGE_CREATED`, `PLEDGE_CANCELED`.
- **Contracts:** `CampaignFundingModel`; `fundingModel` on `campaignSchema` + `createCampaignRequestSchema`; `pledgedAmountCents` on `campaignSchema`; pledge branch of the contribute response (`{ donation, setupClientSecret }`).
- **Stripe:** `createSetupIntent` (save card to a customer on the connected account) + `chargeSavedPledge` (off-session capture).
- **Contribute endpoint:** branch on `fundingModel` — `ALL_OR_NOTHING` → `SetupIntent` → `Donation(PLEDGED)`; webhook `setup_intent.succeeded` → `PLEDGE_CREATED`.
- **Deadline resolver** — `CampaignResolverService.resolveDueCampaigns()`, triggered by **EventBridge Scheduler → ECS RunTask** (new `cdk/lib/scheduler-stack.ts`); idempotent, batched, resumable. Per `ALL_OR_NOTHING` campaign past `closesAt`: goal met → off-session charge each pledge (`DONATION_SUCCEEDED`/`_FAILED`; failed captures don't unfund a met goal) → `COMPLETED`; goal unmet → cancel pledges (`PLEDGE_CANCELED`) → `EXPIRED`.
- **Two figures:** `pledgedAmountCents` (goal progress during the window) vs `raisedAmountCents` (actually collected, post-deadline). Direct donations collapse these into one.
- **Publish rule:** `ALL_OR_NOTHING` campaigns require a `closesAt` at `DRAFT→ACTIVE`.

**The hard parts (where the risk concentrates)**
1. **Scheduled batch capture that can crash mid-run** — must resume without double-charging.
2. **Off-session charging is lossy** — ~5–10% fail (declines, expired cards, SCA `authentication_required`); needs failure tracking, donor notification, and possibly a re-authorize / update-card flow.
3. **Time as a first-class input** — multi-week lifecycle, `closesAt` correctness, late-run tolerance, time-simulated tests.

See `docs/infrastructure-and-scaling.md` for the operational/scaling angle on the scheduled resolver.

**Also deferred (from nate's frontend):**
- **Athlete photo uploads** — the manage editor strips `blob:` URLs on save ("photo hosting is a Path-B concern"); launch roster uses Unsplash refs. Future: S3 presigned uploads + an `AthleteMedia`-backed gallery.
- **Feed cheers persistence** — `arc-cheers` is localStorage-only; a real model should cheer the underlying result/highlight entity (stable identity), not the derived feed item.
