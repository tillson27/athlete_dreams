# Arc Editor — Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-08-16/arc-editor/arc-editor-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-1-5.md`
- `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-6-7.md`

**Coordination rule:** Each step is completed by one agent using the `$step-execution` (`/step-execution`) skill.
Do not start a step until all the **Prereqs:** for that step are completed.

> **NOTE:** Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
> Ignore unrelated changes from other agents. If their changes affect your work (e.g., new conflicts, shifted patterns, or shared code), adapt as needed to integrate cleanly or fix issues as they arise.

**Dependency rules:**
- Steps with dependencies must explicitly list them in **Prereqs** and appear after their prerequisites in the index.
- Steps with no dependencies use **Prereqs: None** — this is expected and valid. Place them wherever makes logical sense.
- Independent steps (Prereqs: None) can run in parallel if multiple agents are available.

---

## Step index

| Step | Name | Status | Owner | Doc |
| --- | --- | --- | --- | --- |
| 1 | Common Zod schemas for Arc | Incomplete | ai | `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-1-5.md` |
| 2 | Prisma migration — ArcChapter model | Incomplete | ai | `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-1-5.md` |
| 3 | Backend Arc API endpoint | Incomplete | ai | `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-1-5.md` |
| 4 | Client API helper + adapter update | Incomplete | ai | `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-1-5.md` |
| 5 | Dedicated Arc editor page | Incomplete | ai | `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-1-5.md` |
| 6 | Manage page integration | Incomplete | ai | `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-6-7.md` |
| 7 | Final validation & cleanup | Incomplete | ai | `.ai/tasks/2026-08-16/arc-editor/arc-editor-steps-6-7.md` |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step is always validation and must live in the last steps doc.
