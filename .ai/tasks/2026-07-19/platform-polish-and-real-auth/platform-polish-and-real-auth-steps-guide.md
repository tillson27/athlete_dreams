# Platform Polish + Real Auth - Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-1-5.md`
- `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-6-10.md`
- `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-11-13.md`

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
| 1 | New ARC logo mark | Complete | codex | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-1-5.md` |
| 2 | Full-viewport home hero | Complete | codex | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-1-5.md` |
| 3 | Athlete profile polish: story toggle + move "See more" triggers to bottom | Complete | codex | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-1-5.md` |
| 4 | Discovery cleanup: remove filters, add pagination, tighten mobile row | Complete | codex | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-1-5.md` |
| 5 | Photo gallery block carousel / lightbox | Complete | codex | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-1-5.md` |
| 6 | Backend contracts: Prisma migration + Zod schemas + env additions | Complete | codex | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-6-10.md` |
| 7 | Backend Resend integration: EmailService + branded HTML templates | Incomplete | claude | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-6-10.md` |
| 8 | Backend auth flow: verify, forgot-password, reset-password endpoints | Incomplete | claude | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-6-10.md` |
| 9 | Frontend auth cutover: API-mode default + password rules + verify/forgot/reset pages | Incomplete | claude | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-6-10.md` |
| 10 | Manage editor UX: save + view-public + three-dot menu + drag reorder + confirm delete | Incomplete | claude | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-6-10.md` |
| 11 | Mobile audit: shrink cards & typography, verify all changes | Incomplete | claude | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-11-13.md` |
| 12 | Autosave parity in api-mode manage editor | Incomplete | claude | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-11-13.md` |
| 13 | Final validation & cleanup | Incomplete | claude | `.ai/tasks/2026-07-19/platform-polish-and-real-auth/platform-polish-and-real-auth-steps-11-13.md` |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step is always validation and must live in the last steps doc.
