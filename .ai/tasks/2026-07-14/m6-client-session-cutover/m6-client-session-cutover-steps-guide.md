# M6 Client Session Cutover - Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-1-5.md`
- `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-6-8.md`

**Coordination rule:** Each step is completed by one agent using the `$step-execution` (`/step-execution`) skill.
Do not start a step until all the **Prereqs:** for that step are completed.

> **NOTE:** Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
> Ignore unrelated changes from other agents. If their changes affect your work (e.g., new conflicts, shifted patterns, or shared code), adapt as needed to integrate cleanly or fix issues as they arise.

**Dependency rules:**
- Steps with dependencies must explicitly list them in **Prereqs** and appear after their prerequisites in the index.
- Steps with no dependencies use **Prereqs: None**—this is expected and valid. Place them wherever makes logical sense.
- Independent steps (Prereqs: None) can run in parallel if multiple agents are available.

**Branch rule (this task):** step branches are cut from — and squash-merged back into — the current integration branch `feat/backend-and-aws-infra-plan` (which is `nate` + all landed work; orchestrator provides the base SHA). User-executed actions (redeploys) are flagged inside the steps that need them.

---

## Step index

| Step | Name | Status | Owner | Doc |
| --- | --- | --- | --- | --- |
| 1 | Backend gaps: personal-bests set-replace + GET /v1/athletes/me | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-1-5.md` |
| 2 | Client session core: real session.ts + api.ts auth layer | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-1-5.md` |
| 3 | Auth pages: real submission + invite-only/409/401 error UX | Incomplete | unassigned | `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-1-5.md` |
| 4 | Follows cutover: signed-in via API, anonymous prompts sign-in | Incomplete | unassigned | `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-1-5.md` |
| 5 | Onboarding wizard persistence: create, per-step PATCH/set-replace, publish | Incomplete | unassigned | `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-1-5.md` |
| 6 | Dashboard + manage editor cutover to the real profile | Incomplete | unassigned | `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-6-8.md` |
| 7 | Config + local api-mode E2E verification: 24h test tokens, full loop | Incomplete | unassigned | `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-6-8.md` |
| 8 | Final validation & cleanup (required, always last) | Incomplete | unassigned | `.ai/tasks/2026-07-14/m6-client-session-cutover/m6-client-session-cutover-steps-6-8.md` |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step is always validation and must live in the last steps doc.
