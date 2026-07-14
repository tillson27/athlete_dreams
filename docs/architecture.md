# FAD Architecture Overview

A snapshot of how the codebase is organized today. Updated 2026-07-14.

## Workspaces

- **`client/`** — Next.js 15 App Router (React 19, Tailwind v4). Marketing site + the start of the authenticated experience. Today's priority.
- **`app/`** — Express 5 + Prisma backend. Uses the same Controller/Service/Repository pattern used in the parent emly repo. Covers auth, users, teams, athlete profiles, campaigns, follows, community feed, and dashboard data at the API layer.
- **`common/`** — Shared Zod schemas (published as `fad-common`). Single source of truth for request/response shapes.
- **`cdk/`** — AWS CDK v2 hosting baseline for the dynamic Next app, Express API, private Postgres data tier, and CloudFront edge entry point.

## Account Model

```
User
  └── TeamMembership (one or more)
        └── Team
              ├── isPersonal: true  (auto-created on sign-up)
              └── isPersonal: false (multi-member team — athlete + coach, athlete + manager)
```

- **No workspace tier.** This product does not need workspace-level segmentation.
- An athlete is a `User` with an associated `AthleteProfile` row.
- Brands are modeled separately (`Brand` + `BrandMembership`) so an individual can belong to both team and brand orgs.

## Domain Aggregates

- `AthleteProfile` — public-facing and draft athlete profile state: slug, story, sport, values, social links, publish status, support readiness, and profile versioning.
- `AthleteStoryChapter`, `AthletePersonalBest`, `AthleteResult`, `AthleteTrainingSnapshot`, and `AthleteMedia` — structured profile sections for the story-first public profile and management editor.
- `AthleteEvent` — upcoming races/competitions an athlete plans to attend.
- `AthleteFollow` and `CommunityReaction` — follower graph and idempotent feed reactions.
- `Campaign` — a fundraising campaign tied to an athlete and optionally to an event. Has itemized `CampaignCostLine` rows for transparency.
- `Donation` — supporter contribution to a campaign.
- `Brand` + `SponsorshipInquiry` — inbound interest from a brand to an athlete.
- `AmbassadorProgram` + `AmbassadorApplication` — managed ambassador funnels for enterprise brands.

See `app/prisma/schema.prisma` for the full schema.

## Request Flow (Backend)

```
HTTP → Express Router → <Feature>RouterFactory
                    → <Feature>Controller (parse + auth gates)
                    → <Feature>Service (business logic)
                    → <Feature>Repository (Prisma access)
                    → DTO mapper
                    → ResponseHandler
```

- All Zod schemas live in `common/src/zod/`.
- Controllers parse `req.body` / `req.query` / `req.params` through `parseRequestBody` etc.
- The global `errorHandler` middleware translates `DomainError` subclasses into HTTP responses.
- Route factories are registered directly in `app/src/index.ts`; there is no separate router loader or dependency-injector file.

## MVP API Surface

- `/v1/auth` handles sign-up and sign-in and returns the backend `AuthSession` used by the client session layer.
- `/v1/athletes` handles public directory/profile reads, authenticated draft/publish operations, profile child edits, follow/unfollow, and dashboard data.
- `/v1/campaigns` handles campaign reads and campaign creation for authenticated athletes; live donation checkout remains out of scope.
- `/v1/community` handles paginated feed reads and idempotent cheer/uncheer reactions.

## Operational Guardrails

- API request bodies are limited to `1mb` in `app/src/index.ts`.
- Directory queries are bounded by `common/src/zod/athlete.ts` to at most 100 athletes per page.
- Community feed queries are bounded by `common/src/zod/community.ts` to at most 50 items per page and a 512-character cursor.
- Profile draft and child-section payloads are bounded in `common/src/zod/athlete.ts`; large lists such as results, roadmap events, media assets, and reordered child IDs have explicit maximum counts.
- Media and source-link fields use HTTP(S)-only URL schemas for MVP persistence. Browser `blob:` URLs are preview-only in the client and must not become durable profile data.
- Auth-sensitive routes require bearer-token authentication through `AuthenticationMiddleware`; public profile and feed routes may use optional auth only to personalize viewer state.
- Profile edits and child mutations use profile-version checks so stale tabs cannot silently overwrite newer data.
- Follow/unfollow, publish, and community reactions are designed to be retry-safe and backed by unique constraints or idempotent service behavior.
- Request IDs are attached to responses and backend logs. Passwords, tokens, full request bodies, profile drafts, bulk emails, and sensitive media URLs must not be logged.

## Hosting Baseline

The current AWS target is a lean container baseline rather than static hosting. GitHub Pages/static export is no longer a fit because the client uses dynamic Next.js routes and the product depends on the Express API.

- The Next app and Express API are packaged as separate Docker images from the monorepo, with `common/` built first so both services consume the shared contracts.
- AWS CDK composes a public edge and load-balancing layer in front of private ECS Fargate services. CloudFront caches immutable Next static assets while dynamic app and API requests use conservative/no caching.
- The API and client share one public application load balancer. `/v1/*` routes to the API service; the default target is the Next service. Health checks are `/v1/health` and `/health`.
- Postgres runs as private RDS with generated credentials in Secrets Manager. Production enables an RDS Proxy to reduce connection pressure as ECS tasks scale.
- Runtime secrets stay in Secrets Manager and task secret injection. Plain task environment is limited to non-secret runtime configuration such as ports, log level, API host, and database host/name metadata.
- The baseline intentionally does not include Redis, queues, schedulers, CMS media buckets, or uploaded-media storage until product code needs those capabilities.

## Marketing Site Layout (Frontend)

- `/` — Landing (hero, three pillars, athlete spotlights, transparency pitch, athlete CTA).
- `/athletes` — Runner-first directory with sport, level, region, and search filters.
- `/athletes/[athleteSlug]` — Rich public athlete profile with story, arc chapters, results, roadmap, media, follows, and support readiness.
- `/athletes/[athleteSlug]/manage` — Authenticated profile management for highlights, previous races, roadmap, and media metadata.
- `/community` — Community feed from verified results, upcoming events, training snapshots, and profile milestones.
- `/dashboard` — Authenticated athlete dashboard with profile completion, quick actions, and draft preview.
- `/support` — Support/backing preview while live payments remain out of scope.
- `/for-athletes` — Athlete-focused marketing page.
- `/how-it-works` — Persona breakdown (athletes, supporters, brands).
- `/mission` — Company mission and product stance.
- `/about` — Company values + contact.
- `/sign-in`, `/sign-up` — Auth forms.
- `/register` — Athlete onboarding flow.

Directory, public profile, dashboard, community feed, follow, cheer, profile-management, sign-in, sign-up, and onboarding surfaces read and write through typed helpers in `client/lib/api/` against the `/v1/auth`, `/v1/athletes`, and `/v1/community` backend APIs. The MVP session layer stores the backend `AuthSession` bearer token in the browser, clears expired sessions client-side, and uses local browser storage only for real auth state plus a non-authoritative unsaved onboarding draft backup; the profile draft source of truth is `/v1/athletes/me/draft`.

## Demo Data and Branch Docs

- `client/lib/dev-fixtures/` keeps the imported pilot roster/profile examples as development seed/reference data only. Production routes should not import it as runtime truth.
- There is no backend seed script yet. If the pilot roster becomes seed data, it should be mapped into the backend contracts and Prisma schema through a separate reviewed task.
- The `origin/nate` legal/business reference docs are not part of the implementation docs in this repo. Incorporation, trademark, terms, and payment-flow legal work should be reviewed separately before importing or publishing that content.

## AI Toolkit

- `.ai/skills/` — Source of truth for all Claude/Codex skills.
- `.claude/skills/` and `.codex/skills/` — Auto-generated mirrors. Do not edit directly.
- `scripts/sync-skills-folders.js` — Rebuilds the mirrors.
- `scripts/sync-agents-instructions.js` — Stamps the precedence header onto every `AGENTS.md` and writes a `CLAUDE.md` / `GEMINI.md` pointer next to each.
- `scripts/check-expired-rules.js` — Fails the build if an `EXPIRES: YYYY-MM-DD` marker in `AGENTS.md` has passed.

## Open Questions / Next Up

1. **Payments provider.** Stripe Connect is the obvious choice for "money goes to the athlete," but we need to scope the onboarding burden for first-time athletes.
2. **Email.** Resend for transactional + Postmark for donation receipts is a good default.
3. **CMS for athlete stories.** Today athletes write through forms in the app; consider a structured editor later.
