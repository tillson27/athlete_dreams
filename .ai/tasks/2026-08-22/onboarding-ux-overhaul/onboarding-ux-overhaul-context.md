# Onboarding & Profile-Creation UX Overhaul (Pilot Cohort Feedback)

Date: 2026-08-22
Task slug: onboarding-ux-overhaul
Status: Draft

## 0) Summary

- **Objective:** Close seven concrete usability gaps that pilot-cohort athletes hit while creating an account, building a profile, and maintaining it afterwards — without adding fields, steps, or a database migration.
- **Why now:** FAD's go-to-market motion is hand-onboarding 10–20 athletes (`docs/product-brief.md` → Pilot plan). Every one of these gaps costs a founder-assisted onboarding session or produces a thinner profile. One of them (photos on an existing race) is a straight functional defect that forced an athlete to delete and re-enter data she had already typed.
- **Primary outcomes:**
  - The wizard never re-asks for anything the account already knows.
  - The story step asks specific, answerable questions instead of a blank box.
  - Athletes understand what "Publish" buys them (a public link for their IG bio).
  - Races, highlights, and roadmap entries are editable in place — photos included.
  - Values accept the athlete's own words, not just twelve presets.
  - The hero/banner photo can be set during profile creation, not only afterwards.
  - Sign-up reads as a paced, guided moment rather than a three-field form.
  - A career highlight's date stops being silently discarded on save.

---

## 1) Success criteria

- A brand-new athlete who signs up as "Maya Okafor" lands on `/register/personal-basics` with the name field already filled from the account, and never types it twice.
- The story step presents specific multi-select questions; picking chips produces editable draft prose in the story field, and the athlete's own edits are never silently overwritten by a later chip selection.
- An athlete who has already saved a previous race can attach photos to it (and correct its name/date/result/results-URL) from `/athletes/[slug]/manage` without deleting and re-creating the row.
- The values step accepts a custom value typed by the athlete alongside the preset chips, persisting through save → publish → public profile.
- The review step explains, in plain language and with the athlete's real `athletearc.ca` URL visible, that publishing creates a public page they can link from Instagram — and that it stays editable afterwards.
- The wizard's step 1 can set the hero/banner image; the live preview shows the athlete's own photo rather than the stock Unsplash placeholder, and the image round-trips to `heroMediaUrl`.
- Sign-up is a paced, one-question-at-a-time card that still submits exactly one `signUp()` call with the same three fields, and still honours `?next=`.
- A date entered on a career highlight survives save and reload, and renders on the public profile.
- The follow control and the Stripe payout card each carry one quiet "coming soon" label, and both still work exactly as before.
- A real athlete's profile no longer renders a blank where the follower count belongs.

**Acceptance criteria (definition of done):**
- `npm run ci` passes (`type-check`, `lint:fix`, `build`) with no errors.
- No Prisma migration is introduced by this task.
- No new API endpoint is introduced by this task. The `common/` changes are the additive story-answer schema and one additive optional field on `setHighlightInputSchema`.
- Every changed wizard field survives a full round trip: save → reload `/register/...` (resume from `GET /v1/athletes/me`) → same values rendered.
- `client/app/register/values-social/ValueChips.tsx` (dead, unreferenced duplicate) is deleted.
- The wizard's saves never clobber `presentation` keys owned by the manage editor (`highlightTones`, `raceTones`, `arcChapters`, `arcSubtitle`, `training`).

---

## 2) Scope and non-goals

**In scope:**
- `client/` onboarding wizard (`client/app/register/`), sign-up (`client/app/(marketing)/sign-up/`), and the profile editor (`client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx`).
- One additive schema in `common/src/zod/athlete.ts` so the wizard's structured story answers have a typed shape rather than an ad-hoc client-only object.
- Copy changes on `client/app/register/page.tsx` (the "How to Build Your Epic" guide) so the advertised steps match what the wizard actually asks.
- Minimal "coming soon" labels on two built-but-unfinished surfaces — the follow graph and Stripe payouts — plus hiding the fabricated follower count. **Label-only; neither feature is disabled.** See §8 D10.
- One narrow full-stack fix (`common/` + `app/` + `client/`) to stop discarding a career highlight's date on save — see §8 D9. Scoped in deliberately because it is the same class of complaint as feedback item 4 and because Step 9 would otherwise ship polished inline editing over a field that silently drops input.

**Out of scope:**
- Backend (`app/`) changes beyond the highlight-date write path in §8 D9. Every other gap here is client-side or already served by an existing contract — `heroMediaUrl`, free-text `values`, and per-race `photoRefs` are all already in `common/src/zod/athlete.ts` and already round-trip through the existing PATCH/PUT endpoints.
- Prisma migrations. Structured story answers ride the existing untyped `presentation` blob (see §8 D2), and the highlight-date fix targets a column that already exists (§8 D9).
- A `displayDate` free-text column on highlights, mirroring races. That would need a migration; §8 D9 uses a real date input against the existing `occurredOn` column instead.
- The equivalent `occurredOn` write gap on **races**. This is a design call, not scope discipline: races are **not** symmetric with highlights. A highlight has *only* `occurredOn`, so the date an athlete types is destroyed — a defect. A race has a **required, deliberately free-text `displayDate`** that legitimately holds non-dates: `'Date TBD'` is the wizard's own placeholder constant (`client/lib/onboardingApi.ts:50`, `client/lib/manageApi.ts:70`), and athletes can write "Fall 2025". Adding `occurredOn` to races therefore means adding a *second* date field beside the free-text one, with nothing reading it — a new field for zero present user benefit, against the `client/AGENTS.md` minimalism mandate. Revisit only when something actually needs chronological sorting or date filtering on results; at that point the right shape is a date picker that writes both `occurredOn` and a formatted `displayDate`, which is still migration-free.
- Building the real follower count, follower notifications, or the unused `followedOnly` feed filter. Step 11 labels the follow surface; the underlying work is a separate task (§8 D10).
- Real object-storage image upload. Photos remain client-downscaled data-URL refs via `client/lib/imageUploads.ts`, exactly as today.
- The Arc/journey timeline editor. It is being moved to its own page by the pending `.ai/tasks/2026-08-16/arc-editor/` plan; this task must not touch that section (see §5).
- Campaign creation/editing, donations, and Stripe Connect **behaviour**. Step 11 adds a label to the Stripe payout card and changes nothing else about it — no call path, no gating, no copy beyond the label.
- Changing publish *semantics*. `assertPublishable` (`app/src/api/athletes/AthleteService.ts:239`) still requires `storyIntro` + ≥1 personal best; only the explanation around the button changes.
- A ground-up sign-up redesign or gamified concept exploration. The chosen scope is a paced re-presentation of the existing three fields.

**Out-of-scope edge cases:**
- An athlete whose account `displayName` differs from the name they want on their public profile: the seeded name is a pre-filled default, freely editable; no reconciliation logic or "sync with account" affordance is built.
- Concurrent editing of the same profile from two tabs/devices. Saves are last-write-wins per the existing set-replace contract; no locking or conflict UI is added.
- Migrating story answers for athletes who completed the old free-text wizard. Their `storyBody` prose is preserved as-is and the new questions simply start unanswered.
- Localisation of the question/value chip copy. English-only, matching the rest of the product.

---

## 3) Background and motivation

FAD (Fund an Athlete's Dream / ARC) is a story-first athlete funding network. `docs/product-brief.md` names athletes as the primary user — "amateur to pro, not necessarily technical, often first-time fundraisers" — and `client/AGENTS.md` makes minimalism and story-first non-negotiable design mandates: every page must read in under 10 seconds, and the athlete's story leads over metrics.

The pilot cohort is being hand-onboarded, so every friction point surfaces as direct feedback rather than an analytics dip. Seven items came back:

1. The wizard re-asks for the athlete's name immediately after the account collected it.
2. "Your story" is too vague a prompt; athletes want to be asked something answerable.
3. The Publish button's value is unclear — nobody explained it produces a public link for an Instagram bio.
4. Adding photos to an already-created race required deleting and re-creating the race.
5. The twelve preset values are limiting; athletes want their own words.
6. The hero/banner photo can only be changed after the profile exists.
7. Account creation feels like a generic form rather than the start of something.

Items 1, 4, and 6 are defects or omissions. Items 2, 3, 5, and 7 are experience gaps that directly weaken the story-first differentiator.

---

## 4) Current state and gaps

### Current state

**Account creation**
- `client/app/(marketing)/sign-up/SignUpForm.tsx` renders three stacked fields (`displayName`, `email`, `password`) plus `PasswordStrengthMeter`, then calls `signUp({ name, email, password })` and pushes to `safeAuthDestination(searchParams.get('next'), '/register/personal-basics')`.
- `client/lib/session.ts:74` — in `api` mode `signUp` posts `{ email, password, displayName }` and writes `{ accessToken, user, published, isAdmin }` to the `arc-auth` browser store. `authRecordToSession` maps `user.displayName` → `session.name`.

**The wizard (`client/app/register/`)**
- Four steps: `personal-basics` → `athletics` → `values-social` → `review`, gated by `OnboardingStepGate` and coordinated by `OnboardingContext`.
- `OnboardingContext.tsx` has two providers. `ApiOnboardingProvider` hydrates from `loadDraftProfile()` (`GET /v1/athletes/me`); a 404 leaves `emptyOnboardingProfile` in place. `saveAndAdvance(step)` calls `saveStep1|2|3` from `client/lib/onboardingApi.ts`; `publish()` calls `POST /v1/athletes/me/publish`.
- `client/lib/onboardingApi.ts` owns the whole field mapping: `name` → `athleteSlug` + `fullName`, `location` → `hometown`, `bio` → `storyBody[]`, `mission` → `storyIntro`, `values` → `values`, plus set-replace calls for personal bests / highlights / races.
- `client/app/register/_components/onboardingProfile.ts` is the framework-free view model: `{ name, location, bio, personalBests, careerHighlights, previousRaces, values, mission }`.
- `ProfilePreview.tsx` renders a live browser-chrome mock of the public profile beside every step.

**The profile editor**
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` (1,902 lines) holds mock and API providers plus `EditorLayout`. `client/lib/manageApi.ts` maps `AthleteEdits` ⇄ the API DTOs and saves via one PATCH plus five set-replace PUTs.
- Personal bests, core values, and Arc chapters render as **inline editable** rows. Career highlights, previous races, and roadmap render as **read-only** rows with an `ItemMenu` offering only Move up / Move down / Delete, plus a display-only `PhotoStrip`.
- Photos for a highlight or race can only be attached through the "add" form at the bottom of each section (`highlightPhotos` / `racePhotos` staged state, `ManageProfile.tsx:556-643`).

**Contracts already in place**
- `common/src/zod/athlete.ts`: `values: z.array(z.string().max(40)).max(8)` (free text already legal), `heroMediaUrl: mediaRefSchema.optional()` on `updateAthleteProfileRequestSchema`, `photoRefs: z.array(mediaRefSchema).max(12).optional()` on both the highlight and race set-replace inputs, and `presentation: z.record(z.unknown()).optional()`.

### Gaps

- **(#1) Name re-asked.** `client/lib/session.ts:37` `seedOnboardingName()` is only called on the **mock** path (`session.ts:95`). In `api` mode nothing seeds the wizard, and `ApiOnboardingProvider`'s hydrate leaves `profile.name` empty after a 404, so `client/app/register/personal-basics/PersonalBasicsForm.tsx:73` renders a blank "Your name". `ProfilePreview.tsx:24` already falls back to `session?.name` — the preview shows the name the form is asking for, which is exactly the inconsistency athletes noticed.
- **(#2) Vague story prompt.** `PersonalBasicsForm.tsx:14-20` offers five `storyPrompts` chips that insert bare scaffolds ("What got me started: ") into an otherwise blank textarea. The athlete still faces a blank page.
- **(#3) Unexplained publish.** `client/app/register/review/PublishPanel.tsx` shows a checkbox, a button, and one line — "Your profile will be live immediately upon publishing." The public URL and the share-to-Instagram payoff only appear in the **post**-publish success screen (`PublishPanel.tsx:164-176`), after the decision has been made. The existing IG Story/Post share-card exporter (`client/app/(marketing)/athletes/[athleteSlug]/ShareCard.tsx`) is never referenced during the decision.
- **(#4) Cannot add photos to an existing race.** `ManageProfile.tsx:1248-1330` (Previous Races) and `:1155-1245` (Career Highlights) render saved rows read-only. `ItemMenu` (`:1748`) offers no Edit. `PhotoStrip` (`:1570`) is display-only. The only path to a photo is the add-form, so the athlete must delete and re-type the row. `client/lib/manageApi.ts:179-197` already round-trips `photoRefs` on save, so **this is purely a missing client affordance — no API work.**
- **(#5) Values are preset-only.** `client/app/register/values-social/ValuesSocialForm.tsx:11-25` hardcodes twelve values and `MAX_VALUES = 3`, with no free-text entry — even though the contract allows any string ≤40 chars, up to 8. (The manage editor's Core Values section *is* free text, so the wizard is the odd one out.) `client/app/register/values-social/ValueChips.tsx` is an unreferenced dead duplicate with a divergent fifteen-value list.
- **(#6) No hero image in the wizard.** `OnboardingProfile` has no image field; `ProfilePreview.tsx:10-11` hardcodes a stock Unsplash photo; `toStep1Patch` never sends `heroMediaUrl`. The cover photo is only settable at `ManageProfile.tsx:983-1012`, after publish.
- **(#7) Generic sign-up.** Three stacked fields on a card, no pacing, no preview, no sense of building anything.

---

## 5) Changes and considerations

**Significant changes:**
- `OnboardingProfile` grows three fields — `storyAnswers`, `heroPhoto`, and nothing else structural — so the wizard view model still matches the shape `client/lib/onboardingProfileView.ts` and `client/lib/onboardingApi.ts` both read.
- A new pure module composes selected story-answer chips into draft prose, with an explicit rule for when regeneration is allowed (§12).
- Career-highlight, previous-race, and roadmap rows in the manage editor become expandable inline editors reusing the existing `PhotoUploader`.
- Sign-up becomes a three-pane paced card driven by local step state; the network call is unchanged and still fires once.

**Impact and considerations:**
- **Concurrent task collision.** `.ai/tasks/2026-08-16/arc-editor/` is an *incomplete* plan that refactors `ManageProfile.tsx` — it extracts the Arc section into `/manage/arc` and replaces it with a summary card. Steps 7–8 of this task touch the **Career Highlights / Previous Races / Roadmap** sections and the shared `ItemMenu` helper. Keep edits out of the Arc section (`ManageProfile.tsx:~860-970`) and expect to rebase around it, per the root `AGENTS.md` concurrent-agent rule.
- **`presentation` is a whole-blob replace.** `client/lib/manageApi.ts:55-61` documents this explicitly: a bare `{ training, arcChapters }` PATCH silently reshuffles featured results. The wizard has never sent `presentation`; once it does (story answers), it **must** merge onto the draft's current blob the same way `toMergedPresentation` does.
- **Payload size.** Photos are base64 data-URL refs bounded by `mediaRefSchema`'s 1,250,000-character cap. `COVER_IMAGE_OPTIONS.maxLength` is 1,000,000 and `PROFILE_IMAGE_OPTIONS.maxLength` is 850,000, so adding a hero to the wizard adds up to ~1 MB to the step-1 PATCH. Acceptable for the pilot; noted as a known constraint, not solved here.
- **Publish guard unchanged.** The clarified copy must not imply the profile publishes without a tagline and a personal best — `toPublishChecklist` in `client/lib/onboardingApi.ts:277-293` already surfaces those two, and the new explanation sits alongside it.
- **Static export.** `client/.env.example` documents `STATIC_EXPORT`; the sign-up rework must stay a client component with no new dynamic-route or server-only dependency.

---

## 6) Constraints, assumptions, dependencies

**Constraints:**
- **[STRICT]** Minimalism (`client/AGENTS.md`): the story step may not become longer to read. Questions replace the blank box; they do not stack on top of it.
- **[STRICT]** API types come from `fad-common`; no request/response shape may be redefined in `client/`.
- **[STRICT]** No Prisma CLI usage and no manual migration files (root `AGENTS.md`). This task is designed to need neither.
- Touch targets stay ≥44 px (`min-h-11` is the established convention across the wizard and editor).
- `@media (prefers-reduced-motion: reduce)` blocks already exist in `client/styles/globals.css` (lines 121, 242, 275); any new transition must be covered there.
- Server Components by default; `'use client'` only where interactivity demands it (`client/AGENTS.md`).

**Assumptions:**
- The "race she had already created" in the feedback is a **Previous Race** row on the profile (`ManageProfile.tsx` → Previous Races), not a campaign. There is no self-serve campaign creation UI in `client/` — campaigns are admin-surfaced only — and the Previous Races section reproduces the reported behaviour exactly.
- `user.displayName` is the athlete's real name and is an acceptable default for `fullName`. Sign-up labels the field "Full name" today, so this holds.
- Running remains the only launch discipline (`client/lib/onboardingProfileView.ts:22` and `onboardingApi.ts:45` both hardcode it), so story questions can use running-specific chip vocabulary.

**Dependencies (ordered):**
- The `common/` story-answer schema must land and `npm run build --prefix common` must run before the client consumes the type.
- Name seeding (Step 1) precedes the sign-up rework (Step 10), because the guided sign-up's payoff is the name flowing straight into the wizard.
- The inline-edit row pattern (Step 7) precedes its second application (Step 9).
- The highlight-date fix (Step 8) precedes inline highlight editing (Step 9), so the inline editor is built against a date field that actually persists.

---

## 7) Requirements

**Functional requirements:**
- On wizard entry with no existing draft, `profile.name` defaults to the signed-in account's display name; an existing draft's `fullName` always wins.
- The story step presents 3–4 specific questions, each a multi-select chip set with an "add your own words" free-text input.
- Selecting or deselecting chips regenerates the draft story **only** when the story field is empty or still holds exactly the previously generated text; otherwise the athlete is offered an explicit "Rewrite from my answers" action.
- Story answers persist and rehydrate on wizard resume.
- The values step accepts custom free-text values alongside presets, trimmed, deduplicated case-insensitively, ≤40 characters each, ≤5 selected total.
- The wizard's step 1 accepts a hero/banner image; it renders in `ProfilePreview` and saves to `heroMediaUrl`.
- A date entered on a career highlight is written to the existing `occurredOn` column and read back on load.
- The review step states what publishing does — public page, shareable link for an IG bio, editable afterwards — and shows the athlete's actual profile URL before they publish.
- Saved career highlights, previous races, and roadmap items are editable in place, including adding and removing photos on highlights and races.
- Sign-up presents its three fields one at a time with forward/back navigation, submitting once at the end.

**Non-functional requirements:**
- No regression in `npm run ci`.
- Every new interactive control is keyboard reachable and carries an accessible name; chip toggles keep `aria-pressed`.
- New motion respects `prefers-reduced-motion`.
- Image processing continues to run one file at a time (`client/lib/imageUploads.ts:57` documents why: iOS Safari's per-tab canvas budget).
- Error text stays one curated plain sentence — never a raw payload or status code (`client/lib/onboardingApi.ts:295-303`, `client/lib/manageApi.ts:307-314`).

---

## 8) Proposed approach

**D1 — Seed the name from the session.** In `ApiOnboardingProvider`, once the session is ready and `loadDraftProfile()` resolves `null`, apply `session.name` to `profile.name` only if the athlete has not already typed one (`dirtyRef` guards the race between hydrate and first keystroke). A draft that exists always wins, because `profileToOnboarding(draft).name` is the persisted `fullName`. The mock path already does this via `seedOnboardingName`; this brings `api` mode to parity.

**D2 — Story answers ride `presentation`, typed in `common/`.** Add `athleteStoryAnswersSchema` (a record of `questionId → { selections: string[]; extraWords?: string }`) and `ATHLETE_STORY_QUESTION_IDS` to `common/src/zod/athlete.ts`, exported from the barrel. The wizard serialises answers into `presentation.storyAnswers` and parses them back with the schema on resume.
- *Rationale:* the answers are wizard input, not public profile content; `presentation` is already `z.record(z.unknown())`, so no migration is needed, and typing the blob's shape in `common/` still satisfies the repo's "never redefine shapes in `client/`" rule.
- *Alternative considered and rejected for this batch:* a typed `storyAnswers Json?` Prisma column, as `.ai/tasks/2026-08-16/arc-editor/` does for Arc chapters. Rejected because Arc is public-facing content while these answers are scratch input, and a migration is disproportionate. Revisit if answers ever drive public UI (facets, discovery, sponsor matching).
- *Constraint:* the wizard's step-1 PATCH must merge onto `draftRef.current.presentation` — never send a bare object (see §5).

**D3 — Draft composition is a pure module.** `client/lib/storyDraft.ts` exports the question set and `composeStoryDraft(answers): string`. It is framework-free (same rationale as `client/app/register/_components/onboardingProfile.ts`), so the sentence templates are unit-verifiable and reusable. `PersonalBasicsForm` holds `lastGeneratedDraft` and only auto-writes when `bio.trim() === ''` or `bio === lastGeneratedDraft`; otherwise it surfaces a "Rewrite from my answers" button. This is the whole safety story for #2 — see §12.

**D4 — Values.** Keep the preset chips, add a bounded free-text input that appends a custom chip. Raise `MAX_VALUES` from 3 to 5 (contract ceiling is 8; 5 keeps the profile's value row readable). Normalise on entry: trim, drop empties, cap 40 chars, reject case-insensitive duplicates of an already-selected value. Delete the dead `ValueChips.tsx`.

**D5 — Hero image in step 1.** Add `heroPhoto?: string` to `OnboardingProfile`. Reuse `filesToPersistedImageRefs(files, COVER_IMAGE_OPTIONS, onProgress)` and `toImageUploadErrorMessage` from `client/lib/imageUploads.ts` — the same pipeline the manage editor's cover photo uses, including HEIC handling. `toStep1Patch` adds `heroMediaUrl` when set; `profileToOnboarding` reads it back. `ProfilePreview` renders `profile.heroPhoto` and falls back to today's stock photo.

**D6 — Publish clarity.** A "What publishing does" block above the publish control in `PublishPanel`, showing: the real `profileUrl(slug)`, three plain lines (it becomes a public page anyone can open; the link goes in your Instagram bio; you can keep editing after), and a pointer to the share-card export that already exists on the public profile. Copy only — no behaviour change, no new endpoint. Mirror the framing on the dashboard's not-yet-published state (`client/app/(marketing)/dashboard/DashboardClient.tsx:360-370`).

**D7 — Inline editing in the manage editor.** Extract one reusable expandable-row primitive alongside the existing `SectionCard`/`ItemMenu`/`PhotoUploader` helpers in `ManageProfile.tsx`, add an "Edit" entry to `ItemMenu`, and apply it to Previous Races first, then Career Highlights and Roadmap. Editing mutates the same `edits.races` / `edits.highlights` / `edits.roadmap` arrays the autosave snapshot already watches (`toSaveSnapshot`), so persistence comes for free through the existing set-replace PUTs.

**D8 — Guided sign-up.** `SignUpForm` keeps its single `<form>` and single `signUp()` call; a `step` state (0 → name, 1 → email, 2 → password) controls which field pane is visible, with progress dots, a back control, and Enter-to-advance. `safeAuthDestination`, `passwordIsStrong`, and `toAuthErrorView` behaviour are preserved exactly. A small preview card echoes the typed name so the athlete sees their profile begin.

**D9 — Persist the career-highlight date (silent data loss).** `client/lib/manageApi.ts:41-46` notes that a highlight's `date` is dropped on save. Tracing it: `app/prisma/schema.prisma:272` already has `occurredOn DateTime? @db.Date`, `athleteAccomplishmentSchema` already exposes `occurredOn`, and `AthleteService.ts:315` already reads it back. **Only the write path is missing it** — `setHighlightInputSchema` has no `occurredOn`, so `replaceMyHighlights` never sets it. The athlete types a date, autosave reports success, and the value is gone on reload.
- *Fix, no migration:* add `occurredOn: z.string().date().optional()` to `setHighlightInputSchema`; add `occurredOn?: Date` to `HighlightInput` and pass it through `replaceHighlights`'s `createMany`; map it in `AthleteService.replaceMyHighlights`; map `date` ⇄ `occurredOn` in `client/lib/manageApi.ts`.
- *The type mismatch that decides the UI:* the editor's `date` is free text ("Apr 20, 2026") while `occurredOn` is an ISO calendar date. Rather than adding a `displayDate` column (migration), the highlight date field becomes a real date input, which serialises to ISO natively, and the profile formats it for display. This also removes today's ambiguous "Date (e.g. Apr 20, 2026)" placeholder.
- *Why it belongs in this batch:* it is the same complaint as feedback item 4 — data entered, then lost — and D7's inline editing makes the field more prominent, so shipping D7 without D9 would make the defect easier to hit.
- **[STRICT] Time-zone rule.** The read side is `toDateOnly = value.toISOString().slice(0, 10)` (`AthleteService.ts:392`); since the column is `@db.Date`, Prisma returns UTC midnight and the read is lossless. The write must construct from the **bare** ISO date string (`new Date('2026-04-20')`, which parses as UTC midnight per spec). Appending a time component (`'2026-04-20T00:00:00'`) parses as *local* midnight and serialises back a day earlier in any positive UTC offset; `new Date(y, m, d)` has the same defect. `z.string().date()` guarantees a `YYYY-MM-DD` input, so the safe form is the only form needed. The round-trip test must run under a non-UTC `TZ` — under UTC the correct and buggy forms are indistinguishable.

**D10 — "Coming soon" labels, not feature gates.** Two surfaces are built but unfinished: the follow graph (the *action* works end to end — endpoints, optimistic client, tests — but the displayed follower count is a hardcoded `presentation.followersLabel` string, and following produces no notification or athlete-visible follower list) and Stripe payouts. Both get a minimal label.
- *Label-only, by explicit decision.* Disabling Stripe Connect would stop athletes receiving donations; disabling Follow would remove a working feature. Neither is acceptable for a signal that is purely about expectation-setting.
- *Minimal, by mandate.* Small muted text — no pill, border, colour fill, or icon — placed once per surface (profile hero and the Stripe card), not on every follow control. `client/AGENTS.md` requires a page to read in under 10 seconds; a badge on every feed card breaks that.
- *The follower count rides along.* `asString(presentation.followersLabel)` falls back to `''`, so a real onboarded athlete renders a blank where a number belongs, beside demo profiles claiming "9.8k". Hiding the count when empty is a conditional and removes the most visible artifact from every pilot profile. The seeded fixtures and `followersLabel` stay — removing them belongs with the real-count work.


---

## 9) Data model and contracts

### OpenAPI changes

No new endpoints. Existing endpoints already accept almost everything being sent:
- `PATCH /v1/athletes/me` — `heroMediaUrl`, `values`, `presentation` are all on `updateAthleteProfileRequestSchema`.
- `PUT /v1/athletes/me/highlights`, `PUT /v1/athletes/me/races` — `photoRefs` already on both input schemas.

One additive optional field on an existing request schema (§8 D9):

```ts
// common/src/zod/athlete.ts — setHighlightInputSchema
occurredOn: z.string().date().optional(),
```

Additive and optional, so existing clients are unaffected. It mirrors the field the **response** schema (`athleteAccomplishmentSchema`) already returns.

### Data model changes

None. No Prisma migration. `AthleteAccomplishment.occurredOn` already exists (`app/prisma/schema.prisma:272`) — D9 only wires up the write path that never populated it.

The story-answer `common/` change is additive and typed-blob-only:

```ts
// common/src/zod/athlete.ts
export const ATHLETE_STORY_QUESTION_IDS = ['origin', 'chasing', 'hardest', 'corner'] as const;

export const athleteStoryAnswerSchema = z.object({
  selections: z.array(z.string().max(80)).max(8),
  extraWords: z.string().max(500).optional(),
});

export const athleteStoryAnswersSchema = z.record(athleteStoryAnswerSchema);

export type AthleteStoryAnswers = z.infer<typeof athleteStoryAnswersSchema>;
```

### Example shapes

Step-1 PATCH body once story answers and a hero photo are set (note the merged `presentation`):

```json
{
  "fullName": "Maya Okafor",
  "hometown": "Lethbridge, AB",
  "storyBody": [
    "I got into running through my family, and a race I watched as a kid.",
    "Right now I'm chasing my first marathon."
  ],
  "heroMediaUrl": "data:image/webp;base64,UklGR...",
  "presentation": {
    "arcSubtitle": "...untouched, merged from the draft...",
    "highlightTones": ["primary", "secondary"],
    "storyAnswers": {
      "origin": { "selections": ["Family", "Watching a race"] },
      "chasing": { "selections": ["My first marathon"], "extraWords": "Boston qualifier eventually." }
    }
  }
}
```

---

## 10) Package-level impact

### common/
- `common/src/zod/athlete.ts` — add `ATHLETE_STORY_QUESTION_IDS`, `athleteStoryAnswerSchema`, `athleteStoryAnswersSchema`, `AthleteStoryAnswers`; add `occurredOn` to `setHighlightInputSchema` (§8 D9).
- `common/src/index.ts` — export them if the barrel is explicit rather than a wildcard re-export.
- Rebuild with `npm run build --prefix common` before the client consumes the types.

### app/
- `app/src/repositories/AthleteRepository.ts` — `HighlightInput` gains `occurredOn?: Date`; `replaceHighlights` passes it into `createMany`.
- `app/src/api/athletes/AthleteService.ts:149-164` — `replaceMyHighlights` maps the new input field to a `Date`.
- No controller, router, validator, or DI change: the route and its Zod validation already exist and pick the new optional field up automatically.

### client/
- `client/app/(marketing)/sign-up/SignUpForm.tsx` — paced three-pane guided sign-up.
- `client/app/register/_components/onboardingProfile.ts` — `storyAnswers`, `heroPhoto`.
- `client/app/register/_components/OnboardingContext.tsx` — seed name from session on a fresh draft; hold the draft's `presentation` for merge-on-save.
- `client/app/register/_components/ProfilePreview.tsx` — render the athlete's hero photo.
- `client/app/register/personal-basics/PersonalBasicsForm.tsx` — story questions, generated draft, hero uploader, pre-filled name.
- `client/app/register/values-social/ValuesSocialForm.tsx` — custom values.
- `client/app/register/values-social/ValueChips.tsx` — **delete** (dead code).
- `client/app/register/review/PublishPanel.tsx`, `client/app/register/review/ReviewSummary.tsx` — publish explanation; review cards for the new fields.
- `client/app/register/page.tsx` — guide copy realigned with what the wizard now asks.
- `client/lib/onboardingApi.ts` — `heroMediaUrl`, merged `presentation` with `storyAnswers`, round-trip in `profileToOnboarding`.
- `client/lib/manageApi.ts` — map highlight `date` ⇄ `occurredOn` instead of dropping it; update the field-mapping comment block at lines 41-46 that documents the old behaviour.
- `client/lib/storyDraft.ts` — **new**; question set + pure draft composer.
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` — inline edit for races, highlights, roadmap; `ItemMenu` gains Edit.
- `client/app/(marketing)/dashboard/DashboardClient.tsx` — publish framing on the draft state.
- `client/components/ui/ComingSoonLabel.tsx` — **new** (only if `client/components/ui/Badge.tsx` cannot render something this quiet); used by the profile hero and the Stripe card.
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` — label beside the hero Follow control; hide the follower count at both render sites (`:135`, `:408`) while it is fabricated.
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ConnectStripeCard.tsx` — label in the heading row. No change to any Stripe call path.

### docs/
- No new document. `docs/product-brief.md` and `docs/delivery-plan.md` describe product intent, not wizard mechanics, and stay accurate. The `$doc-alignment` (`/doc-alignment`) skill runs in the final step to confirm.

---

## 11) Edge cases and error handling

- **Draft exists but `fullName` is empty:** impossible via the API (`fullName` is required on create), but the seeding guard is written as "only fill when blank" so it degrades safely either way.
- **Session not ready when the wizard mounts:** `ApiOnboardingProvider` already blocks on `ready`; seeding runs inside the same effect so it never races the hydrate.
- **Athlete edits the story, then changes a chip:** no overwrite. The "Rewrite from my answers" button appears; taking it replaces the text, and that is an explicit, athlete-initiated action.
- **Athlete selects no chips and writes freehand:** fully supported; `storyBody` comes from whatever is in the field, exactly as today.
- **Custom value duplicates a preset (any casing):** the input rejects it and focuses the already-selected chip rather than adding a near-duplicate.
- **Custom value over 40 characters:** the input is capped at 40 with a live counter, so the contract's `z.string().max(40)` can never 400.
- **Sixth value selected:** the cap holds at 5 with an inline hint; no silent drop (today's `MAX_VALUES` logic already returns `{}` on overflow — keep that but explain it).
- **Hero image upload fails / HEIC undecodable:** `toImageUploadErrorMessage` sentence renders inline; the step still advances without a hero, since it is optional.
- **Hero image too large after every downscale step:** `filesToPersistedImageRefs` reports the per-file failure sentence; no partial write.
- **Editing a race to an empty name:** `toRacesRequest` (`client/lib/manageApi.ts:179`) filters out untitled rows on save, so an emptied name silently deletes the row. Guard in the editor: block save-out of an inline edit with a blank name, with an inline message.
- **Editing a race and removing every photo:** valid — saves `photoRefs: []`.
- **Twelve photos already on a race:** the highlight/race `photoRefs` cap is 12 (`common/src/zod/athlete.ts:217,234`). The uploader must stop at the cap with a sentence, mirroring the gallery's existing `ATHLETE_GALLERY_MAX_PHOTOS` handling (`ManageProfile.tsx:582-597`).
- **Existing highlights saved before D9:** their `occurredOn` is null, so the date input renders empty. No backfill — the free-text dates they typed were never persisted, so there is nothing to recover.
- **Highlight saved with no date:** `occurredOn` is optional; the row saves and the profile omits the date, exactly as today.
- **Highlight date cleared back to empty:** sends no `occurredOn`, which the set-replace writes as null. Clearing is a supported action, not a validation error.
- **Publish attempted with no tagline or personal best:** unchanged — `publishChecklist` renders the two curated sentences; the new explanation block does not contradict it.
- **Sign-up: back-navigating after typing a password:** field values persist in component state across panes; only the final pane submits.
- **Sign-up: `?next=` present:** `safeAuthDestination` is called once, unchanged, and still governs the post-signup push.

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- *Hydrate vs. first keystroke.* `ApiOnboardingProvider` sets `dirtyRef` on any `update()` and already refuses to overwrite a dirty profile with a late draft response. Name seeding must respect the same flag, or a fast typist's first characters get replaced.
- *Story regeneration vs. manual editing.* Chip changes are asynchronous with typing; the equality guard in D3 (`bio === lastGeneratedDraft`) is what makes regeneration safe. Without it, a chip toggle after the athlete has written their story destroys their words.
- *Wizard `presentation` vs. manage-editor `presentation`.* Both write the same whole-blob field. The wizard runs before publish and the manage editor after, so real overlap is unlikely — but the merge in D2 is mandatory regardless, because an athlete can revisit `/register/...` after editing in `/manage`.
- *Manage editor autosave vs. an open inline edit.* The autosave timer already snapshots `edits` via `toSaveSnapshot`; an inline edit mutates the same array, so an in-progress edit can autosave mid-typing. That is the existing (and desirable) behaviour for personal bests and core values today; keep it consistent rather than adding edit-buffer semantics.

**Idempotency and retries:**
- Every write in play is idempotent by construction: `PATCH /v1/athletes/me` is a field patch, and highlights/races/roadmap/gallery are whole-set replaces. Re-running a failed save re-sends the same desired state.
- Profile creation retains its bounded slug retry (`createProfileWithSlugRetry`, `-2`..`-5`); nothing in this task changes it.
- Sign-up remains a single POST. The guided panes must not create the account early, so a back-navigation cannot produce a duplicate account.

**Failure modes:**
- Step save fails → `StepAdvance` blocks navigation and shows one sentence with a Dismiss action (existing behaviour, preserved).
- Image processing fails → per-file sentence, batch continues, step still advances.
- `GET /v1/athletes/me` fails on wizard entry → the wizard stays fresh and the signed-out/gate panel takes over (existing behaviour); the name seed simply does not apply.
- Manage save fails → `toManageSaveError` sentence; the inline edit stays open with the athlete's values intact.

---

## 13) Operational readiness

**Observability:**
- No new logging. The gaps here are client-side UX; the API endpoints and their existing request logging are unchanged.
- Worth watching after release (manual, pilot-scale): how many published profiles carry a hero photo, a custom value, and ≥1 story answer — all readable from the existing profile records without new instrumentation.

---

## 14) Research and references

- `docs/product-brief.md` — audiences, story-first and minimalist-UX differentiators, pilot plan.
- `client/AGENTS.md` — the four design mandates the story and values steps must not violate.
- `common/AGENTS.md` — schema-first workflow and the `npm run build --prefix common` requirement.
- `.ai/tasks/2026-08-16/arc-editor/` — pending, incomplete plan touching `ManageProfile.tsx`; read before Steps 7–8 for collision awareness.
- `.ai/tasks/2026-07-19/completed/platform-polish-and-real-auth/` — precedent for the mock/api provider seam this task extends.
- `client/lib/manageApi.ts:34-66` — the authoritative in-repo note on `presentation` being a whole-blob replace, and why merging matters.
- `client/lib/imageUploads.ts:52-56` — why photo processing is sequential (iOS Safari canvas budget); constrains how the hero uploader is wired.

---

## 15) Open questions

- Whether the twelve preset values should be re-cut now that athletes can type their own. Deferred deliberately: the presets stay as-is in this task, and the free-text entries collected from the pilot cohort are the right evidence for re-cutting them later. Deferring costs nothing — Step 5 makes the evidence visible in the data.

**Resolved during planning (recorded so they are not re-litigated):**
- *Should story answers get a typed Prisma column instead of the `presentation` blob?* No. A column costs a migration plus repository/service/controller work — roughly arc-editor's steps 1-3 — for data whose only consumer is a text generator. Revisit if the answers ever drive sponsor matching (pillar 2); JSON blob → column is a straightforward migration when there is a reason. See §8 D2.
- *Should the races `occurredOn` write gap be fixed alongside the highlight one?* No — races carry a required free-text `displayDate` that deliberately holds non-dates, so adding `occurredOn` there means a second date field with no consumer. See §2 for the full reasoning and the trigger for revisiting.
- *Should the "coming soon" flag disable Follow and Stripe, or only label them?* Label only, both stay functional (§8 D10). Disabling Stripe would stop athletes receiving donations.
- *Should the dropped career-highlight date be fixed here or deferred?* Fixed here, as §8 D9. It is silent data loss against a column that already exists, it is the same class of complaint as feedback item 4, and D7's inline editing would otherwise make it easier to hit.
