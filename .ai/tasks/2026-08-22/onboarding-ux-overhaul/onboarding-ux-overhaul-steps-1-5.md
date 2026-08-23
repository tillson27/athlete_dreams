# Onboarding & Profile-Creation UX Overhaul - Steps 1-5

## Step 1 - Seed the wizard's name from the signed-in account

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Seeded API-mode wizard drafts from the signed-in account name without overwriting existing drafts or dirty local edits. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Stop the wizard asking for the athlete's name immediately after sign-up collected it (feedback item 1).

**Done When:**
- Signing up as "Maya Okafor" in `api` mode and landing on `/register/personal-basics` shows "Maya Okafor" already in the name field.
- An athlete resuming an existing draft still sees the draft's persisted `fullName`, never the account display name.
- Typing in the name field before the draft request resolves is never overwritten by the seed or by a late draft response.
- `ProfilePreview` and the name field agree at all times (today the preview already falls back to `session?.name` while the field is blank — that inconsistency is gone).

**References:**
- Context §4 (#1), §8 D1, §11, §12
- `client/app/register/_components/OnboardingContext.tsx:122-171` — `ApiOnboardingProvider`, `dirtyRef`, the hydrate effect
- `client/lib/session.ts:32-42,74-97` — `seedOnboardingName`, mock-only today; `authRecordToSession` maps `user.displayName` → `session.name`
- `client/app/register/personal-basics/PersonalBasicsForm.tsx:69-78` — the name field
- `client/app/register/_components/ProfilePreview.tsx:24` — existing `session?.name` fallback

### Plan
- In `ApiOnboardingProvider`, extend the existing hydrate effect so a `null` draft seeds the account name instead of leaving `emptyOnboardingProfile`. Guard on `dirtyRef` so a fast typist is never clobbered, and use a functional update so it cannot read stale state.
    - Snippet:
      ```tsx
      const { session, ready } = useSession();
      // ...
      loadDraftProfile()
        .then((draft) => {
          if (!active) return;
          if (draft) {
            rememberDraft(draft);
            if (!dirtyRef.current) setProfile(profileToOnboarding(draft));
            return;
          }
          // No draft yet: the account already collected the athlete's name at
          // sign-up, so the wizard must not ask for it again.
          const accountName = session?.name?.trim();
          if (!accountName || dirtyRef.current) return;
          setProfile((current) => (current.name.trim() ? current : { ...current, name: accountName }));
        })
      ```
- Confirm the effect's dependency list still only re-runs on the sign-in flip (the existing `eslint-disable-next-line react-hooks/exhaustive-deps` comment documents why); read `session` through a ref if the linter would otherwise force a re-run on every session refresh.
- Leave `MockOnboardingProvider` and `client/lib/session.ts` `seedOnboardingName` untouched — mock mode already has parity.
- In `PersonalBasicsForm`, keep the field fully editable and add one short hint under it that the name came from the account and can be changed. Do not add a new field, label, or step (`client/AGENTS.md` minimalism).
- Verify by hand in `api` mode: fresh sign-up → name pre-filled; edit the name → advance → return to Step 1 → the edited name persists (it is now the draft's `fullName`).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - Add the story-answer contract to `common/`

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Added the shared story-answer question ids, schemas, and exported types in `common/`. Validated with `npm run build --prefix common` and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Give the wizard's structured story answers a typed shape in `fad-common` so Step 3 never invents a request/response shape inside `client/` (root `AGENTS.md` [STRICT] rule).

**Done When:**
- `common/src/zod/athlete.ts` exports `ATHLETE_STORY_QUESTION_IDS`, `athleteStoryAnswerSchema`, `athleteStoryAnswersSchema`, and the `AthleteStoryAnswers` type.
- The symbols are importable as `import { athleteStoryAnswersSchema } from 'fad-common'`.
- `npm run build --prefix common` succeeds and the workspace consumers see the fresh types.
- No Prisma migration and no endpoint change are introduced.

**References:**
- Context §8 D2, §9
- `common/AGENTS.md` — schema-first workflow, `.strict()` guidance, rebuild requirement
- `common/src/zod/athlete.ts:85-119` — `athleteProfileSchema`, note `presentation: z.record(z.unknown())`
- `common/src/zod/athlete.ts:163-186` — `updateAthleteProfileRequestSchema` already accepts `presentation`
- `common/src/index.ts` — barrel export style

### Plan
- Add the schemas near the other athlete content schemas in `common/src/zod/athlete.ts`. Keep the question ids as a `const` tuple so the client can iterate them without a second source of truth.
    - Snippet:
      ```ts
      // The onboarding wizard's structured story prompts. Stored inside the
      // profile's untyped `presentation` blob (wizard input, not public content),
      // so this schema is what gives that corner of the blob a checked shape.
      export const ATHLETE_STORY_QUESTION_IDS = ['origin', 'chasing', 'hardest', 'corner'] as const;

      export type AthleteStoryQuestionId = (typeof ATHLETE_STORY_QUESTION_IDS)[number];

      export const athleteStoryAnswerSchema = z.object({
        selections: z.array(z.string().max(80)).max(8),
        extraWords: z.string().max(500).optional(),
      });

      export const athleteStoryAnswersSchema = z.record(athleteStoryAnswerSchema);

      export type AthleteStoryAnswers = z.infer<typeof athleteStoryAnswersSchema>;
      ```
- Check `common/src/index.ts`: if it re-exports explicitly rather than with a wildcard, add the new symbols.
- Run `npm run build --prefix common`.
- Do **not** add these to `athleteProfileSchema` or to any request schema — they travel inside the existing `presentation` record, which already validates as `z.record(z.unknown())`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Story step: specific questions that seed an editable draft

### Metadata
**Status:** Complete
**Prereqs:** 1, 2
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Replaced vague story scaffolds with structured multi-select prompts, editable generated prose, no-clobber behavior, and `presentation.storyAnswers` persistence that merges onto existing presentation keys. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Replace the vague "Your story" blank box with specific multi-select questions whose answers generate editable draft prose (feedback item 2, per the user's chosen model).

**Done When:**
- Step 1 of the wizard presents four specific questions, each with a multi-select chip set and an optional free-text "in your own words" input.
- Selecting chips writes draft prose into the story field; the athlete can rewrite every word of it.
- Once the athlete edits the generated text, further chip changes never overwrite it — a "Rewrite from my answers" button appears instead.
- Answers persist to `presentation.storyAnswers` and rehydrate on wizard resume, with chips re-selected.
- The step-1 PATCH merges onto the draft's existing `presentation` blob; `arcSubtitle`, `arcChapters`, `training`, `highlightTones`, and `raceTones` are provably preserved.
- The story field still maps to `storyBody` paragraphs exactly as today.
- The step does not get longer to read than it is today — questions replace the blank box, they do not stack on top of it.

**References:**
- Context §4 (#2), §7, §8 D2/D3, §9, §11, §12
- `client/app/register/personal-basics/PersonalBasicsForm.tsx:14-20,97-126` — today's `storyPrompts` scaffolding chips and the bio textarea (both replaced)
- `client/lib/onboardingApi.ts:56-98,155-188` — `paragraphsFromBio`, `toStep1Patch`, `profileToOnboarding`
- `client/lib/manageApi.ts:34-66,255-265` — the [STRICT] note on `presentation` being a whole-blob replace, and `toMergedPresentation` as the pattern to mirror
- `client/app/register/_components/onboardingProfile.ts` — framework-free view model
- `client/app/register/values-social/ValuesSocialForm.tsx:70-89` — the established chip markup (`aria-pressed`, `rounded-full`, active/inactive classes) to reuse

### Plan
- Create `client/lib/storyDraft.ts` — framework-free (no React, no `'use client'`), same rationale as `onboardingProfile.ts`. It owns the question set and the pure composer.
    - Snippet:
      ```ts
      import { ATHLETE_STORY_QUESTION_IDS, type AthleteStoryAnswers } from 'fad-common';

      export type StoryQuestion = {
        questionId: (typeof ATHLETE_STORY_QUESTION_IDS)[number];
        prompt: string;
        options: string[];
        // Turns the picked options into one sentence, e.g.
        // ['Family', 'Watching a race'] -> "I got into running through my family,
        // and a race I watched as a kid."
        toSentence: (selections: string[]) => string;
      };

      export const STORY_QUESTIONS: StoryQuestion[] = [ /* origin, chasing, hardest, corner */ ];

      /** Public API contract: pure. Same answers always compose the same draft. */
      export function composeStoryDraft(answers: AthleteStoryAnswers): string {
        // one paragraph per answered question; extraWords appended in the
        // athlete's own voice; blank-line separated so `paragraphsFromBio` splits it.
      }
      ```
- Write question copy that is answerable in one tap and running-specific (the wizard is running-only — `onboardingApi.ts:45`, `onboardingProfileView.ts:22`). Suggested set, matching the ids from Step 2: `origin` ("What got you into running?"), `chasing` ("What are you chasing right now?"), `hardest` ("What's been the hardest part?"), `corner` ("Who's in your corner?").
- Extend `OnboardingProfile` with `storyAnswers: AthleteStoryAnswers` (default `{}`) in `client/app/register/_components/onboardingProfile.ts` and `emptyOnboardingProfile`.
- Rewrite the story block in `PersonalBasicsForm`: render `STORY_QUESTIONS` as chip groups + a bounded free-text input each, then the story textarea below, labelled as the draft the athlete owns. Delete the old `storyPrompts` array and `insertPrompt`.
- Implement the no-clobber rule with a ref holding the last generated text.
    - Snippet:
      ```tsx
      const lastGeneratedRef = useRef('');
      const applyAnswers = (nextAnswers: AthleteStoryAnswers) => {
        const draft = composeStoryDraft(nextAnswers);
        const athleteEditedTheirStory =
          profile.bio.trim().length > 0 && profile.bio !== lastGeneratedRef.current;
        if (athleteEditedTheirStory) {
          update({ storyAnswers: nextAnswers });  // offer "Rewrite from my answers"
          return;
        }
        lastGeneratedRef.current = draft;
        update({ storyAnswers: nextAnswers, bio: draft });
      };
      ```
- Persist and rehydrate the answers through `client/lib/onboardingApi.ts`:
  - `toStep1Patch` gains a `presentation` key built by merging `{ storyAnswers }` onto the draft's current blob. Give it the draft's presentation as an argument rather than reaching for global state, mirroring `toMergedPresentation` in `manageApi.ts`.
  - `profileToOnboarding` parses `apiProfile.presentation?.storyAnswers` with `athleteStoryAnswersSchema.safeParse` and falls back to `{}` — never throw on a malformed blob.
  - `saveStep1` passes `draftRef.current` (already threaded in from `OnboardingContext`) through so the merge base is the freshly loaded draft.
- Update `OnboardingContext` only as far as needed to thread the draft's presentation into `saveStep1`; `draftRef.current` already holds the full `AthleteProfile`.
- Update `ProfilePreview`'s About block only if the composed draft renders badly there; it reads `profile.bio`, so it should need no change.
- Verify: answer chips → prose appears; edit the prose → toggle a chip → prose intact and the rewrite button shows; advance and return → chips and prose both restored; inspect the PATCH body to confirm unrelated `presentation` keys survived.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Hero/banner photo inside the profile-creation flow

### Metadata
**Status:** Complete
**Prereqs:** 3
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Added a step-1 hero photo picker using the existing image pipeline, preview rendering, and `heroMediaUrl` save/rehydration. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Let athletes set their hero/banner image during profile creation rather than only after publishing (feedback item 6).

**Done When:**
- Step 1 of the wizard offers a hero/banner photo picker, with the same recommendation copy the manage editor already gives for the cover photo.
- The chosen photo renders in `ProfilePreview`'s hero band instead of the hardcoded Unsplash placeholder.
- Advancing Step 1 saves it to `heroMediaUrl`; resuming the wizard restores it.
- The photo is optional — the step advances without one, falling back to today's stock preview image.
- HEIC/iPhone photos work (the existing pipeline handles them), and a failed file shows one plain sentence without blocking the step.
- The picker replaces rather than accumulates: exactly one hero photo.

**References:**
- Context §4 (#6), §8 D5, §11, §5 (payload-size note)
- `client/lib/imageUploads.ts` — `filesToPersistedImageRefs`, `COVER_IMAGE_OPTIONS` (1920px / 1,000,000 chars), `IMAGE_UPLOAD_ACCEPT`, `toImageUploadErrorMessage`, `PrepareImagesProgress`
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:981-1013` — the cover-photo uploader and its `Recommendation` copy to mirror
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:1502-1550` — `PhotoUploader` with `multiple={false}` semantics
- `client/app/register/_components/ProfilePreview.tsx:10-11,48-68` — the hardcoded `previewPhoto` and hero band
- `common/src/zod/athlete.ts:182` — `heroMediaUrl: mediaRefSchema.optional()` on the update request (already exists)
- `common/src/zod/shared.ts` — `mediaRefSchema` accepts `data:image/(jpeg|png|webp);base64,...` up to 1,250,000 chars

### Plan
- Add `heroPhoto?: string` to `OnboardingProfile` and `emptyOnboardingProfile`.
- Add a single-photo picker to `PersonalBasicsForm`, above or beside the name field so the preview payoff is immediate. Reuse the existing pipeline; do not write a second image path.
    - Snippet:
      ```tsx
      const [uploadProgress, setUploadProgress] = useState<PrepareImagesProgress | null>(null);
      const [uploadError, setUploadError] = useState<string | null>(null);

      const pickHero = (files: FileList) => {
        setUploadError(null);
        void filesToPersistedImageRefs(files, COVER_IMAGE_OPTIONS, setUploadProgress)
          .then(({ refs, failures }) => {
            if (refs[0]) update({ heroPhoto: refs[0] });
            if (failures[0]) setUploadError(failures[0]);
          })
          .catch((error: unknown) => setUploadError(toImageUploadErrorMessage(error)))
          .finally(() => setUploadProgress(null));
      };
      ```
- Mirror the manage editor's recommendation sentence (wide 16:9 landscape, ≥1920×1080, JPG/PNG/WebP/HEIC, faces near centre) rather than inventing new guidance — but keep it to one line here, since the wizard is the more minimal surface.
- Give the picker a Remove control that clears `heroPhoto` back to the stock preview.
- `ProfilePreview`: render `profile.heroPhoto` when set, else `previewPhoto`. Data-URL sources need `unoptimized` on `next/image`, matching how the manage editor renders uploaded photos.
- `client/lib/onboardingApi.ts`:
  - `toStep1Patch` adds `heroMediaUrl` when `profile.heroPhoto` is a non-empty string.
  - `profileToOnboarding` maps `apiProfile.heroMediaUrl ?? undefined` back to `heroPhoto`.
- Do not touch `toCreateRequest` — `createAthleteProfileRequestSchema` has no `heroMediaUrl`; the hero rides the step-1 PATCH that immediately follows create.
- Verify: pick a large iPhone HEIC → it downscales and previews; advance → reload the wizard → the hero is still there; check the manage editor's cover photo shows the same image.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 - Values step: free-text values alongside the presets

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-23
**Completion Notes:** Added custom free-text values, raised the selection cap to five, surfaced duplicate/cap feedback, and deleted the dead `ValueChips.tsx` duplicate. Validated via `$frontend-review` (`/frontend-review`) and `$ci` (`/ci`); left uncommitted per `$step-loop-no-commit` (`/step-loop-no-commit`).

### Context

**Objective:** Let athletes add their own values instead of being confined to twelve presets (feedback item 5).

**Done When:**
- The values step keeps its preset chips and adds a bounded free-text input that appends a custom value as a selectable chip.
- Custom values are trimmed, capped at 40 characters with a live counter, and rejected as case-insensitive duplicates of an already-selected value.
- The selection cap rises from 3 to 5, with an inline hint when the cap is reached (no silent drop).
- Custom values persist through save → resume → publish and render on the public profile's values row.
- `client/app/register/values-social/ValueChips.tsx` is deleted.

**References:**
- Context §4 (#5), §8 D4, §11
- `client/app/register/values-social/ValuesSocialForm.tsx:11-25,31-41,66-90` — the preset list, `MAX_VALUES`, `toggleValue`, chip markup
- `client/app/register/values-social/ValueChips.tsx` — dead, unreferenced duplicate with a divergent 15-value list; grep confirms no importer
- `common/src/zod/athlete.ts:174` — `values: z.array(z.string().max(40)).max(8)` — the contract already allows free text; **no schema change needed**
- `client/lib/onboardingApi.ts:102-109` — `toStep3Patch` already filters blanks and sends `values` verbatim
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx:1332-1405` — the Core Values section, precedent for free-text values in this product

### Plan
- Raise `MAX_VALUES` to 5 (contract ceiling is 8; 5 keeps the profile's value row readable) and update the label copy.
- Add the custom-value input below the preset chips.
    - Snippet:
      ```tsx
      const addCustomValue = (raw: string) => {
        const value = raw.trim().slice(0, MAX_VALUE_LENGTH);
        if (!value) return;
        update((current) => {
          const alreadyChosen = current.values.some(
            (entry) => entry.toLowerCase() === value.toLowerCase(),
          );
          if (alreadyChosen || current.values.length >= MAX_VALUES) return {};
          return { values: [...current.values, value] };
        });
      };
      ```
  - Submit on Enter and on an explicit Add control; both paths run the same normaliser.
  - Surface why nothing happened when the value was a duplicate or the cap was hit — an inline sentence, not a silent no-op.
- Render selected custom values as chips in the same row as the presets so a selected value always looks the same however it was created; a custom chip needs a remove affordance since it has no preset to toggle against.
- Define `MAX_VALUE_LENGTH = 40` in the form and reference the contract in a short why-comment, so the cap is provably tied to `z.string().max(40)`.
- Delete `client/app/register/values-social/ValueChips.tsx` and confirm with a repo-wide grep that nothing imports it.
- Verify: add a custom value → advance → return → chip still selected; publish → the value shows in the public profile's values row (`AthleteProfile.tsx:386`).

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
