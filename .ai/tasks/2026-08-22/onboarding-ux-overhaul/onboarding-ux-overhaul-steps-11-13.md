# Onboarding & Profile-Creation UX Overhaul - Steps 11-13

## Step 11 - "Coming soon" labels on Follow and Stripe payouts

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Added `client/components/ui/ComingSoonLabel.tsx` (no pill/border/fill/icon) and used it once beside the hero Follow control and once in the `ConnectStripeCard` heading row. `Badge` was rejected — every tone is a filled pill. The label takes a `tone` prop rather than a colour `className`, because two text-colour utilities in one class string resolve by stylesheet order, not argument order. The fabricated follower count now renders only when non-empty at both `AthleteProfile` sites, and the Community card's grid collapses instead of showing an empty column. Follow and Stripe behaviour untouched. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Set honest expectations on the two surfaces that are built but not finished — the follow graph and Stripe payouts — without taking anything away from athletes who can use them today.

**[STRICT] Both features stay fully functional.** This step is label-only. Do not disable, hide, or gate the Follow button or the Stripe Connect action. Disabling Stripe would stop athletes receiving donations; disabling Follow would remove a working feature.

**[STRICT] Keep the label minimal.** Small muted text, not a loud badge — no pill, no border, no colour fill, no icon. It sits beside the control and is the least prominent thing in its row. `client/AGENTS.md` mandates minimalism and "a page must read in under 10 seconds"; a shouty badge on the profile hero breaks that.

**Done When:**
- One shared label component exists and is used on both surfaces — not two ad-hoc spans.
- The athlete profile hero carries the label once, beside the Follow control.
- The manage editor's Stripe payout card carries the label once, in its heading row.
- The fabricated follower count no longer renders when there is no real value behind it.
- Follow still toggles and persists; Stripe Connect still starts real onboarding.
- The label appears **once per surface** — not on every community feed card, and not on all three of the profile's Follow buttons.

**Why the follower count is in scope here:** `client/lib/adapters.ts:280` reads `followers: asString(presentation.followersLabel)` — a hardcoded string in the presentation blob, seeded as `'9.8k'` / `'6.2k'` / `'812'` in `client/lib/athleteProfiles.ts`. It is not derived from the real `Follow` table, so a genuine follow never moves it. `asString` falls back to `''`, so a real onboarded athlete renders `@handle · ` `" followers"` — a blank where the number belongs (`AthleteProfile.tsx:135` and `:408`), sitting next to demo profiles claiming 9.8k. Hiding the count when empty is a conditional, and it removes the most visible artifact from every pilot profile.

**References:**
- `client/components/site/FollowButton.tsx` — the follow control; three `variant`s (`hero`, `block`, `chip`)
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx:128-140` — hero social row: handle · follower count · Follow (label goes here)
- `.../AthleteProfile.tsx:159,421` — the other two Follow buttons; **no label on these**
- `.../AthleteProfile.tsx:404-411` — the stats-block follower count, the second place the empty count renders
- `client/app/(marketing)/community/CommunityClient.tsx:213`, `client/app/(marketing)/community/FeedCard.tsx:47` — feed chips; **no label on these**
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ConnectStripeCard.tsx` — the payout card; label goes in the heading row
- `client/lib/adapters.ts:40-42,280` — `asString` and the `followersLabel` read
- `client/lib/athleteProfiles.ts:72,112,280,...` — the seeded fake counts
- `client/components/ui/Badge.tsx` — check before writing anything new; if it can render a sufficiently quiet variant, extend it rather than adding a component
- `client/AGENTS.md` — minimalism mandate

### Plan
- Check `client/components/ui/Badge.tsx` first. Only add `client/components/ui/ComingSoonLabel.tsx` if `Badge` cannot render something this quiet without a new variant that complicates it.
    - Snippet:
      ```tsx
      // Marks a surface that is built but not finished. Deliberately the quietest
      // element in its row — the feature it labels still works.
      export function ComingSoonLabel({ className }: { className?: string }) {
        return (
          <span className={`text-[10px] font-bold uppercase tracking-wide text-tertiary ${className ?? ''}`}>
            Coming soon
          </span>
        );
      }
      ```
  On the profile hero the surrounding text is white-on-photo, so the hero placement needs a muted-white tone rather than `text-tertiary` — pass it through `className` instead of branching inside the component.
- Place it beside the hero Follow button in the social row, and in the `ConnectStripeCard` heading row next to its title.
- Hide the follower count when it is empty. Prefer fixing it at the read so both render sites benefit:
    - Snippet:
      ```tsx
      // The count is not yet derived from the real follow graph, so render it only
      // when a value exists rather than showing a blank where a number belongs.
      {profile.followers ? (
        <p className="text-white/70">
          <span className="font-display text-lg font-bold text-white">{profile.followers}</span>{' '}
          <span className="label-bold">followers</span>
        </p>
      ) : null}
      ```
  Apply the same guard at `AthleteProfile.tsx:404-411`. Leave `followersLabel` and the seeded fixtures in place — removing them belongs with the real follower-count work, not here.
- Do not touch `client/lib/follows.ts`, `FollowButton`'s behaviour, or any Stripe call path.
- Verify: a real (non-seeded) athlete profile shows no blank follower row and one quiet "Coming soon" beside Follow; a seeded demo profile still shows its count; Follow still toggles and survives reload; the Stripe card still starts onboarding.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 12 - Realign the onboarding guide page and review summary

### Metadata
**Status:** Complete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Rewrote the four `/register` step descriptions against the forms as built (story questions + hero photo in Step 1; optional highlights/races and results links in Step 2; custom values in Step 3; public link and post-publish editing in Step 4), replaced the "funding targets / fund usage" Step 4 copy and the crowdfunding-campaign intro, and fixed `bottomNav` to Profile / Results / Values / Review. The 15-minute claim no longer held for the flow as built, so all four surfaces that state it (`/register`, `/sign-up`, `/for-athletes`, `/how-it-works`) now say 10 minutes. Review summary: Basics card gained a hero-photo thumbnail with a "No hero photo" placeholder; custom values already render identically to presets (same `profile.values` map), and the empty-state copy now says values can be written. `$doc-alignment` (`/doc-alignment`) found no contradiction — `docs/` describes the wizard only as the 4-step `/register/*` flow, which is still accurate, and states no time estimate. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Make every page that *describes* the flow match the flow that now exists, so the wizard never promises something it does not ask.

**Done When:**
- `/register` ("How to Build Your Epic") describes the four steps as they now behave: Step 1 includes the story questions and the hero/banner photo; Step 3 mentions that values can be the athlete's own words; Step 4 explains the public link rather than "funding targets" and "breakdown of fund usage", which this wizard does not collect.
- The advertised "Estimated time: 15 minutes" is checked against the flow as built and corrected if it no longer holds.
- The review step's summary cards cover the new fields — the hero photo appears, and values show custom entries — so nothing an athlete entered is invisible at review.
- `$doc-alignment` (`/doc-alignment`) reports no contradiction between `docs/` and the implemented flow.

**References:**
- Context §10 (docs), §2 (out of scope)
- `client/app/register/page.tsx:12-49` — the `steps` array copy, including the Step 4 text about funding targets that the wizard never collects, and `bottomNav`'s stale "Social" label
- `client/app/register/review/ReviewSummary.tsx:49-115` — the review cards
- `client/app/(marketing)/sign-up/page.tsx:17-20` — the "about 15 minutes" claim, which must agree with `/register`
- `docs/product-brief.md`, `docs/delivery-plan.md` — product intent; expected to stay accurate, confirm rather than edit

### Plan
- Rewrite the four `steps` entries in `client/app/register/page.tsx` against the real forms. Do not add a fifth step or lengthen the page (`client/AGENTS.md` minimalism).
- Fix the `bottomNav` labels so they name the actual steps (Profile / Results / Values / Review).
- Add a hero-photo thumbnail to the Basics review card and confirm the values card renders custom entries identically to presets.
- Reconcile the two time estimates so `/sign-up` and `/register` do not disagree.
- Run `$doc-alignment` (`/doc-alignment`) and fix any in-scope contradiction it finds; flag anything out of scope in the completion notes rather than editing it.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 13 - Final Validation & Cleanup

### Metadata
**Status:** Complete — runtime walkthrough pending
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:**

**Constraint audit — all nine items pass**, verified against `4886469` (Steps 1-9) plus the uncommitted Steps 10-12:
- No file under `app/prisma/` changed and no Prisma CLI command was run.
- `app/` changes are exactly three lines plus a test: `HighlightInput.occurredOn?: Date`, the `createMany` mapping in `replaceHighlights`, and the `new Date(highlight.occurredOn)` conversion in `replaceMyHighlights`. No endpoint, controller, router, or DI registration was added.
- `common/` changes are exactly the additive story-answer schema block and `occurredOn: z.string().date().optional()` on `setHighlightInputSchema`.
- No request/response shape redefined in `client/` — the only new client types in the whole batch are the view-model types `EditableResultPatch`, `StoryQuestion`, and `Pane`; `AthleteStoryAnswers` is imported from `fad-common`.
- Step 11 is label-and-conditional only: no change to `FollowButton` behaviour, `client/lib/follows.ts`, or any Stripe call path (neither file appears in either changeset).
- `ValueChips.tsx` is deleted and has zero references.
- `client/lib/manageApi.ts` now documents `date <-> occurredOn`; the "dropped on save" claim is gone.
- No TODOs were introduced anywhere in the batch.
- Comment rules held: every comment added is a why/intent or public-contract comment (presentation merge, blank-name delete guard, photo caps, Enter-advances-not-submits, native email validity, the pane-focus StrictMode guard, the hidden follower count, the `ComingSoonLabel` tone contract).

**Static verification of the walkthrough** — every affordance the walkthrough exercises was traced in code and is present and wired: the paced sign-up's single `signUp()` → `safeAuthDestination` → `/register/personal-basics`, and the account-name seed in `ApiOnboardingProvider` (item 1); `STORY_QUESTIONS` / `composeStoryDraft` / "Rewrite from my answers" (item 2); `IMAGE_UPLOAD_ACCEPT` plus the HEIC sniff-and-convert path in `client/lib/imageUploads.ts` feeding `patch.heroMediaUrl` (item 3); the custom-value cap, case-insensitive duplicate rejection, and 40-character clamp (item 5); the "What publishing does" block rendering `publicUrl` from the same slug expression the post-publish screen uses (items 6-7); inline editors and the `occurredOn` round-trip test at `TZ=Pacific/Auckland` (items 8-9); the quiet label and the follower-count guard (item 10); and the `{...existing?.presentation, storyAnswers}` merge in `toStep1Patch` (item 11).

**[OUTSTANDING] The runtime walkthrough itself was not executed.** It requires `api` mode against a running API, and no local Postgres is listening on `localhost:5432` (`app/.env` points there) — starting or migrating a database is outside what AI may do here. The DB-backed API tests, including the new `occurredOn` timezone round-trip, are `describe.skipIf(!shouldRunDatabaseTests)` and therefore **skipped** in every CI run so far (16 passed / 5 skipped). Items 1-11 need one manual pass by the user against a running API before this batch is considered field-verified.

**Flagged, not fixed (out of scope, no user-visible defect):** `ValuesSocialForm.addCustomValue` and `toggleValue` call `setValueHint` / `setCustomValue` from inside the `update()` state-updater callback. Updaters must be pure; today every side effect there is idempotent so StrictMode's double invocation is harmless, but the next non-idempotent addition would break. Worth hoisting out of the updater in a follow-up.

The task folder was **not** moved to `.ai/tasks/2026-08-22/completed/` — that move is held until the runtime walkthrough passes. Left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Verify the whole batch end to end against the seven pieces of feedback plus the defect found during planning, and confirm the constraints the plan committed to were actually held.

**Verification walkthrough (run in `api` mode against a running API):**
1. **(#7 → #1)** Sign up as a brand-new athlete through the paced sign-up. Land on `/register/personal-basics` with the name already filled. Never type the name twice.
2. **(#2)** Answer the story questions; confirm draft prose appears, edit it, toggle a chip, and confirm the edit survives and the rewrite button offers itself.
3. **(#6)** Upload a hero photo (include one iPhone HEIC). Confirm it renders in the live preview.
4. Advance to Step 2, add a personal best. Advance to Step 3.
5. **(#5)** Add a custom value; confirm the cap, the duplicate rejection, and the 40-character limit.
6. **(#3)** On review, confirm the "What publishing does" block shows the real `athletearc.ca` URL before publishing, and that a missing tagline still surfaces the existing checklist without contradiction.
7. Publish. Confirm the post-publish URL matches the pre-publish URL.
8. **(#4)** In `/athletes/[slug]/manage`, add a race with no photos, save, reload, then edit it in place — add photos, fix the date — and confirm both persist through reload and appear on the public profile. Repeat for a career highlight and a roadmap item.
9. **(highlight date)** Add a career highlight with a date, reload, and confirm the date persisted and renders on the public profile. Clear it, reload, and confirm it stays cleared. Confirm an old highlight with a null date still saves. **Re-run this specific check with a non-UTC `TZ`** (e.g. `TZ=Pacific/Auckland`) and confirm the date does not shift by a day.
10. **(coming soon)** Confirm the new athlete's profile shows no blank follower row and one quiet label beside Follow; confirm Follow still toggles and persists; confirm the Stripe card still starts onboarding.
11. Resume `/register/personal-basics` after step 8 and confirm the wizard's save did **not** clobber the manage editor's `presentation` keys (`highlightTones`, `raceTones`, `arcChapters`, `arcSubtitle`, `training`).

**Constraint audit:**
- No Prisma migration was added; no file under `app/prisma/migrations/` changed, and no Prisma CLI command was run.
- `app/` changes are limited to the highlight-date write path (`AthleteRepository.HighlightInput` / `replaceHighlights`, `AthleteService.replaceMyHighlights`) — no new endpoint, controller, router, or DI registration.
- `common/` changes are limited to the additive story-answer schema and the additive optional `occurredOn` on `setHighlightInputSchema`.
- No request/response shape was redefined in `client/`.
- Neither Follow nor Stripe Connect was disabled, hidden, or gated by Step 11 — both remain fully functional.
- `client/lib/follows.ts` and the Stripe call paths are unchanged.
- `client/app/register/values-social/ValueChips.tsx` is deleted and unreferenced.
- The stale field-mapping comment at `client/lib/manageApi.ts:41-46` no longer claims the highlight date is dropped.
- Comment rules held: no restated-code comments were introduced; the why-comments that were added (presentation merge, blank-name delete guard, photo caps, Enter-advances-not-submits, the highlight-date write gap, the hidden follower count) each explain a non-obvious constraint.

### Final Step Checklist
* [x] Confirm all prior steps are complete
* [ ] Run the verification walkthrough above and record the result in the completion notes — **blocked:** traced statically and recorded above; the live `api`-mode pass needs a running database and API (see completion notes)
* [x] Run the constraint audit above
* [x] Review and resolve any outstanding TODOs introduced during this task (none were introduced)
* [x] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [x] Run the `$ci` (`/ci`) skill and confirm it passes
- [x] Fix any issues caused by `$ci` (`/ci`)
* [x] Update task metadata in the steps docs and the steps guide index
* [ ] Move `.ai/tasks/2026-08-22/onboarding-ux-overhaul/` to `.ai/tasks/2026-08-22/completed/onboarding-ux-overhaul/` — held until the runtime walkthrough passes
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
