# ARC MVP Platform Alignment - Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-1-5.md`
- `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-6-10.md`
- `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-11-12.md`

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
| 1 | Import `origin/nate` UI surface | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-1-5.md` |
| 2 | Refactor imported client structure without visual changes | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-1-5.md` |
| 3 | Define shared MVP contracts in `common/` | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-1-5.md` |
| 4 | Create Prisma data model alignment | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-1-5.md` |
| 5 | Implement profile draft, publish, and public profile APIs | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-1-5.md` |
| 6 | Implement profile child data APIs | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-6-10.md` |
| 7 | Implement follows, community feed, and dashboard APIs | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-6-10.md` |
| 8 | Align campaign and support readiness APIs | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-6-10.md` |
| 9 | Connect client UI to typed backend APIs | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-6-10.md` |
| 10 | Replace mock auth and browser persistence with durable flows | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-6-10.md` |
| 11 | Update docs, seeds, and operational guardrails | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-11-12.md` |
| 12 | Final validation & cleanup | Complete | AI agent | `.ai/tasks/2026-07-13/completed/arc-mvp-platform-alignment/arc-mvp-platform-alignment-steps-11-12.md` |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step is always validation and must live in the last steps doc.
