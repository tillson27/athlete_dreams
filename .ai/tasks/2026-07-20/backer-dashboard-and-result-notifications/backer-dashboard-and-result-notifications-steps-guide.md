# Backer Dashboard and Race Result Notifications - Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-1-5.md`
- `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-6-10.md`
- `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-11-13.md`

**Coordination rule:** Each step is completed by one agent using the `$step-execution` (`/step-execution`) skill.
Do not start a step until all the **Prereqs:** for that step are completed.

> **NOTE:** Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
> Ignore unrelated changes from other agents. If their changes affect your work (e.g., new conflicts, shifted patterns, or shared code), adapt as needed to integrate cleanly or fix issues as they arise.

**Dependency rules:**
- Steps with dependencies must explicitly list them in **Prereqs** and appear after their prerequisites in the index.
- Steps with no dependencies use **Prereqs: None**—this is expected and valid. Place them wherever makes logical sense.
- Independent steps (Prereqs: None) can run in parallel if multiple agents are available.

**Environment note (applies to every step):** this machine has no reachable Postgres. Export a placeholder `DATABASE_URL='postgresql://fad:fad@localhost:5432/fad_dev?schema=public'` before running app tests, or three test files stall at import. DB-backed suites are `RUN_DB_TESTS`-gated and skip cleanly. **AI must not draft or apply the Prisma migration** — that is an owner follow-up recorded in Step 1.

**[CRITICAL] Identity-churn constraint — read before touching Steps 3-5.** Two shipped write paths are delete-all-then-recreate:
- `AthleteRepository.replaceRaceResults` (`app/src/repositories/AthleteRepository.ts:267-291`) — race result ids and `createdAt` churn on every profile save.
- `AthleteRepository.replaceRoadmapEvents` (`app/src/repositories/AthleteRepository.ts:294-316`) — **athlete event ids churn on every roadmap save**, which additionally nulls `Campaign.athleteEventId` (`onDelete: SetNull`) and would null this task's new `AthleteRaceResult.athleteEventId`.

The second one is a pre-existing data-loss bug affecting the already-shipped crowdfunding work, and it invalidates any design that assumes a stable `athleteEventId`. **Step 3 fixes it and is a hard prerequisite for the fan-out in Step 5.** See context §5.

**Ordering note:** Prisma schema (Step 1) comes before the Zod contracts (Step 2) on purpose. The contract change makes `athleteEventId` non-optional on `athleteRaceResultSchema`, which breaks the type of `toRaceResultDto` in `app/src/api/athletes/AthleteService.ts:332-344`; that mapper cannot be fixed until the field exists on the generated Prisma client. Landing the contracts first leaves `npm run ci` red. Step 2 therefore includes the mapper fix, so no step ends on a broken build.

---

## Step index

| Step | Name | Status | Owner | Doc |
| --- | --- | --- | --- | --- |
| 1 | Prisma schema: result→event link, event completion, `BackerNotification` | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-1-5.md` |
| 2 | Contracts: race-result event link, backer, and notification Zod schemas | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-1-5.md` |
| 3 | **Stabilize athlete event identity** (fixes live campaign→event data loss) | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-1-5.md` |
| 4 | Repositories: backer aggregates, notifications, result link, donation claim | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-1-5.md` |
| 5 | Result→event link on the races write path + backer fan-out | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-1-5.md` |
| 6 | Donation-succeeded notification + `SUPPORTER` role + guest donation claim | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-6-10.md` |
| 7 | Backer dashboard aggregate API | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-6-10.md` |
| 8 | Backer result log + notifications list/read API | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-6-10.md` |
| 9 | Client data layer: API helpers, mock fixtures, loaders, hooks | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-6-10.md` |
| 10 | Client: backer dashboard page (`/backers`) | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-6-10.md` |
| 11 | Client: result log page + header notification bell | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-11-13.md` |
| 12 | Client: athlete event picker, share graphic, guest sign-up prompt | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-11-13.md` |
| 13 | Final validation & cleanup (required, always last) | Incomplete | claude | `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/backer-dashboard-and-result-notifications-steps-11-13.md` |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step is always validation and must live in the last steps doc.
