# ARC MVP Platform Alignment

Date: 2026-07-13
Task slug: arc-mvp-platform-alignment
Status: Draft

## 0) Summary

- **Objective:** Import the MVP frontend from `origin/nate` without visual changes, refactor its implementation quality, and align `common/`, `app/`, Prisma, and client data access with the new product surface.
- **Why now:** A non-technical stakeholder used Claude Code to express the desired MVP UI and feature set; the repo now needs that product direction converted into maintainable, scalable platform code.
- **Primary outcomes:** Preserve the redesigned UI, replace prototype-only state with typed backend contracts, normalize the data model for public athlete profiles and community features, and keep the system ready for thousands of users without prematurely building payments.

---

## 1) Success criteria

- The redesigned `origin/nate` client UI is present on the working branch with no intentional visual or copy changes.
- Imported client code is refactored for maintainability while preserving behavior: clear route ownership, reusable components, no duplicate API shapes, and comments reduced to the repo's allowed comment types.
- Prototype-only client storage from `client/lib/session.ts`, `client/lib/athleteEdits.ts`, `client/lib/follows.ts`, and `client/lib/communityFeed.ts` is replaced or isolated behind API-ready adapters before the backend integration steps depend on it.
- New and changed request/response shapes are defined first in `common/src/zod/` and imported from `fad-common` in `app/` and `client/`.
- Prisma models support the MVP profile surface: draft/published profile state, story fields, values, personal bests, verified results, prior races, upcoming roadmap/events, media metadata, follows, community feed targets, and transparent campaign cost lines.
- Backend routes follow the existing `RouterFactory → Controller → Service → Repository` pattern, with thin controllers, repository-only Prisma access, typed errors, pagination, indexes, and ownership checks.
- Public pages can render from backend data with deterministic loading and error states; authenticated flows use real auth/session APIs instead of mock localStorage sessions.
- The final validation step runs the `$e2e-review` (`/e2e-review`) skill and `$ci` (`/ci`) successfully.

**Acceptance criteria (definition of done):**
- Running `npm run ci` from the repo root passes after all planned steps are complete.
- The imported UI routes from `origin/nate` build successfully and the core flows work end-to-end: sign up, profile draft, publish, dashboard, public athlete profile, directory, follow, and community feed.
- No API request or response type is duplicated outside `fad-common`.
- Existing transparency and story-first product mandates remain visible in campaign/profile responses and UI.

---

## 2) Scope and non-goals

**In scope:**
- Review `origin/nate` and import the UI-specific `client/` changes.
- Preserve the visual design, route structure, and MVP copy from the redesigned client.
- Refactor imported frontend code where structure, duplication, comments, or prototype state would make future work brittle.
- Create or update Zod contracts for the MVP UI's actual data needs.
- Update Prisma schema through the repo-approved migration workflow, not by hand-writing migration files.
- Implement backend APIs for profile draft/publish, public profiles, profile management, directory, follows, community feed, dashboard data, and campaign/cost-line readiness.
- Connect the client to backend APIs through typed API helpers and Server Components where appropriate.
- Update docs that are contradicted by implementation after the feature lands.

**Out of scope:**
- Deployments of any kind.
- Payment provider integration, live donations, refunds, payouts, Stripe Connect onboarding, or payment webhooks.
- Full brand sponsorship marketplace workflows and managed ambassador CRM workflows.
- Strava, race-results, or social-network provider integrations.
- Production object-storage infrastructure unless a later scoped step explicitly adds it.
- Renaming all packages, repos, and internal `fad-*` identifiers to ARC/Athlete ARC.

**Out-of-scope edge cases:**
- High-volume viral donation spikes are not handled in this task because live payments remain disabled.
- Multi-region read replicas and global feed fanout are not addressed because the near-term scale target is thousands of users, not millions.
- Automated athlete result verification against third-party results providers is deferred; MVP verification stores source links and statuses.

---

## 3) Background and motivation

Repo docs define FAD as a transparent athlete funding network anchored on crowdfunding, with athlete stories and cost transparency as strict differentiators. See `docs/product-brief.md` and `docs/architecture.md`.

The `origin/nate` branch expresses a newer MVP direction under the customer-facing ARC/Athlete ARC brand. It shifts the first viewport and early product loop toward story-first verified athlete profiles, runner discovery, onboarding, profile publishing, dashboard management, follows, share cards, and a preview community feed. Backing/crowdfunding is still presented as "coming after launch" in `client/app/(marketing)/support/page.tsx` on `origin/nate`.

The current backend already has useful foundations in `app/prisma/schema.prisma`: users, teams, athlete profiles, athlete media, athlete events, campaigns, cost lines, campaign updates, donations, brands, sponsorship inquiries, and ambassador programs. The gap is that the redesigned frontend encodes richer profile and community state in fixtures and browser storage rather than durable contracts.

---

## 4) Current state and gaps

### Current state

- Current branch is `jt_updates`, aligned with `origin/main` at `63867afa07bbdc5de7410f218d95a81383837f74`.
- The redesigned branch is `origin/nate` at `87abc138d28a0e3471c0ccad34dd69936645ff25`.
- `origin/nate` contains 123 changed files with about 9,834 insertions and 4,249 deletions, mostly under `client/`.
- `origin/nate` moves marketing routes into `client/app/(marketing)/`, adds `client/app/register/`, `client/app/(marketing)/dashboard/`, `client/app/(marketing)/community/`, legal/SEO pages, and richer profile pages under `client/app/(marketing)/athletes/[athleteSlug]/`.
- `origin/nate` removes the previous `client/app/presentation/` route and the older `client/app/brands/page.tsx` and `client/app/ambassadors/page.tsx` pages.
- Current backend exposes auth, users, teams, athletes, and campaigns through `app/src/api/`.
- Current `common/src/zod/` schemas cover basic auth, users, teams, athletes, campaigns, donations, events, and sponsorships.
- There is no `common/openapi.yaml` in the current repo, despite the planning checklist referencing one.
- There is no `docs/product/scenario.md`; the current product source is `docs/product-brief.md`.

### Gaps

- `origin/nate` stores sign-in/sign-up session state in `client/lib/session.ts` using localStorage instead of the existing auth API.
- `origin/nate` stores onboarding drafts in `client/app/register/_components/OnboardingContext.tsx` using localStorage.
- `origin/nate` stores profile edits in `client/lib/athleteEdits.ts`, follows in `client/lib/follows.ts`, and community cheers in `client/app/(marketing)/community/CommunityClient.tsx` using localStorage.
- `origin/nate` has rich public profile fixtures in `client/lib/athleteProfiles.ts` and directory/campaign fixtures in `client/lib/mockAthletes.ts`; those shapes exceed current `common/src/zod/athlete.ts`.
- The current `AthleteService.toProfileDto` returns empty `accomplishments` and `media`, so public profiles cannot render the redesigned profile without client fixtures.
- The current athlete directory builds `activeCampaignCount` and `totalRaisedCents` through one count and one aggregate query per athlete, which will not scale cleanly for larger directories.
- Current docs mention `app/src/config/DependencyInjector.ts` and `app/src/loaders/RouterLoader.ts`, but those files do not exist; route factories are resolved directly in `app/src/index.ts`.
- Current frontend AGENTS guidance says routes are flat until route groups are justified; `origin/nate` now justifies at least a `(marketing)` group and a separate `register/` flow.
- `origin/nate` introduces customer-facing ARC/Athlete ARC branding while repo/package names and current docs still use FAD.

---

## 5) Changes and considerations

**Significant changes:**
- Import `origin/nate` client UI as the MVP feature source of truth, excluding non-UI branch artifacts unless intentionally adopted later.
- Introduce typed client API adapters so the imported UI can initially keep its appearance while data source changes are staged.
- Expand shared schemas for public profile, draft profile, dashboard, follows, community feed, results, media, and campaign summary shapes.
- Normalize persisted profile content rather than storing a large opaque JSON blob for everything.
- Add pagination and aggregate strategy for directory and feed surfaces.
- Replace localStorage-as-source-of-truth with backend persistence, while retaining localStorage only for non-authoritative draft resilience if needed.
- Keep crowdfunding disabled at the UI/product level and prepare transparent campaign data only.

**Impact and considerations:**
- The first import/refactor step should be visually conservative: screenshots or route-by-route inspection should compare against `origin/nate` behavior before deeper backend integration changes.
- The backend contract should support richer profile pages without forcing the UI to know the Prisma schema.
- Media upload should not persist `blob:` URLs; durable media needs metadata and storage keys/URLs.
- Public profile reads should be cache-friendly, but profile edits and publish actions must be strongly authorized.
- Follows and cheers need idempotent operations so repeated clicks or retries do not duplicate rows.
- Dashboard completeness should be derived server-side from the same fields used by public profile pages.

---

## 6) Constraints, assumptions, dependencies

**Constraints:**
- Do not change the UI visuals or copy while importing from `origin/nate`.
- Do not duplicate API types in `app/` or `client/`; use `fad-common`.
- Do not run Prisma apply/reset/deploy/studio/validate/format commands. A draft migration can only be created with `npm run migrate:create --prefix app -- --name <migration_name>`.
- Do not hand-create or edit migration files.
- Do not deploy.
- Keep athlete onboarding and management minimalist for non-technical users.
- Preserve transparency, story-first ordering, and cost breakdowns.

**Assumptions:**
- `origin/nate` is the intended "NAIT/Nate" branch referenced by the user; no branch named `Tillson` exists locally or remotely after `git fetch --all --prune`.
- The customer-facing UI should remain ARC/Athlete ARC for now because the user explicitly said not to change the UI.
- Internal package names can remain `fad-*` during this task unless the user explicitly approves a broader rename.
- Crowdfunding remains non-live during this task, matching `origin/nate` support and terms pages.
- The first production data set can be seeded from the pilot roster represented by `client/lib/mockAthletes.ts` and `client/lib/athleteProfiles.ts`, but fixture seeding is separate from runtime API behavior.

**Dependencies (ordered):**
- Import and stabilize the client UI before backend integration changes.
- Define `common/` contracts before `app/` and `client/` consume them.
- Create Prisma schema changes before backend repository/service implementation.
- Implement backend APIs before replacing frontend fixtures with live calls.
- Run focused review skills and `$ci` (`/ci`) before final validation.

---

## 7) Requirements

**Functional requirements:**
- Public users can browse a runner-first athlete directory and open rich athlete profile pages.
- Public profile pages expose story, "The Arc" chapters, personal bests/stats, career highlights, previous races, roadmap/upcoming events, training snapshot, gallery/media, support readiness, recent backers where available, and share-card inputs.
- Athletes can sign up, build a draft profile, publish it, view a dashboard, and manage highlights, races, roadmap, and gallery content.
- Authenticated supporters can follow/unfollow athletes and view a following-filtered community feed.
- Community feed can show deterministic items derived from verified results, upcoming roadmap/events, and training/profile milestones.
- Campaign/backing surfaces can show itemized campaign cost lines and campaign summaries while payment actions remain disabled.
- Dashboard completeness reflects actual stored profile fields and edit state.
- Public routes handle missing athlete slugs with `notFound()` behavior.

**Non-functional requirements:**
- Directory and feed APIs must use cursor or limit-based pagination and indexed filters.
- Backend writes must be idempotent where users can retry: follow/unfollow, cheer/uncheer, publish, and profile section updates.
- Profile updates need ownership checks and conflict handling using `updatedAt` or an explicit version token.
- Backend services must avoid N+1 query patterns on directory and feed endpoints.
- File/media features must reject unsafe assumptions about browser-provided filenames, MIME types, and `blob:` URLs.
- Client Server Components should fetch durable data close to the route where possible, with Client Components limited to actual interactivity.
- Validation and error responses should be deterministic and user-safe.

---

## 8) Proposed approach

- Treat `origin/nate` as the UI/product fixture branch, not as production architecture.
- Import the `client/` UI first and refactor only implementation details that do not alter rendered UX.
- Establish a `client/lib/api/` boundary and a small compatibility mapper so UI components can gradually move from fixtures to backend DTOs.
- Expand `common/src/zod/` around view-oriented DTOs rather than exposing raw Prisma entities.
- Evolve Prisma around durable aggregates:
  - `AthleteProfile` for identity, status, story, values, sport, public URL fields, and publish state.
  - `AthleteStoryChapter` for the "The Arc" timeline.
  - `AthletePersonalBest` for stats with optional source URL and verification status.
  - `AthleteResult` for highlights and previous races with result text, source links, verification status, photos, and ordering.
  - `AthleteTrainingSnapshot` for MVP training summary fields.
  - `AthleteFollow` for follower graph.
  - `CommunityReaction` or equivalent for idempotent cheers against stable feed targets.
  - `MediaAsset` or extended `AthleteMedia` for hero/gallery/result/chapter media metadata.
- Preserve existing campaign/cost-line models and add only fields needed to support the support/backing preview safely.
- Implement backend routes by feature folders under `app/src/api/`, with repositories for every aggregate.
- Use read models or repository aggregate queries for directory and public profiles to avoid repeated per-row queries.
- Keep payment provider work behind a separate future task requiring `$provider-contract-verification` (`/provider-contract-verification`).

---

## 9) Data model and contracts

### OpenAPI changes

- No OpenAPI file exists today. API contracts are Zod-first in `common/src/zod/`.
- Add schemas for:
  - `publicAthleteProfileSchema`
  - `athleteProfileDraftSchema`
  - `upsertAthleteProfileDraftRequestSchema`
  - `publishAthleteProfileRequestSchema`
  - `athleteDashboardSchema`
  - `athletePersonalBestSchema`
  - `athleteResultSchema`
  - `athleteStoryChapterSchema`
  - `athleteTrainingSnapshotSchema`
  - `athleteMediaAssetSchema`
  - `followAthleteResponseSchema`
  - `communityFeedItemSchema`
  - `communityFeedQuerySchema`
  - `campaignSummarySchema`
- Existing schemas in `common/src/zod/athlete.ts`, `common/src/zod/campaign.ts`, `common/src/zod/event.ts`, and `common/src/zod/donation.ts` should be extended or composed rather than duplicated.

### Data model changes

- Add a profile status enum, likely `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Add publish metadata to `AthleteProfile`: `profileStatus`, `publishedAt`, `profileVersion` or equivalent optimistic concurrency token, optional `tagline`, optional `storyIntro`, optional `storyBody`, and optional `disciplineLabel`.
- Keep broad sport taxonomy in `SportCategory`; use a discipline/display label for exact UI text such as "Road Cycling" instead of overloading the enum.
- Add result and profile-section tables rather than storing all rich profile content as JSON.
- Add explicit sort-order fields for story chapters, personal bests, results, events/roadmap, and gallery assets.
- Add verification metadata: source URL, status, verifiedAt, and reviewer/system fields where needed.
- Add unique constraints for idempotency:
  - one follow row per `(userId, athleteId)`
  - one cheer/reaction row per `(userId, targetType, targetId)`
  - one profile per user
  - stable slugs for public profiles and campaigns
- Add indexes for directory filters, public slug lookup, follower lists, feed ordering, profile status, and athlete-owned child records.

### Example shapes

```json
{
  "athleteSlug": "cassandra-de-winter",
  "fullName": "Cassandra de Winter",
  "profileStatus": "PUBLISHED",
  "disciplineLabel": "Elite Endurance & Trail",
  "tagline": "Mother of three and ultra course-record holder chasing the Lost Soul 100-miler",
  "story": {
    "intro": "Mother of three, endurance athlete, and former national rugby player.",
    "body": ["Paragraph 1", "Paragraph 2"]
  },
  "personalBests": [
    {
      "personalBestId": "uuid",
      "label": "Marathon",
      "value": "2:34:43",
      "sourceUrl": "https://example.com/results",
      "verificationStatus": "VERIFIED"
    }
  ],
  "results": [
    {
      "athleteResultId": "uuid",
      "resultKind": "RACE",
      "title": "2026 Boston Marathon",
      "resultText": "1st Canadian Female — 2:34:43",
      "sourceLinks": [{ "label": "Official results", "href": "https://example.com/results" }]
    }
  ],
  "support": {
    "supportEnabled": false,
    "activeCampaigns": []
  }
}
```

---

## 10) Package-level impact

### common/

- Expand Zod schemas and exported types for the new MVP DTOs.
- Keep money in integer cents and dates as ISO strings.
- Add enums for profile status, result kind, verification status, feed kind/category, media role, reaction kind, and athlete level if used by the UI.
- Build `common/` before updating downstream packages.

### app/

- Add or expand API feature folders for athlete profiles, profile drafts/publish, media metadata, follows, community feed, and dashboard.
- Add repositories for new aggregates.
- Replace N+1 directory aggregates with grouped repository queries.
- Add idempotent service methods for follow/cheer/publish operations.
- Add ownership checks for all athlete management routes.
- Add request/response mappers that convert Prisma records into `fad-common` DTOs.
- Update `.env.example` only if new environment variables are introduced.

### client/

- Import `origin/nate` UI-specific changes and remove obsolete route surfaces as the branch does.
- Refactor large client files into smaller components only where visual output is preserved.
- Add typed API helpers and DTO-to-view mappers.
- Move durable data reads into Server Components where possible.
- Keep Client Components for forms, modals, share-card canvas, follows, cheers, and other browser-only interactions.
- Remove or isolate mock/localStorage modules so they are not mistaken for production persistence.

### cdk/

- No CDK implementation is planned in this task.
- If media storage becomes in scope later, it should be a separate infrastructure task with storage, access control, and lifecycle rules.

### docs/

- Update `docs/architecture.md` and `docs/product-brief.md` after implementation if they remain inaccurate.
- Decide whether to adopt `origin/nate` legal/business docs in a later docs step; they are useful context but not UI-specific.

---

## 11) Edge cases and error handling

- **Duplicate slug:** Reject with a typed conflict error and show a clear client-side message.
- **Publishing incomplete profiles:** Allow publish only when the minimum fields are present; return structured missing-field details.
- **Concurrent profile edits:** Reject stale updates with a conflict response when the version token or `updatedAt` no longer matches.
- **Follow/unfollow retries:** Treat follow as upsert and unfollow as delete-if-present.
- **Cheer retries:** Treat cheer as idempotent create/delete against a stable target.
- **Deleted or unpublished athlete:** Public profile returns not found; owner dashboard can still show draft/archived state.
- **Unsafe media URL or upload:** Reject invalid URLs and never persist `blob:` URLs.
- **Feed item disappears:** Client should handle stale reaction targets with a not-found response and refresh feed state.
- **Payment click while backing is disabled:** Keep support page and profile CTA honest; do not create donation/payment records.

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- Two users claiming the same slug must be resolved by the database unique constraint and mapped to a conflict error.
- Two profile edits from different tabs must not silently overwrite each other; use optimistic concurrency.
- Follow and cheer actions can be clicked repeatedly or retried; unique constraints and idempotent service methods prevent duplicates.
- Directory counts and follower counts can be eventually stale if cached, but user-facing state should settle after refresh.

**Idempotency and retries:**
- Publish can be called repeatedly and should return the already-published profile if the state is unchanged.
- Follow/unfollow and cheer/uncheer should be safe to retry.
- Profile section reordering should submit the full ordered list or use explicit version checks so stale reorder writes do not scramble order.

**Failure modes:**
- If the API is unavailable, public client pages should show deterministic error/loading states rather than falling back to stale localStorage as truth.
- If media upload/storage is unavailable, profile text/result edits should remain functional.
- If a migration cannot be created or reviewed safely, stop before implementation and report the blocker.

---

## 13) Operational readiness

**Observability:**
- Log request IDs, route names, authenticated user IDs where safe, and domain error classes.
- Do not log passwords, tokens, full request bodies, profile drafts, emails in bulk, or media URLs with sensitive tokens.
- Track operational metrics later for signup, publish, follow, feed read latency, profile update failures, and conflict responses.
- Add pagination limits to directory/feed endpoints to protect server and database resources.

---

## 14) Research and references

- Current repo docs: `docs/product-brief.md`, `docs/architecture.md`, `AGENTS.md`, `client/AGENTS.md`, `app/AGENTS.md`, `common/AGENTS.md`.
- Current contracts and data model: `common/src/zod/`, `app/prisma/schema.prisma`, `app/src/api/`, `app/src/repositories/`.
- Branch reviewed: `origin/nate` at `87abc138d28a0e3471c0ccad34dd69936645ff25`.
- Key redesigned UI files reviewed from `origin/nate`: `client/lib/mockAthletes.ts`, `client/lib/athleteProfiles.ts`, `client/lib/session.ts`, `client/lib/athleteEdits.ts`, `client/lib/follows.ts`, `client/lib/communityFeed.ts`, `client/app/register/_components/OnboardingContext.tsx`, `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx`, `client/app/(marketing)/dashboard/DashboardClient.tsx`, `client/app/(marketing)/community/CommunityClient.tsx`, `client/app/(marketing)/support/page.tsx`, `client/app/(marketing)/terms/page.tsx`, `client/app/(marketing)/privacy/page.tsx`.
- Next.js Server and Client Components docs, last updated June 23, 2026: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Fetching Data docs, last updated March 13, 2026: https://nextjs.org/docs/app/getting-started/fetching-data
- Next.js Route Groups docs, last updated June 16, 2025: https://nextjs.org/docs/app/api-reference/file-conventions/route-groups
- Prisma database connection management docs: https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections
- Prisma transactions, idempotent APIs, and optimistic concurrency control docs: https://www.prisma.io/docs/orm/prisma-client/queries/transactions
- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- OWASP Authentication Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- OWASP REST Security Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html

---

## 15) Open questions

- Should ARC/Athlete ARC become the canonical product and repo/docs/package naming, or should ARC remain customer-facing while internal packages remain `fad-*`?
- Is crowdfunding intended to remain platform-fee-free at launch, or will a platform/application fee or optional tip be introduced before payments go live?
- Should `origin/nate`'s added legal/business docs be adopted into `docs/` now, or kept out of this UI/backend alignment task until reviewed by the founders/legal counsel?
