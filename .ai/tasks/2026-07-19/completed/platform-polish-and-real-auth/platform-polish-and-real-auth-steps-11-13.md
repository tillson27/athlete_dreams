# Platform Polish + Real Auth - Steps 11-13

## Step 11 - Mobile audit: shrink cards & typography, verify all changes

### Metadata
**Status:** Complete
**Prereqs:** 1, 2, 3, 4, 5, 10
**Size:** medium
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Hid desktop header auth controls below `md` so the mobile header uses only the logo and menu button.
- Reduced mobile auth-panel padding and heading size while preserving desktop spacing.
- Raised visible mobile controls to at least 44 px targets across header, filters, auth links, community feed controls, dashboard sign-out, profile follow, and manage editor actions.
- Let the athlete-profile verification summary wrap on small screens and preserved compact editor photo remove visuals with larger tap areas.
- Captured and audited 22 mobile screenshots (home, discover, profile, dashboard, community, sign-in/up, forgot/reset/verify, manage at 375x667 and 390x844); final DOM audit reported no document overflow and no visible sub-44 px controls.

### Context

**Objective:** Do a detailed mobile audit and shrink cards + typography where the experience feels heavy on small screens. Cover every surface touched earlier in the plan plus the untouched high-traffic ones (dashboard, discover, athlete profile, community).
**Done When:**
- Home hero, discover grid, athlete profile, dashboard, community, sign-in/up, forgot/reset/verify, and manage editor all render cleanly at 375×667 and 390×844 with no horizontal scroll, no overlapping controls, and comfortable tap targets (≥44 px).
- Card padding + typography reduced where appropriate (`text-3xl` → `text-2xl` on mobile, tighter `p-6` → `p-5`, etc.). Desktop is unchanged.
- Existing e2e paths (sign-up → verify → dashboard → manage → view profile) continue to work.

**References:**
- Context §1, §7
- All files touched by steps 1-10.

### Plan
- Sweep the changed surfaces with a mobile-first pass, using Chrome DevTools iPhone SE + iPhone 14 Pro widths.
- Adjust card padding classes: prefer `p-5 md:p-8` over `p-8`. Reduce `text-4xl` on marketing headings to `text-3xl md:text-4xl` where a heading is currently overwhelming on 375 px.
- Verify pagination controls stay on one line on mobile (wrap to `flex-wrap` if needed).
- Verify the athlete profile sidebar cards stack cleanly and don't force horizontal scroll from the training-snapshot number grid.
- Verify the ManageProfile forms remain usable — the "Add races" form should stack to single column on mobile (it already does; confirm nothing regressed).
- Snapshot each surface manually (`npm run dev`) and record any residual issues in Completion Notes.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 12 - Autosave parity in api-mode manage editor

### Metadata
**Status:** Complete
**Prereqs:** 10
**Size:** small
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Added API-mode debounced autosave 1 second after edits change, with cleanup on dependency change and unmount.
- Kept the Save button as an immediate save action that clears any pending debounce.
- Added deep-equal save snapshots so unchanged edit/cover payloads skip network writes.
- Added status copy for `Saving…`, `Saved. Your public profile is up to date.`, and a dimmed `Last saved at ...` timestamp after the 5-second confirmation window.
- Guarded in-flight saves so a completed older save does not clear newer cover-photo dirty state.
- Step 13 follow-up serialized overlapping API saves so queued autosaves cannot interleave set-replace requests.

### Context

**Objective:** Keep the new Save button while also autosaving in api mode, matching mock mode's autosave behaviour.
**Done When:**
- `ManageProfileApi` autosaves debounced 1s after the last edit; Save button still works and forces an immediate save.
- Status line renders "Saving…" → "Saved. Your public profile is up to date." → dimmed timestamp copy after 5s.
- Debounce cancels on unmount and does not fire during the initial hydration.

**References:**
- Context §1, §5, §7
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:206-285`

### Plan
- Add a debounced-effect helper (inline `useEffect` with `setTimeout` + cleanup).
    - Snippet:
      ```ts
      useEffect(() => {
        if (!hydrated) return;
        const t = setTimeout(() => { void save(); }, 1000);
        return () => clearTimeout(t);
      }, [edits, coverPhoto, hydrated]);
      ```
- Track `hydrated` so we don't fire the first debounce off the initial fetch payload.
- Ensure `save` is idempotent when the payload hasn't changed (skip if a `savedSnapshot` deep-equal check matches).

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
**Status:** Complete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Confirmed Steps 1-12 were complete and found no outstanding task-introduced TODOs outside this checklist.
- Ran the `$e2e-review` (`/e2e-review`) checks through backend, frontend, and docs-alignment passes; fixed the blocking findings.
- Added a backend publish backstop requiring `User.emailVerifiedAt`, updated the publish integration path to assert unverified users receive 403, and kept the client publish button disabled until session readiness is known.
- Made reset-password and verify-email token consumption transactional with the matching user mutation so consumed tokens cannot be separated from the password/email update.
- Serialized API-mode manage-editor saves, raised the remaining manage-editor/confirm-dialog tap targets, and fixed Step 13 auth-form tap targets.
- Pinned GitHub Pages static preview builds to `NEXT_PUBLIC_DATA_SOURCE=mock` and aligned the task docs with the completed state.
- Remaining residuals: CDK still does not inject Resend/`APP_URL` values in cloud, and sign-up can still leave a partial user if later team/token writes fail; both are broader follow-ups outside this task's scope.

### Final Step Checklist
* [x] Confirm all prior steps are complete
* [x] Review and resolve any outstanding TODOs introduced during this task
* [x] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [x] Run the `$ci` (`/ci`) skill and confirm it passes
- [x] Fix any issues caused by `$ci` (`/ci`)
* [x] Update task metadata in the steps docs and the steps guide index
* [x] Move `.ai/tasks/2026-07-19/platform-polish-and-real-auth/` to `.ai/tasks/2026-07-19/completed/platform-polish-and-real-auth/`
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
