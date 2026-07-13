# ARC MVP Platform Alignment - Steps 11-12

## Step 11 - Update Docs, Seeds, and Operational Guardrails

### Metadata
**Status:** Incomplete
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
- [ ] Architecture docs updated or cross-referenced
- [ ] Product docs updated without duplication
- [ ] Seed/demo data decision implemented
- [ ] `.env.example` files updated if needed
- [ ] `$e2e-review` (`/e2e-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 12 - Final Validation & Cleanup

### Metadata
**Status:** Incomplete
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
* [ ] Confirm all prior steps are complete
* [ ] Review and resolve any outstanding TODOs introduced during this task
* [ ] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [ ] Run the `$ci` (`/ci`) skill and confirm it passes
- [ ] Fix any issues caused by `$ci` (`/ci`)
* [ ] Update task metadata in the steps docs and the steps guide index
* [ ] Move `.ai/tasks/2026-07-13/arc-mvp-platform-alignment/` to `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/`
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
