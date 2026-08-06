# ARC Architecture Overview

A snapshot of how the codebase is organized today. Updated 2026-07-13 (against the `nate` integration branch).

## Workspaces

- **`client/`** — Next.js 15 App Router (React 19, Tailwind v4). Marketing site + the start of the authenticated experience. Today's priority.
- **`app/`** — Express 5 + Prisma backend. Same Controller/Service/Repository pattern used in the parent emly repo. The Phase 0–1 read/write path is implemented and integration-tested: auth, users, teams, athletes (rich profile + directory), follows, community feed, campaigns, and health at the API layer.
- **`common/`** — Shared Zod schemas (published as `fad-common`). Single source of truth for request/response shapes.
- **`cdk/`** — AWS CDK v2 infrastructure (Network/Data/Api/Web stacks + CI/CD OIDC role, `test`/`prod` configs). Authored and synth-verified credential-free; deployment is user-executed (see `cdk/README.md`).

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

- `AthleteProfile` — public-facing athlete (slug, bio, sport, values, social links).
- `AthleteEvent` — upcoming races/competitions an athlete plans to attend.
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
- Health is split into `GET /v1/health/live` (process) and `GET /v1/health/ready` (DB `SELECT 1`, 503 when unreachable); the ALB targets `ready`.
- Directory and feed reads use opaque keyset pagination (`(createdAt desc, id desc)`, no OFFSET); directory and feed return **published athletes only**.

## Site Layout (Frontend — `nate`)

Runner-first launch surface on `athletearc.ca` (the `/brands`, `/ambassadors`, `/presentation` corporate routes were removed):

- **Marketing:** `/` (story-led home), `/for-athletes` (recruiting), `/mission`, `/about`, `/how-it-works` (runners + followers personas), `/support` (backing preview — itemized cost lines, "coming soon"), `/terms`, `/privacy`.
- **Discovery:** `/athletes` (directory: search + region filters with pagination), `/athletes/[athleteSlug]` (rich profile: Arc chapters, verified results, highlights, roadmap), `/community` (feed: races / training / milestones, follows, cheers).
- **Athlete loop:** `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password?token=...`, `/verify-email`, `/register` + 4-step `/register/{personal-basics,athletics,values-social,review}` onboarding, `/dashboard`, `/athletes/[athleteSlug]/manage` (editor).
- **SEO:** `sitemap.ts`, `robots.ts` (private routes disallowed), dynamic OG images, `metadataBase = https://athletearc.ca`.

Data source is flag-driven via `NEXT_PUBLIC_DATA_SOURCE` (`api` default, explicit `mock` for static previews). In `mock` mode all data is mock/localStorage: roster + rich profiles from `client/lib/{mockAthletes,athleteProfiles}.ts`; session, follows, cheers, onboarding drafts, and manage-editor edits in localStorage stores that each name their backend replacement. In `api` mode the read surfaces (directory, profile, community) **and the authenticated write surfaces** are real against `GET/POST/PATCH/PUT /v1/…` via `client/lib/api.ts`; API loading and failures render loading/error/empty states instead of substituting fixtures. Sessions (`lib/session.ts`) are access-token-only, token + user in `arc-auth` localStorage, validated on mount via `GET /v1/users/me`. Email verification and password reset are Resend-backed, follows are server-persisted, anonymous onboarding is gated through auth with a return destination, and the 4-step onboarding wizard persists server-side. Static exports that cannot depend on the API set mock explicitly. The seam-by-seam mapping to API phases lives in `docs/backend-build-sheet.md` → *Frontend contract alignment*.

**Known static-export boundary (api mode):** the client still ships as a static export, so `/athletes/[athleteSlug]` pages are pre-rendered from the mock roster via `generateStaticParams`. A newly-created api-mode athlete's *dedicated profile page* therefore 404s in the static export (its slug wasn't in the build-time roster); the directory (`/athletes`), the dashboard, and the profile **API** (`GET /v1/athletes/{slug}`) are unaffected and reflect the new athlete immediately. This resolves when the client moves to SSR/ISR — see `docs/infrastructure-and-scaling.md` → *Stage 2 — Growth* (SSR/ISR for athlete-profile SEO).

## AI Toolkit

- `.ai/skills/` — Source of truth for all Claude/Codex skills.
- `.claude/skills/` and `.codex/skills/` — Auto-generated mirrors. Do not edit directly.
- `scripts/sync-skills-folders.js` — Rebuilds the mirrors.
- `scripts/sync-agents-instructions.js` — Stamps the precedence header onto every `AGENTS.md` and writes a `CLAUDE.md` / `GEMINI.md` pointer next to each.
- `scripts/check-expired-rules.js` — Fails the build if an `EXPIRES: YYYY-MM-DD` marker in `AGENTS.md` has passed.

## Open Questions / Next Up

Implementation and hosting are now planned in detail — see `docs/backend-build-sheet.md` (per-file plan, Phases 0–4 + Infra & Deploy) and `docs/infrastructure-and-scaling.md` (AWS design, cost levers, scaling stages).

1. **Payments provider.** ✅ Decided: **Stripe Connect (Express)** — see build sheet Phase 2. First-time athlete onboarding handled via Stripe hosted account links.
2. **Hosting.** ✅ Decided: **AWS via CDK v2** — ECS Fargate + ALB (API), RDS PostgreSQL (Multi-AZ toggle), S3 + CloudFront (client). See `docs/infrastructure-and-scaling.md`.
3. **Email.** ✅ Decided: **Resend for current verification/reset emails**; SES remains an optional AWS-native sender later — see build sheet Phase 4.
4. **CMS for athlete stories.** Open — today athletes write through forms in the app; consider a structured editor later.
