# Arc Editor — Steps 6–7

## Step 6 — Manage page integration

### Metadata
**Status:** Incomplete
**Prereqs:** 5
**Size:** small
**Owner:** ai

### Context

**Objective:** Remove the embedded Arc editor section from `ManageProfile.tsx` and replace it with a summary card that links to the new dedicated `/manage/arc` page. Clean up the Arc state that is no longer needed in that component.

**Done When:**
- The Arc `<SectionCard>` block (lines ~703-888 in `ManageProfile.tsx`) is replaced with a summary card + "Edit Arc" link
- `arcChapters`, `arcSubtitle`, `setArcChapters`, `setArcSubtitle` state variables are removed from `ManageProfile.tsx`
- `patchChapter` calls and any Arc-specific imports that are now unused are removed
- `ManageProfile.tsx` compiles without errors
- The manage page clearly communicates the Arc is optional (no publish gate)

**References:**
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` — Arc section lines ~703-888; Arc state declarations (search for `arcChapters`, `arcSubtitle`, `setArcChapters`)
- `client/lib/athleteEdits.ts` — `AthleteEdits.arcChapters` and `AthleteEdits.arcSubtitle` remain (used by `deriveEdits`/`loadEdits`/`saveEdits` for the localStorage path); only the React state in ManageProfile is removed
- Existing `SectionCard` component — used for the summary card
- Next.js `Link` — for the "Edit Arc" navigation

### Plan

- Remove the Arc `<SectionCard>` block from `ManageProfile.tsx` (the full block from `{/* The Arc — the journey timeline */}` through its closing `</SectionCard>`).

- Replace it with a compact summary card that shows the chapter count and a link to the dedicated editor:
    - Snippet:
      ```tsx
      <SectionCard icon="history" title="The Arc">
        <p className="mb-4 text-sm text-on-surface-variant">
          Tell your story chapter by chapter — the journey that made you who you are as an
          athlete. Optional, but powerful.
        </p>
        <Link
          href={`/athletes/${athleteSlug}/manage/arc`}
          className="btn-outlined inline-flex items-center gap-2"
        >
          Edit Arc
        </Link>
      </SectionCard>
      ```

- Remove Arc state declarations from `ManageProfile.tsx`:
  - `const [arcChapters, setArcChapters] = useState<EditArcChapter[]>(...)`
  - `const [arcSubtitle, setArcSubtitle] = useState<string>(...)`
  - Any `arcChapters`/`arcSubtitle` references in `saveAll`, `deriveEdits`, or `loadEdits` calls within the component

- Remove any imports that become unused after the Arc section removal (e.g., `patchChapter` if it was only used by the Arc section).

- Verify the `saveAll` function in `ManageProfile.tsx` no longer writes `arcChapters`/`arcSubtitle` to localStorage (those are now handled by the Arc editor page).

### Step checklist
- [ ] Arc `<SectionCard>` block removed from `ManageProfile.tsx`
- [ ] Summary card with "Edit Arc" link added in its place
- [ ] `arcChapters` and `arcSubtitle` state variables removed
- [ ] `saveAll` / `loadEdits` / `deriveEdits` no longer reference Arc fields in this component
- [ ] Unused imports cleaned up
- [ ] `ManageProfile.tsx` TypeScript compilation clean
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 — Final Validation & Cleanup

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2, 3, 4, 5, 6
**Owner:** ai

### Final Step Checklist
* [ ] Confirm all prior steps (1–6) are marked Complete in the steps guide index
* [ ] Review and resolve any outstanding TODOs introduced during this task
* [ ] Run the `$e2e-review` (`/e2e-review`) skill with full context:
  - New endpoint: `PUT /v1/athletes/me/arc`
  - New page: `/athletes/[slug]/manage/arc`
  - Adapter change: `profileToRichProfile()` reads from typed `profile.arcChapters` (not `presentation`)
  - Manage page: Arc section replaced with summary card + link
* [ ] Run the `$ci` (`/ci`) skill and confirm it passes
- [ ] Fix any issues caused by `$ci` (`/ci`)
* [ ] Update task metadata in the steps docs and the steps guide index
* [ ] Move `.ai/tasks/2026-08-16/arc-editor/` to `.ai/tasks/2026-08-16/completed/arc-editor/`
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
