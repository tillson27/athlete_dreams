# ARC Network

> The world's most transparent athlete funding network.

ARC connects athletes with the people, sponsors, and brands who want to back them. Three pillars:

1. **Crowdfunding** — athletes build a transparent profile with accomplishments, upcoming events, and cost breakdowns. Family, friends, and fans donate to specific events, gear, or travel — and get post-event updates.
2. **Corporate sponsorships** — companies discover athletes who align with their brand values and partner directly through the platform.
3. **Managed ambassador programs** — enterprises hand over ambassador discovery, intake, and management to FAD. We replace the spreadsheet-and-Instagram workflow with a structured pipeline.

We anchor on (1) to seed the network with athletes, then layer (2) and (3) as the directory grows.

## Repository Layout

- `client/` — Next.js 15 marketing site + app (React 19, Tailwind v4). The primary focus today.
- `app/` — Express 5 + Prisma backend foundation (TypeScript, tsyringe DI). Scaffolded; not feature-complete.
- `common/` — Shared Zod schemas and types published as `fad-common`.
- `cdk/` — Reserved for AWS CDK infrastructure (not yet implemented).
- `docs/` — Architecture notes and product references.
- `scripts/` — Sync scripts for AI instruction files and skills.
- `.ai/` — Source of truth for AI agent skills, prompts, and rules.
- `.claude/`, `.codex/` — Auto-generated mirrors of `.ai/skills/` (do not edit directly).

## Account Model

- **User** — every person on the platform.
- **Team** — supports individual athletes (one personal team per user) AND multi-member teams (e.g., a runner sharing fundraising with their coach/manager).
- No workspace tier — this product does not need workspace-level segmentation.

See `app/prisma/schema.prisma` for the canonical data model.

## Getting Started

```bash
npm install        # installs root + all workspaces
cp app/.env.example app/.env
cp client/.env.example client/.env
npm run dev        # runs app + client in parallel
```

- Client dev server: <http://localhost:3000>
- App dev server:    <http://localhost:4000>

**Marketing-site-only workflow.** Until Postgres is wired up, you can run just the client:

```bash
npm install
npm run dev:client
```

## Status

- `client/` — ✅ Marketing site live. Landing, athlete directory, athlete profile, brands, ambassadors, how-it-works, about, sign-in, sign-up. Uses `client/lib/mockAthletes.ts` for content.
- `app/` — ⏳ Foundation scaffolded (Express + Prisma + tsyringe DI, auth/users/teams/athletes/campaigns routes). Needs `npm install` and a Postgres database to run. No data yet.
- `common/` — ✅ Zod schemas defined and building cleanly.
- `cdk/` — ❌ Not yet started.

## Docs

- `docs/architecture.md` — system layout and request flow.
- `docs/product-brief.md` — product vision and differentiation.

## AI Contributor Guide

See `AGENTS.md` at the repo root. AGENTS.md is hierarchical — package-level `AGENTS.md` files inherit from root. Skills live in `.ai/skills/` (synced to `.claude/skills/` and `.codex/skills/`).
