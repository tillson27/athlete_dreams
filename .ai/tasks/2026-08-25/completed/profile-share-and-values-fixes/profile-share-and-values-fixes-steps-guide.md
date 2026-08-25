# Athlete Profile: Share Surface, Core Values, and URL Consistency Fixes - Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-1-5.md`
- `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-6-7.md`

**Coordination rule:** Each step is completed by one agent using the `$step-execution` (`/step-execution`) skill.
Do not start a step until all the **Prereqs:** for that step are completed.

> **NOTE:** Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
> Ignore unrelated changes from other agents. If their changes affect your work (e.g., new conflicts, shifted patterns, or shared code), adapt as needed to integrate cleanly or fix issues as they arise.

**Dependency rules:**
- Steps with dependencies must explicitly list them in **Prereqs** and appear after their prerequisites in the index.
- Steps with no dependencies use **Prereqs: None**—this is expected and valid. Place them wherever makes logical sense.
- Independent steps (Prereqs: None) can run in parallel if multiple agents are available.

---

## Task-specific rules

- **[STRICT] Do not deploy.** Root `AGENTS.md` forbids AI-run deployment commands. Step 5 verifies whether infrastructure is live and reports back; only the user deploys.
- **[STRICT] Zod-first ordering.** Step 1 edits `common/src/zod/athlete.ts`, then runs `npm run build --prefix common`, and only then touches `app/` and `client/`. Skipping the rebuild makes the contract change appear to work while `app/` and `client/` compile against a stale `fad-common`.
- **[STRICT] Step 6 is gated on Step 5's verdict.** If Step 5 finds the CloudFront `/athletes/<slug>` rewrite is not live on test, Step 6 must be left Blocked and the user asked to deploy. Flipping `profileUrl.ts` without the rewrite 404s every share link.
- **[STRICT] Never clear `values`.** `client/app/(marketing)/dashboard/DashboardClient.tsx:100` and `client/app/register/review/PublishPanel.tsx:72,86` read `profile.values.length` as completeness and publish-readiness gates. Step 2 keeps `values` in sync with core value titles; it must not empty the array.
- **Verify against the static export, not just dev.** `STATIC_EXPORT=true npm run build --prefix client` is the deployed build mode and is where `useSearchParams` Suspense errors surface. Steps 3 and 7 require it.
- `ManageProfile.tsx` is also targeted by the incomplete `.ai/tasks/2026-08-16/arc-editor/` plan (different section of the file). Absorb concurrent edits rather than stopping.

---

## Step index

| Step | Name | Status | Owner | Doc |
| --- | --- | --- | --- | --- |
| 1 | Core value contract: make `body` optional (common → app → client) | Complete | ai | `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-1-5.md` |
| 2 | Bridge onboarding values into the editor and stop the profile dropping them | Complete | ai | `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-1-5.md` |
| 3 | Fix the mobile bottom nav / share bar collision | Complete | ai | `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-1-5.md` |
| 4 | Share UX: native share sheet and Copy link | Complete | ai | `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-1-5.md` |
| 5 | Verify the CloudFront `/athletes/<slug>` rewrite and add a CDK regression test | Complete | ai | `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-1-5.md` |
| 6 | Make the path form canonical in `profileUrl.ts` | Complete | ai | `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-6-7.md` |
| 7 | Final validation & cleanup (required, always last) | Complete | ai | `.ai/tasks/2026-08-25/profile-share-and-values-fixes/profile-share-and-values-fixes-steps-6-7.md` |

---

## Feedback traceability

| Reported item | Step(s) |
| --- | --- |
| 1. No share button on mobile | 3 |
| 1b. Wants to share a profile visual by link and to social | 4 |
| 2. Old core values not shown, not deletable | 2 |
| 2b. Newly added core values not visible on the profile | 1, 2 |
| 3. Share links use `?profile=` instead of a path slug | 5, 6 |
| Found during investigation: no CDK coverage for the rewrite the URL plan depends on | 5 |
| Found during investigation: saving one core value hides the onboarding values | 2 |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step is always validation and must live in the last steps doc.
