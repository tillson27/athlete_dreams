> **`AGENTS.md` Instruction Precedence (DO NOT EDIT)**
>
> Hierarchical and additive — apply this file plus all parent `AGENTS.md` files up to repo root. Most specific wins on conflict.
>
> **Chain:** `app/AGENTS.md` _(this file)_ > `AGENTS.md` _(root)_

---

# app/ — Backend API

Express 5 + TypeScript + tsyringe DI + Prisma. Mirrors the pattern used in the parent emly repo (HTTP → Router → Controller → Service → Repository), tailored to FAD's domain.

## Folder Layout

- `src/index.ts` — App entry point. Loads `.env`, configures the DI container, mounts routers, starts the HTTP server.
- `src/shared/` — Cross-cutting primitives:
  - `BaseRouterFactory.ts` — base class for each feature router factory.
  - `ResponseHandler.ts` — uniform success/error response shape.
  - `errors.ts` — domain error classes (`NotFoundError`, `ValidationError`, `UnauthorizedError`, etc.).
  - `requestParsers.ts` — Zod-backed `parseRequestBody`, `parseRequestParams`, `parseRequestQuery`.
- `src/services/infrastructure/` — Reusable services (PrismaService, JwtService, PasswordHashService, Logger).
- `src/middleware/` — Auth middleware, request-id middleware, error handler.
- `src/repositories/` — Per-aggregate Prisma access (UserRepository, TeamRepository, AthleteRepository, CampaignRepository, DonationRepository).
- `src/api/<feature>/` — Per-feature folder: `<Feature>RouterFactory.ts`, `<Feature>Controller.ts`, `<Feature>Service.ts`, optional `contracts.ts`.

## Request Flow

`HTTP → Router → Controller (parse + auth gates) → Service (business logic) → Repository (Prisma) → DTO mapper → ResponseHandler`

## Rules

- **[STRICT]** Import all API request/response types from `fad-common`. Never duplicate them in `app/`.
- **[STRICT]** All Prisma access is funneled through repositories. Controllers and services must never `import { PrismaClient }` directly.
- **[STRICT]** Throw typed domain errors (`NotFoundError`, etc.); the global error middleware translates them to HTTP responses.
- **[STRICT]** Never log secrets, tokens, password hashes, or full request bodies.
- **[GUIDELINE]** Keep controllers thin — parse, gate, delegate. Business logic belongs in the service.
- **[GUIDELINE]** Each new entity gets a Repository even if there is only one caller — the indirection is the contract.
