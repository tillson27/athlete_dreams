# ARC Architecture Overview

A snapshot of how the codebase is organized today. Updated 2026-07-13 (against the `nate` integration branch).

## Workspaces

- **`client/`** — Next.js 15 App Router (React 19, Tailwind v4). Marketing site + the start of the authenticated experience. Today's priority.
- **`app/`** — Express 5 + Prisma backend. Scaffolded with the same Controller/Service/Repository pattern used in the parent emly repo. Currently covers auth, users, teams, athletes, and campaigns at the API layer.
- **`common/`** — Shared Zod schemas (published as `fad-common`). Single source of truth for request/response shapes.
- **`cdk/`** — Reserved for AWS CDK infrastructure. Not yet implemented.

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

## Site Layout (Frontend — `nate`)

Runner-first launch surface on `athletearc.ca` (the `/brands`, `/ambassadors`, `/presentation` corporate routes were removed):

- **Marketing:** `/` (story-led home), `/for-athletes` (recruiting), `/mission`, `/about`, `/how-it-works` (runners + followers personas), `/support` (backing preview — itemized cost lines, "coming soon"), `/terms`, `/privacy`.
- **Discovery:** `/athletes` (directory: discipline / level / region filters), `/athletes/[athleteSlug]` (rich profile: Arc chapters, verified results, highlights, roadmap), `/community` (feed: races / training / milestones, follows, cheers).
- **Athlete loop:** `/sign-up`, `/sign-in`, `/register` + 4-step `/register/{personal-basics,athletics,values-social,review}` onboarding, `/dashboard`, `/athletes/[athleteSlug]/manage` (editor).
- **SEO:** `sitemap.ts`, `robots.ts` (private routes disallowed), dynamic OG images, `metadataBase = https://athletearc.ca`.

All data is mock/localStorage by design: roster + rich profiles from `client/lib/{mockAthletes,athleteProfiles}.ts`; session, follows, cheers, onboarding drafts, and manage-editor edits in localStorage stores that each name their backend replacement. The seam-by-seam mapping to API phases lives in `docs/backend-build-sheet.md` → *Frontend contract alignment*.

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
3. **Email.** ✅ Decided: **Amazon SES** (AWS-native) — see build sheet Phase 4.
4. **CMS for athlete stories.** Open — today athletes write through forms in the app; consider a structured editor later.
