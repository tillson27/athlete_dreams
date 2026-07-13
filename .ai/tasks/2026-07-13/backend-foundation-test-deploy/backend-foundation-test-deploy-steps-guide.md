# Backend Foundation, Nate Contract Alignment & AWS Test-Deployment Readiness - Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-1-5.md`
- `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-6-10.md`
- `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-11-15.md`
- `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-16-17.md`

**Coordination rule:** Each step is completed by one agent using the `$step-execution` (`/step-execution`) skill.
Do not start a step until all the **Prereqs:** for that step are completed.

> **NOTE:** Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
> Ignore unrelated changes from other agents. If their changes affect your work (e.g., new conflicts, shifted patterns, or shared code), adapt as needed to integrate cleanly or fix issues as they arise.

**Dependency rules:**
- Steps with dependencies must explicitly list them in **Prereqs** and appear after their prerequisites in the index.
- Steps with no dependencies use **Prereqs: None**—this is expected and valid. Place them wherever makes logical sense.
- Independent steps (Prereqs: None) can run in parallel if multiple agents are available.

**Branch rule (this task):** all step branches are cut from — and PR back into — **`nate`** per `docs/delivery-plan.md`. User-executed actions (migration applies, GitHub settings, AWS deploys) are flagged inside the steps that need them.

---

## Step index

| Step | Name | Status | Owner | Doc |
| --- | --- | --- | --- | --- |
| 1 | CI enablement: PR checks, PR template, Dependabot | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-1-5.md` |
| 2 | App bootstrap refactor: buildApp split, lifecycle, health | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-1-5.md` |
| 3 | Test harness: vitest + supertest, wired into CI | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-1-5.md` |
| 4 | Prisma schema evolution (nate alignment) | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-1-5.md` |
| 5 | Zod contract evolution in common/ | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-1-5.md` |
| 6 | Init migration draft + seed script | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-6-10.md` |
| 7 | Athlete read path: rich profile, directory keyset + filters | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-6-10.md` |
| 8 | Athlete write path: PATCH me, publish, editor set-replace | Incomplete | unassigned | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-6-10.md` |
| 9 | Follows: model wiring, endpoints, tests | Incomplete | unassigned | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-6-10.md` |
| 10 | Campaign read path + transparency rule | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-6-10.md` |
| 11 | Community feed endpoint (derived, follows-aware) | Incomplete | unassigned | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-11-15.md` |
| 12 | Client API layer + flagged data-source swap | Incomplete | unassigned | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-11-15.md` |
| 13 | CDK skeleton + NetworkStack | Complete | claude-opus-4.8 | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-11-15.md` |
| 14 | DataStack + ApiStack + Dockerfile + migration/seed tasks | Incomplete | unassigned | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-11-15.md` |
| 15 | WebStack + client static-export knob | Incomplete | unassigned | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-11-15.md` |
| 16 | Deploy workflows (OIDC), smoke suite, deploy runbook | Incomplete | unassigned | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-16-17.md` |
| 17 | Final validation & cleanup (required, always last) | Incomplete | unassigned | `.ai/tasks/2026-07-13/backend-foundation-test-deploy/backend-foundation-test-deploy-steps-16-17.md` |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step is always validation and must live in the last steps doc.
