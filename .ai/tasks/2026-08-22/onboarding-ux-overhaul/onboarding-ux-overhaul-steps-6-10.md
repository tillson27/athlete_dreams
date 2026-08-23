# Onboarding & Profile-Creation UX Overhaul - Steps 6-10

## Step 6 - Make the value of publishing explicit

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Added pre-publish explanation with the real public URL and mirrored the public-link/Instagram-bio framing in the dashboard draft state without changing publish behavior. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Explain, before the athlete decides, that publishing creates a public page with a link they can put in their Instagram bio — and that it stays editable afterwards (feedback item 3).

**Done When:**
- The review step shows a "What publishing does" block **above** the publish control, containing the athlete's real `athletearc.ca` profile URL and three plain lines: it becomes a public page anyone can open; the link goes in your Instagram bio; you can keep editing after it's live.
- The block points at the share-card export that already exists on the public profile, so the IG payoff is concrete rather than asserted.
- The button label and its supporting line read as a benefit, not a mechanism.
- The dashboard's "Draft — not published yet" state carries the same framing.
- Publish **behaviour** is unchanged: same endpoint, same guard, same checklist, same post-publish screen.
- The new copy never implies the profile can publish without a tagline and a personal best.

**References:**
- Context §4 (#3), §8 D6, §11
- `client/app/register/review/PublishPanel.tsx:229-347` — the pre-publish panel: terms checkbox, gating messages, button, and the single "live immediately" line
- `client/app/register/review/PublishPanel.tsx:134-227` — the post-publish screen, where the URL and copy-link already appear (too late)
- `client/lib/profileUrl.ts` — `profileUrl(slug)`, `PROFILE_HOST = 'athletearc.ca'`, `athleteProfileHref`
- `client/app/(marketing)/athletes/[athleteSlug]/ShareCard.tsx:28-29,286-291` — the existing IG Story / IG Post card exporter
- `client/app/(marketing)/dashboard/DashboardClient.tsx:355-395` — draft state and the existing Share-link control
- `app/src/api/athletes/AthleteService.ts:239-249` — `assertPublishable`: `storyIntro` + ≥1 personal best; do not contradict it
- `client/lib/onboardingApi.ts:277-293` — `toPublishChecklist` sentences that render when the guard fires

### Plan
- Add the explanation block to `PublishPanel`'s idle branch, above the terms checkbox. Reuse `profileUrl(slug)` — the same slug expression the panel already computes at `PublishPanel.tsx:57`, so a server-reserved `-2` suffix shows correctly.
    - Snippet:
      ```tsx
      <section className="rounded-card border border-outline-variant bg-surface-container-low p-5">
        <h3 className="label-bold text-on-surface">What publishing does</h3>
        <p className="mt-2 flex items-center gap-2 text-sm text-on-surface-variant">
          <Icon name="link" className="h-4 w-4 shrink-0 text-secondary" />
          <span className="truncate">{publicUrl}</span>
        </p>
        {/* three plain benefit lines: public page · link for your IG bio · still editable */}
      </section>
      ```
- Rewrite the trailing line under the button from "Your profile will be live immediately upon publishing" to something that names the payoff and the reversibility in one sentence.
- Keep every existing gating branch (`!hasName`, session-not-ready, signed-out, `mustVerifyEmail`, `publishChecklist`, `saveError`) exactly as it is. The new block is additive and must render above them so an error is never pushed out of view.
- Mirror the framing on the dashboard's not-published card so an athlete who leaves the wizard and returns gets the same explanation.
- Do not add a new endpoint, a new session flag, or a change to `markPublished`.
- Verify: with a draft missing a tagline, the explanation and the checklist both render and do not contradict each other; the URL shown pre-publish matches the URL shown on the post-publish screen.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - Fix: edit a saved previous race in place, photos included

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Added Edit actions and inline editing for saved previous races, including name/date/result/results URL edits, photo add/remove, and a 12-photo cap before upload. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Fix the reported defect — an athlete who wanted to add photos to a race she had already created had to delete and re-create it (feedback item 4).

**Done When:**
- A saved Previous Race row in `/athletes/[slug]/manage` can be opened for editing from its `ItemMenu`.
- While open, the athlete can change name, date, result, and results URL, and can **add and remove photos** using the same uploader the add-form uses.
- The photo count per race stops at the contract cap of 12 with a plain sentence, rather than failing on save.
- A race cannot be saved out of edit mode with a blank name (that would silently delete it — see below).
- Changes flow through the existing autosave and the existing `PUT /v1/athletes/me/races`; no API or schema change is made.
- The Arc/journey section of `ManageProfile.tsx` is untouched.
- Reordering and deleting still work; drag-to-reorder is not broken by the expanded row.

**References:**
- Context §4 (#4), §5 (collision warning), §8 D7, §11, §12
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:1248-1330` — the read-only Previous Races rows and the add-form
- `.../ManageProfile.tsx:1748-1815` — `ItemMenu` (Move up / Move down / Delete only)
- `.../ManageProfile.tsx:1570-1581` — `PhotoStrip`, display-only
- `.../ManageProfile.tsx:1502-1550` — `PhotoUploader`, already does add/remove
- `.../ManageProfile.tsx:544-580` — `setRaces`, `prepareImages`, `uploadProgress`/`uploadError` state
- `.../ManageProfile.tsx:296-460` — the autosave loop and `toSaveSnapshot`; edits to `edits.races` are picked up automatically
- `client/lib/manageApi.ts:179-197` — `toRacesRequest`: **already** maps `photos` → `photoRefs`, and **filters out rows with a blank name** (hence the guard above)
- `client/lib/athleteEdits.ts:18-26` — `EditRace`
- `common/src/zod/athlete.ts:228-243` — `photoRefs: z.array(mediaRefSchema).max(12)`
- `.../ManageProfile.tsx:582-600` — the gallery's cap handling, the pattern to mirror for the 12-photo cap
- `.ai/tasks/2026-08-16/arc-editor/` — the pending plan that also refactors this file

### Plan
- Read `.ai/tasks/2026-08-16/arc-editor/` first for collision awareness. Confine all edits to the Previous Races section and the shared helpers below it.
- Extend `ItemMenu` with an optional `onEdit` handler rendered as the first menu entry. Keep it optional so the sections not yet converted are unaffected.
- Add per-section "which row is open" state and render an expanded editor in place of the read-only summary for that row. Follow the inline-field pattern the Core Values section already uses (`ManageProfile.tsx:1332-1405`) rather than inventing new markup.
    - Snippet:
      ```tsx
      const [editingRaceId, setEditingRaceId] = useState<string | null>(null);
      // ...
      {editingRaceId === item.id ? (
        <RaceEditor
          race={item}
          onPatch={(patch) => setRaces((prev) =>
            prev.map((entry) => (entry.id === item.id ? { ...entry, ...patch } : entry)))}
          onAddPhotos={(files) => prepareImages(files, PROFILE_IMAGE_OPTIONS, (refs) =>
            setRaces((prev) => prev.map((entry) =>
              entry.id === item.id
                ? { ...entry, photos: [...entry.photos, ...refs].slice(0, RACE_MAX_PHOTOS) }
                : entry)))}
          onDone={() => setEditingRaceId(null)}
        />
      ) : ( /* today's read-only summary + PhotoStrip */ )}
      ```
- Define `RACE_MAX_PHOTOS` from the contract cap and refuse extra picks with one sentence before the upload runs, mirroring the gallery's `ATHLETE_GALLERY_MAX_PHOTOS` check — do not let the PUT fail after the fact.
- Guard "Done" on a non-blank name, with an inline message. Rationale is load-bearing and worth a why-comment: `toRacesRequest` drops nameless rows, so an emptied name is a silent delete.
- Keep the existing add-form as-is; both paths now converge on the same row shape.
- Do not introduce an edit buffer or draft-vs-committed semantics — the row mutates the same `edits.races` array the autosave watches, matching how Personal Bests and Core Values already behave.
- Verify end to end in `api` mode: create a race with no photos → save → reload → open Edit → add two photos and fix the date → autosave → reload → both persist; check the public profile shows the photos via `ProfileEditableSections`/`PhotoCarousel`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - Fix: stop discarding the career-highlight date (full stack)

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Added optional `occurredOn` to highlight set-replace input, passed it through service/repository writes, mapped it in the manage client, rendered it publicly, and added a non-UTC timezone round-trip test. Validated via `$backend-review` (`/backend-review`), `$e2e-review` (`/e2e-review`), doc alignment, and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Stop silently throwing away the date an athlete types on a career highlight. Found during planning, not reported — but it is the same class of complaint as feedback item 4 (data entered, then lost), and Step 9 would otherwise ship polished inline editing over a field that discards input.

**The defect, traced:** the column exists and the read path works; only the write path is missing.
- `app/prisma/schema.prisma:272` — `occurredOn DateTime? @db.Date` on `AthleteAccomplishment` **already exists**
- `common/src/zod/athlete.ts:24-32` — `athleteAccomplishmentSchema` **already returns** `occurredOn`
- `app/src/api/athletes/AthleteService.ts:315` — the DTO mapper **already reads** it back
- `common/src/zod/athlete.ts:213-218` — `setHighlightInputSchema` has **no** `occurredOn`, so `replaceMyHighlights` never sets it
- `client/lib/manageApi.ts:41-46` — documents the client-side symptom: the editor's `date` "has no API column" and "is dropped on save"

**Done When:**
- A date entered on a career highlight survives save → reload → public profile render.
- No Prisma migration is created (the column already exists).
- The highlight date field is a real date input rather than free text, so what the athlete enters is always a valid ISO calendar date.
- Existing highlights with a null `occurredOn` render an empty date input and save fine without one.
- Clearing a date back to empty is supported and persists as null.
- The stale field-mapping comment in `client/lib/manageApi.ts:41-46` is corrected to describe the new behaviour.
- Race results are **not** touched — they persist a free-text `displayDate`, so nothing is lost there.

**References:**
- Context §8 D9, §9, §10 (app/), §11
- `common/src/zod/athlete.ts:213-226` — `setHighlightInputSchema`, `setAthleteHighlightsRequestSchema`
- `app/src/repositories/AthleteRepository.ts:97-102` — `HighlightInput`
- `app/src/repositories/AthleteRepository.ts:217-240` — `replaceHighlights`, the `createMany` mapping to extend
- `app/src/api/athletes/AthleteService.ts:149-164` — `replaceMyHighlights`
- `app/src/api/athletes/athletes.ownProfile.test.ts`, `athletes.write.test.ts` — existing coverage for the owner-scoped write endpoints
- `client/lib/manageApi.ts:74-82,162-177` — `toEditHighlights`, `toHighlightsRequest`
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:1224-1228` — the highlight add-form's free-text date input
- `app/AGENTS.md` — service/repository/controller conventions
- **[STRICT]** root `AGENTS.md`: AI must not run Prisma CLI commands. None are needed here — no schema change, no migration.

### Plan
- `common/`: add the optional field to `setHighlightInputSchema`, mirroring the response schema's type.
    - Snippet:
      ```ts
      const setHighlightInputSchema = z.object({
        title: z.string().min(1).max(200),
        detail: z.string().max(2000).optional(),
        resultUrl: z.string().url().optional(),
        // The column has always existed and the response has always returned it;
        // only the write path was missing, so a typed date was silently dropped.
        occurredOn: z.string().date().optional(),
        photoRefs: z.array(mediaRefSchema).max(12).optional(),
      });
      ```
  Then run `npm run build --prefix common`.
- `app/`: widen `HighlightInput` with `occurredOn?: Date` and pass it into `replaceHighlights`'s `createMany` data mapping alongside `title`/`detail`/`resultUrl`/`photoRefs`.
- `app/`: in `AthleteService.replaceMyHighlights`, convert the ISO date string to a `Date`, leaving it undefined when absent so the column stays null.
    - Snippet:
      ```ts
      input.highlights.map((highlight) => ({
        title: highlight.title,
        detail: highlight.detail,
        resultUrl: highlight.resultUrl,
        occurredOn: highlight.occurredOn ? new Date(highlight.occurredOn) : undefined,
        photoRefs: highlight.photoRefs ?? [],
      }))
      ```
- **[STRICT] Time-zone rule for the write path.** The read side is `toDateOnly = value.toISOString().slice(0, 10)` (`AthleteService.ts:392`). Because `occurredOn` is `@db.Date`, Prisma returns it at UTC midnight, so that read is lossless. The write side is where a day can be lost, and the rule is exact:
  - **Do** construct from the bare ISO date string: `new Date('2026-04-20')` — ISO date-only strings parse as **UTC** midnight per spec, which round-trips through `toDateOnly` unchanged.
  - **Do not** append a time component (`new Date('2026-04-20T00:00:00')`) — no-offset date-*time* strings parse as **local** midnight, which in any positive UTC offset serialises back as `2026-04-19`.
  - **Do not** use `new Date(year, month, day)` or any local-time constructor, for the same reason.
  - `z.string().date()` already guarantees the input is exactly `YYYY-MM-DD`, so the safe form is the only form needed.
  - Add a round-trip test that runs under a non-UTC `TZ` (e.g. `TZ=Pacific/Auckland`, UTC+12/13) — under UTC the buggy and correct forms are indistinguishable, so a UTC-only test proves nothing.
- Extend the existing owner-profile API tests to cover the round trip: PUT a highlight with `occurredOn`, GET it back, assert the same date.
- `client/`: map the field in both directions in `client/lib/manageApi.ts` — `toEditHighlights` reads `accomplishment.occurredOn` into `date`; `toHighlightsRequest` sends `occurredOn` when `date` is set. Update the stale comment block at lines 41-46.
- `client/`: change the highlight date input in the add-form to `type="date"` so it produces an ISO value natively, and format it for display in the read-only row (reuse whatever `client/lib/format.ts` offers before adding a formatter).
- Verify: add a highlight with a date → reload → date present; clear the date → reload → still cleared; confirm an old highlight with no date still renders and saves.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run
- [x] `$e2e-review` (`/e2e-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 9 - Extend inline editing to career highlights and roadmap

### Metadata
**Status:** Complete
**Prereqs:** 7, 8
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Reused the inline result editor for career highlights and added inline roadmap editing with required-field guards and autosave serialization guards. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Apply Step 7's inline-edit pattern to the other two read-only sections, so no saved profile content requires delete-and-retype.

**Done When:**
- Saved Career Highlight rows can be edited in place — title, date, detail, results URL — with photo add/remove, capped at 12.
- Saved Roadmap rows can be edited in place — event name and date.
- The same guard applies: a highlight cannot be saved out of edit with a blank title, and a roadmap item needs both name and date.
- The editor row component from Step 7 is reused, not copy-pasted per section.
- The Arc section remains untouched.
- No API or schema change.

**References:**
- Context §4 (#4), §8 D7, §11
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:1155-1245` — Career Highlights rows and add-form
- `.../ManageProfile.tsx:1405-1465` — Roadmap rows and add-form
- `client/lib/manageApi.ts:162-208` — `toHighlightsRequest` drops blank titles; `toRoadmapRequest` drops rows missing **either** name or date (hence the stricter roadmap guard)
- `client/lib/athleteEdits.ts:10-27` — `EditHighlight`, `EditRoadmapItem`
- `common/src/zod/athlete.ts:213-256` — highlight/roadmap set-replace inputs and their caps
- **Step 8 is a prereq for a reason:** it makes the highlight `date` actually persist and turns it into a real date input. Build the inline editor against the post-Step-8 behaviour — do not reintroduce a free-text date field here.

### Plan
- Generalise the Step 7 editor into one shared component alongside `SectionCard`/`ItemMenu`/`PhotoUploader`, parameterised by its fields and whether it takes photos, so highlights and races share one implementation.
- Wire `onEdit` into the Career Highlights `ItemMenu` and render the shared editor with title / date (date input, per Step 8) / detail / results-URL fields and the photo uploader.
- Wire `onEdit` into the Roadmap `ItemMenu` with name and date fields only (no photos — `setRoadmapInputSchema` carries none).
- Apply the per-section save guards described in Done When, each with a why-comment naming the mapper that would otherwise drop the row.
- Re-check drag-reorder and Move up / Move down still behave with an expanded row in the list.
- Verify: edit a saved highlight's photos and detail → autosave → reload → persists; edit a roadmap date → reload → persists; confirm the public profile reflects both.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 10 - Guided, paced account creation

### Metadata
**Status:** Incomplete
**Prereqs:** 1
**Size:** medium
**Owner:** ai
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Turn sign-up from a three-field form into a paced, one-question-at-a-time moment that already feels like building a profile (feedback item 7, at the scope the user chose).

**Done When:**
- `/sign-up` presents its three fields one pane at a time — name, then email, then password — inside one card, with progress dots and a back control.
- Enter advances; the final pane submits.
- A small preview echoes the typed name so the athlete sees their profile begin, connecting straight to the pre-filled name from Step 1.
- Exactly one `signUp()` call fires, at the end, with the same three values. No account is created early, so back-navigation cannot duplicate an account.
- `?next=` handling via `safeAuthDestination`, the `passwordIsStrong` check, `PasswordStrengthMeter`, and `toAuthErrorView` (including the "sign in instead" link on a taken email) all behave exactly as today.
- Every pane is keyboard-reachable with visible focus; transitions are disabled under `prefers-reduced-motion`.
- The page still works as a client component under the static-export build.

**References:**
- Context §4 (#7), §8 D8, §11, §12
- `client/app/(marketing)/sign-up/SignUpForm.tsx` — the full current form, including the `Field` helper and the error branch
- `client/app/(marketing)/sign-up/page.tsx` — the card shell and heading copy
- `client/lib/session.ts:74-97` — `signUp` in both modes
- `client/lib/authRedirect.ts` — `safeAuthDestination`, `authHref`
- `client/lib/authErrors.ts` — `toAuthErrorView`
- `client/lib/passwordStrength.ts`, `client/components/ui/PasswordStrengthMeter.tsx`
- `client/styles/globals.css:121,242,275` — existing `prefers-reduced-motion` blocks to extend
- `client/app/register/_components/RegHeader.tsx:64-85` — the progress-dot pattern already used in the wizard; reuse its visual language

### Plan
- Convert `SignUpForm` to hold `step` state plus controlled `name` / `email` / `password` values (password is already controlled). Keep one `<form>` and one `handleSubmit`.
    - Snippet:
      ```tsx
      const PANES = ['name', 'email', 'password'] as const;
      const [paneIndex, setPaneIndex] = useState(0);

      const advance = () => {
        if (paneIndex < PANES.length - 1) setPaneIndex((current) => current + 1);
      };
      // Enter must advance rather than submit until the last pane, or the browser
      // posts a half-filled form from pane 1.
      const onKeyDown = (event: React.KeyboardEvent) => {
        if (event.key !== 'Enter' || paneIndex === PANES.length - 1) return;
        event.preventDefault();
        if (currentPaneIsValid) advance();
      };
      ```
- Per-pane validation before advancing: non-empty name; a valid email (rely on the input's `type="email"` validity, not a hand-rolled regex); `passwordIsStrong` on the last pane, which is where today's check already lives.
- Reuse the wizard's progress-dot markup so sign-up and the wizard read as one flow.
- Render the name echo as a small card, not a full `ProfilePreview` — `ProfilePreview` depends on `useOnboarding`, which is not mounted on this route. Do not add the provider here.
- Keep the error paragraph and its conditional "sign in instead" link exactly as-is, rendered on the pane where the submit failed (the password pane).
- Add pane transitions with a CSS class and a matching `prefers-reduced-motion` override in `client/styles/globals.css` alongside the existing blocks.
- Update `client/app/(marketing)/sign-up/page.tsx` heading copy only as far as the paced framing needs; keep the "Already have an account? Sign in" footer.
- Verify: sign up end to end in `api` mode → lands on `/register/personal-basics` with the name pre-filled (Step 1); repeat with `?next=/register/review`; repeat with an already-registered email and confirm the error and sign-in link; tab through every pane; run with reduced motion on.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
