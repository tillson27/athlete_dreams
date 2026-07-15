# ARC Network

> The world's most transparent athlete funding network.

ARC connects athletes with the people, sponsors, and brands who want to back them. Three pillars:

1. **Crowdfunding** — athletes build a transparent profile with accomplishments, upcoming events, and cost breakdowns. Family, friends, and fans donate to specific events, gear, or travel — and get post-event updates.
2. **Corporate sponsorships** — companies discover athletes who align with their brand values and partner directly through the platform.
3. **Managed ambassador programs** — enterprises hand over ambassador discovery, intake, and management to FAD. We replace the spreadsheet-and-Instagram workflow with a structured pipeline.

We anchor on (1) to seed the network with athletes, then layer (2) and (3) as the directory grows.

## Repository Layout

- `client/` — Next.js 15 marketing site + app (React 19, Tailwind v4). The primary focus today.
- `app/` — Express 5 + Prisma backend (TypeScript, tsyringe DI). Phase 0–1 read/write path implemented and tested; later phases (donations, lifecycle, teams) not yet built.
- `common/` — Shared Zod schemas and types published as `fad-common`.
- `cdk/` — AWS CDK v2 infrastructure (Network/Data/Api/Web + CI/CD). Authored; deployment is user-executed.
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
npm run db:setup   # starts local Postgres, applies migrations, seeds demo data
npm run dev        # starts local Postgres, then runs app + client in parallel
```

- Client dev server: <http://localhost:3000>
- App dev server:    <http://localhost:4000>
- Local Postgres:    `localhost:5432` (`fad` / `fad`, database `fad_dev`)

**Marketing-site-only workflow.** Until Postgres is wired up, you can run just the client:

```bash
npm install
npm run dev:client
```

## Status

- `client/` — ✅ Marketing site live (landing, athlete directory, athlete profile, how-it-works, about, sign-in, sign-up). Dual-mode: mock/localStorage by default, or live API via `NEXT_PUBLIC_DATA_SOURCE=api`.
- `app/` — ✅ Phase 0–1 API implemented and integration-tested (auth, users, teams, athletes read/write + publish, follows, community feed, campaigns, health). Runs on `npm install` + a seeded Postgres.
- `common/` — ✅ Zod schemas defined and building cleanly.
- `cdk/` — 🟡 Stacks authored + synth-verified credential-free (Network/Data/Api/Web + CI/CD OIDC). Deployment is user-executed (see `cdk/README.md`).

## Docs

- `docs/architecture.md` — system layout and request flow.
- `docs/product-brief.md` — product vision and differentiation.

## AI Contributor Guide

See `AGENTS.md` at the repo root. AGENTS.md is hierarchical — package-level `AGENTS.md` files inherit from root. Skills live in `.ai/skills/` (synced to `.claude/skills/` and `.codex/skills/`).
