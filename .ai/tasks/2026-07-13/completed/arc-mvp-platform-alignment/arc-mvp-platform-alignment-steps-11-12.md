# ARC MVP Platform Alignment - Steps 11-12

## Step 11 - Update Docs, Seeds, and Operational Guardrails

### Metadata
**Status:** Complete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
**Size:** medium
**Owner:** AI agent

### Context

**Objective:** Bring supporting docs, seed/demo data, examples, and operational guardrails into alignment with the implemented MVP platform.

**Done When:**
- `docs/architecture.md` reflects the actual backend route registration, profile/domain aggregates, and client route groups.
- `docs/product-brief.md` is updated or cross-referenced without duplicating existing product context.
- Any accepted branch docs from `origin/nate` are either intentionally imported or explicitly left for a separate reviewed task.
- Seed/demo data exists only where useful for local development and is not used as production runtime truth.
- `.env.example` files are updated if new environment variables were introduced.
- Operational limits for payload sizes, pagination, media metadata, and auth-sensitive routes are documented in code or docs where needed.

**References:**
- Context sections 2, 4, 10, 13, 14, 15
- `docs/architecture.md`
- `docs/product-brief.md`
- `app/.env.example`
- `client/.env.example`
- `client/lib/mockAthletes.ts`
- `client/lib/athleteProfiles.ts`
- `origin/nate:docs/business/incorporation-and-finances.md`
- `origin/nate:docs/reference/trademark-brief.md`

### Plan

- Search docs for stale FAD/ARC architecture claims and update only contradictions introduced by this task.
- Avoid copying the same product information into multiple docs; cross-reference instead.
- Decide whether pilot roster data should become a backend seed script or remain fixture-only for tests/dev.
- Add environment variable examples for any new API base URL, auth, storage, or feature flags.
- Review request limits and route-level authorization decisions against implementation.

### Step checklist
- [x] Architecture docs updated or cross-referenced
- [x] Product docs updated without duplication
- [x] Seed/demo data decision implemented
- [x] `.env.example` files updated if needed
- [x] `$e2e-review` (`/e2e-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Updated `docs/architecture.md` for the implemented MVP route registration, API surface, domain aggregates, client route groups, operational limits, auth guardrails, media URL policy, request logging expectations, dev-fixture policy, and `origin/nate` legal/business doc decision.
- Updated `docs/product-brief.md` with a short current-MVP state section that cross-references `docs/architecture.md` and removed the fixed 3% crowdfunding fee claim until live payments are scoped.
- Left `origin/nate:docs/business/incorporation-and-finances.md` and `origin/nate:docs/reference/trademark-brief.md` out of `docs/` intentionally because they need separate founder/legal review before becoming repo documentation.
- Kept the pilot roster/profile examples isolated under `client/lib/dev-fixtures/` as development seed/reference data only; no backend seed script was added.
- Confirmed no new environment variables were introduced, so `app/.env.example` and `client/.env.example` did not need changes.
- Updated `client/AGENTS.md` so frontend routing and `client/lib/` guidance matches the current `(marketing)`, `register/`, `client/lib/api/`, and `client/lib/dev-fixtures/` structure.
- Ran the `$doc-alignment` (`/doc-alignment`) workflow over the Step 11 docs and implementation surface.
- Ran the `$e2e-review` (`/e2e-review`) workflow with delegated backend and frontend checks. Fixed the backend findings by making publish retry-safe for already-published profiles, assigning request IDs before JSON parsing, and sanitizing unhandled error logs so parser bodies are not logged.
- Fixed payment/readiness copy in `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` and `client/app/(marketing)/support/page.tsx` so the UI does not imply live donations or a finalized platform fee.
- Ran focused checks: `npm run type-check --prefix app`, `npm run lint --prefix app`, and `npm run type-check --prefix client`; all passed.
- Ran the `$ci` (`/ci`) skill with `npm run ci`; it passed. Existing warnings remain for the app ESLint config module type, deprecated `next lint`, and the `task-planning` skill soft-limit notice.

---

## Step 12 - Final Validation & Cleanup

### Metadata
**Status:** Complete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
**Owner:** AI agent

### Context

**Objective:** Validate the full imported UI and backend alignment end-to-end, clean up task metadata, and ensure no task-specific loose ends remain.

**Done When:**
- All prior steps are complete.
- `$e2e-review` (`/e2e-review`) confirms the frontend, backend, contracts, and data model line up with the context doc.
- `$ci` (`/ci`) passes from the repo root.
- Task metadata is updated and the task directory is moved to completed.

**References:**
- Context document
- Steps guide
- Steps 1-11
- `AGENTS.md`

### Final Step Checklist
* [x] Confirm all prior steps are complete
* [x] Review and resolve any outstanding TODOs introduced during this task
* [x] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [x] Run the `$ci` (`/ci`) skill and confirm it passes
- [x] Fix any issues caused by `$ci` (`/ci`)
* [x] Update task metadata in the steps docs and the steps guide index
* [x] Move `.ai/tasks/2026-07-13/arc-mvp-platform-alignment/` to `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/`
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

### Completion notes

- Confirmed Steps 1-11 are marked complete in the steps guide and steps docs.
- Reviewed outstanding TODO-style markers with `rg`; no task-introduced code TODOs remained. The only match was this checklist item, plus a package-lock integrity hash containing `XXX`.
- Ran the `$e2e-review` (`/e2e-review`) workflow across auth, draft/publish, public profile, directory, follows, community feed/reactions, dashboard, campaign support readiness, docs, and task cleanup.
- Delegated the backend `$backend-review` (`/backend-review`) pass; it found no critical backend/API findings and made no backend edits.
- Delegated the frontend `$frontend-review` (`/frontend-review`) pass; it aligned `client/lib/api/athletes.ts` to parse the shared `athleteDirectoryResponseSchema` while preserving the current directory UI return shape.
- Ran the `$doc-alignment` (`/doc-alignment`) workflow over the implementation docs. No `docs/` contradictions remained; the privacy page copy was updated to match backend-backed profile/follow persistence and non-authoritative local draft backup behavior.
- Ran the `$ci` (`/ci`) skill with `npm run ci`; it passed. Existing warnings remain for the app ESLint config module type, deprecated `next lint`, and the `task-planning` skill soft-limit notice.
- Updated the task metadata and moved the task folder to `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/`.
