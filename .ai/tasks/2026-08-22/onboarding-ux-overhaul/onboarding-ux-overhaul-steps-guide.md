# Onboarding & Profile-Creation UX Overhaul - Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-1-5.md`
- `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-6-10.md`
- `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-11-13.md`

**Coordination rule:** Each step is completed by one agent using the `$step-execution` (`/step-execution`) skill.
Do not start a step until all the **Prereqs:** for that step are completed.

> **NOTE:** Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
> Ignore unrelated changes from other agents. If their changes affect your work (e.g., new conflicts, shifted patterns, or shared code), adapt as needed to integrate cleanly or fix issues as they arise.

**Dependency rules:**
- Steps with dependencies must explicitly list them in **Prereqs** and appear after their prerequisites in the index.
- Steps with no dependencies use **Prereqs: None**—this is expected and valid. Place them wherever makes logical sense.
- Independent steps (Prereqs: None) can run in parallel if multiple agents are available.

**Collision warning:** `.ai/tasks/2026-08-16/arc-editor/` is an incomplete plan that also refactors `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` — it extracts the Arc/journey section to its own page. Steps 7 and 8 must stay out of the Arc section and expect to integrate around it.

**File-contention map** (why the order is what it is):
- `client/app/register/personal-basics/PersonalBasicsForm.tsx` — Steps 1, 3, 4 (chained)
- `client/app/register/_components/OnboardingContext.tsx` — Steps 1, 3, 4 (chained)
- `client/app/register/_components/onboardingProfile.ts` — Steps 3, 4 (chained)
- `client/lib/onboardingApi.ts` — Steps 3, 4 (chained)
- `common/src/zod/athlete.ts` — Steps 2, 8 (different schemas; sequence them anyway to keep the `common` rebuild clean)
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` — Steps 7, 9 (chained)
- `client/lib/manageApi.ts` — Step 8
- Steps 5, 6, 7 touch no file the wizard steps touch and can run in parallel with them.

---

## Step index

| Step | Name | Status | Owner | Doc |
| --- | --- | --- | --- | --- |
| 1 | Seed the wizard's name from the signed-in account | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-1-5.md` |
| 2 | Add the story-answer contract to `common/` | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-1-5.md` |
| 3 | Story step: specific questions that seed an editable draft | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-1-5.md` |
| 4 | Hero/banner photo inside the profile-creation flow | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-1-5.md` |
| 5 | Values step: free-text values alongside the presets | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-1-5.md` |
| 6 | Make the value of publishing explicit | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-6-10.md` |
| 7 | Fix: edit a saved previous race in place, photos included | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-6-10.md` |
| 8 | Fix: stop discarding the career-highlight date (full stack) | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-6-10.md` |
| 9 | Extend inline editing to career highlights and roadmap | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-6-10.md` |
| 10 | Guided, paced account creation | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-6-10.md` |
| 11 | "Coming soon" labels on Follow and Stripe payouts | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-11-13.md` |
| 12 | Realign the onboarding guide page and review summary | Complete | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-11-13.md` |
| 13 | Final validation & cleanup (required, always last) | Complete — runtime walkthrough pending | ai | `.ai/tasks/2026-08-22/onboarding-ux-overhaul/onboarding-ux-overhaul-steps-11-13.md` |

---

## Feedback-item traceability

| Feedback item | Step(s) |
| --- | --- |
| 1. Basic info re-asked after account creation | 1 |
| 2. Story question too vague | 2, 3 |
| 3. Publish button value unclear | 6 |
| 4. Cannot add photos to an existing race | 7, 9 |
| 5. Values presets too limiting | 5 |
| 6. Hero/banner not settable during creation | 4 |
| 7. Account creation should feel interactive | 10 |
| Found during planning: highlight date silently discarded on save | 8 |
| Requested: "coming soon" flag on Follow + Stripe account | 11 |

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs.
- The final step is always validation and must live in the last steps doc.
