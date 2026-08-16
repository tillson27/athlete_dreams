# Admin Portal - Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-1-5.md`
- `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-6-10.md`

**Coordination rule:** Each step is completed by one agent using the `$step-execution` (`/step-execution`) skill.
Do not start a step until all the **Prereqs:** for that step are completed.

> **NOTE:** Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
> Ignore unrelated changes from other agents. If their changes affect your work (e.g., new conflicts, shifted patterns, or shared code), adapt as needed to integrate cleanly or fix issues as they arise.

**Dependency rules:**
- Steps with dependencies must explicitly list them in **Prereqs** and appear after their prerequisites in the index.
- Steps with no dependencies use **Prereqs: None**—this is expected and valid. Place them wherever makes logical sense.
- Independent steps (Prereqs: None) can run in parallel if multiple agents are available.

---

## Step index

| Step | Name | Status | Owner | Doc |
| --- | --- | --- | --- | --- |
| 1 | Common schemas — admin Zod contracts + `isAdmin` on AuthSession | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-1-5.md` |
| 2 | Backend — admin middleware + role infrastructure + `isAdmin` in sign-in | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-1-5.md` |
| 3 | Backend admin API — users + analytics routes | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-1-5.md` |
| 4 | Backend admin API — athletes + campaigns + donations routes | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-1-5.md` |
| 5 | DB migration + allowlist API | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-1-5.md` |
| 6 | Client — session update + admin guard + layout | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-6-10.md` |
| 7 | Client — analytics dashboard page | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-6-10.md` |
| 8 | Client — admin users pages (list + detail) | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-6-10.md` |
| 9 | Client — admin athletes + campaigns + donations + allowlist pages | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-6-10.md` |
| 10 | Final validation & cleanup | Complete | ai | `.ai/tasks/2026-08-16/completed/admin-portal/admin-portal-steps-6-10.md` |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step (10) is always validation and lives in the last steps doc.
