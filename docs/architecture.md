# FAD Architecture Overview

A snapshot of how the codebase is organized today. Updated 2026-05-19.

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

## Marketing Site Layout (Frontend)

- `/` — Landing (hero, three pillars, athlete spotlights, transparency pitch, athlete CTA).
- `/athletes` — Directory with sport filter.
- `/athletes/[athleteSlug]` — Athlete profile with campaigns and itemized cost breakdowns.
- `/brands` — Marketing page for corporate sponsors.
- `/ambassadors` — Marketing page for managed ambassador programs.
- `/how-it-works` — Persona breakdown (athletes, supporters, brands).
- `/about` — Company values + contact.
- `/sign-in`, `/sign-up` — Auth forms.

Data on the directory and profile pages currently comes from `client/lib/mockAthletes.ts`. Replacing that with `fetch(`${API_BASE_URL}/v1/athletes`)` is the next step once the backend is deployed.

## AI Toolkit

- `.ai/skills/` — Source of truth for all Claude/Codex skills.
- `.claude/skills/` and `.codex/skills/` — Auto-generated mirrors. Do not edit directly.
- `scripts/sync-skills-folders.js` — Rebuilds the mirrors.
- `scripts/sync-agents-instructions.js` — Stamps the precedence header onto every `AGENTS.md` and writes a `CLAUDE.md` / `GEMINI.md` pointer next to each.
- `scripts/check-expired-rules.js` — Fails the build if an `EXPIRES: YYYY-MM-DD` marker in `AGENTS.md` has passed.

## Open Questions / Next Up

1. **Payments provider.** Stripe Connect is the obvious choice for "money goes to the athlete," but we need to scope the onboarding burden for first-time athletes.
2. **Hosting.** Vercel for the client + Fly.io/Render for the API is the cheapest path to live, but CDK is wired into emlyreal for a reason — revisit before scaling.
3. **Email.** Resend for transactional + Postmark for donation receipts is a good default.
4. **CMS for athlete stories.** Today athletes write through forms in the app; consider a structured editor later.
