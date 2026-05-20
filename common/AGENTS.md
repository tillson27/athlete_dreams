> **`AGENTS.md` Instruction Precedence (DO NOT EDIT)**
>
> Hierarchical and additive — apply this file plus all parent `AGENTS.md` files up to repo root. Most specific wins on conflict.
>
> **Chain:** `common/AGENTS.md` _(this file)_ > `AGENTS.md` _(root)_

---

# common/ — Shared Schemas Package

This package (`fad-common`) is the single source of truth for request/response shapes and shared domain types.

## What lives here

- `src/zod/` — Zod schemas for every API contract (request, response, query, params).
- `src/types/` — Plain TypeScript types/enums derived from or shared with Zod (e.g. role enums).
- `src/index.ts` — Public barrel export.

## Rules

- **[STRICT]** Every API request/response shape is defined here first, then consumed by `app/` and `client/`. Never duplicate.
- **[STRICT]** Run `npm run build --prefix common` after changing schemas so the workspace consumers see fresh types.
- **[GUIDELINE]** Prefer `z.object({ ... }).strict()` for request bodies to surface unknown keys.
- **[GUIDELINE]** Use ISO-8601 strings for dates in transport (`z.string().datetime()`) and convert to `Date` at the boundary.
- **[GUIDELINE]** Money values travel as integer cents (`z.number().int().nonnegative()`); never floating-point dollars.
