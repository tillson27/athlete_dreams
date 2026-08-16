# Arc Editor — Full-Stack Persistence & Dedicated Edit Page

Date: 2026-08-16
Task slug: arc-editor
Status: Draft

## 0) Summary

- **Objective:** Give athletes a dedicated, iterative editor for their Arc (journey timeline), backed by real database persistence, accessible as its own page from the manage dashboard.
- **Why now:** The Arc is the single most differentiating feature on the FAD profile — it puts story first. Currently the editor is buried inside `ManageProfile.tsx`, saves to localStorage only, and has no database backing. Athletes cannot save their journey.
- **Primary outcomes:**
  - Arc chapters and subtitle persist in the database via `PUT /v1/athletes/me/arc`
  - Dedicated editor page at `/athletes/[slug]/manage/arc` with live preview
  - Arc is optional — no publish gate added
  - Public profile reads Arc from the typed API response (not the `presentation` blob)

---

## 1) Success criteria

- Authenticated athlete can save Arc chapters and subtitle via the new endpoint; data survives a page reload
- The dedicated `/manage/arc` page renders the chapter editor (drag-reorder, add, edit, delete) alongside a live preview panel matching the public profile display
- The main manage dashboard replaces the embedded Arc section with a summary card linking to `/manage/arc`
- Arc chapters are optional — the publish flow (`assertPublishable`) is unchanged
- The public profile (`AthleteProfile.tsx`) renders Arc from the typed `profile.arcChapters` array, not from the untyped `presentation` blob

**Acceptance criteria (definition of done):**
- `PUT /v1/athletes/me/arc` returns 200 with the updated profile containing `arcSubtitle` and `arcChapters`
- `/athletes/[slug]/manage/arc` is reachable, shows the editor and preview, and save calls the API
- `npm run ci` passes with no errors

---

## 2) Scope and non-goals

**In scope:**
- New `ArcChapter` Prisma model + `arcSubtitle String?` on `AthleteProfile` (structured persistence rather than untyped JSON blob)
- Common Zod schemas: `arcChapterInputSchema`, `arcChapterResponseSchema`, `setAthleteArcRequestSchema`
- Backend: repository method → service method → controller handler → `PUT /v1/athletes/me/arc` route
- Client: `replaceMyArc()` helper in `client/lib/api.ts`
- Adapter update: `profileToRichProfile()` reads `arcSubtitle`/`arcChapters` from typed profile fields, not `presentation` blob
- Dedicated Arc editor page at `client/app/(marketing)/athletes/[athleteSlug]/manage/arc/`
- Replace embedded Arc section in `ManageProfile.tsx` with a summary card + "Edit Arc" link

**Out of scope:**
- Image upload infra for chapter photos (`imageRef` accepts a URL string; the `PhotoUploader` converts images to data URLs as it already does today — real CDN upload is a separate task)
- Rich text / markdown in chapter body
- Draft vs. published state for Arc (saves go live immediately)
- Moving other manage sections (highlights, races, roadmap) to dedicated pages
- Arc analytics or sponsor-facing display

**Out-of-scope edge cases:**
- Concurrent saves from two browser tabs: last write wins via the delete-all + createMany transaction pattern used by every other collection; no optimistic locking required at this stage
- Migration of existing `presentation.arcChapters` data: seed data uses the presentation blob; real users have no Arc data yet (no athletes have used the live editor)

---

## 3) Background and motivation

FAD's core differentiator is **athlete stories first** (`client/AGENTS.md` and `docs/product-brief.md`). The Arc — "Cassandra's journey" in the design image — is the most evocative section of the profile. Its chapters let athletes narrate their path in their own voice.

The editor UI (`ManageProfile.tsx` lines 703-888) and types (`client/lib/athleteEdits.ts`, `client/lib/athleteProfiles.ts`) already exist. What's missing is:
1. A database model to persist Arc chapters
2. An API endpoint to save them
3. A dedicated editor page (rather than a buried section in a long scroll)

Every other profile collection (personal bests, highlights, races, roadmap, gallery) already has a Prisma model + `PUT` endpoint following the delete-all + createMany pattern. Arc should follow the same architecture.

---

## 4) Current state and gaps

### Current state

- **Display:** `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` renders Arc from `RichAthleteProfile.arcChapters` and `.arcSubtitle`
- **Adapter:** `client/lib/adapters.ts:profileToRichProfile()` reads Arc from `presentation.arcChapters` and `presentation.arcSubtitle` (untyped JSON blob)
- **Edit UI:** `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` lines 703-888 — full CRUD editor exists but saves to localStorage only
- **Types (client):** `ArcChapter`, `EditArcChapter`, `ChapterIcon`, `ChapterTone` in `client/lib/athleteProfiles.ts` and `client/lib/athleteEdits.ts`
- **API client:** `client/lib/api.ts` — no `replaceMyArc` helper exists
- **Common:** `common/src/zod/athlete.ts` — no Arc schemas; `athleteProfileSchema` has no `arcSubtitle` or `arcChapters` fields
- **Backend:** No `ArcChapter` model, no repository method, no service method, no controller handler, no route

### Gaps

- `common/src/zod/athlete.ts` — missing `arcChapterInputSchema`, `arcChapterResponseSchema`, `setAthleteArcRequestSchema`; `athleteProfileSchema` missing `arcSubtitle` and `arcChapters`
- `app/prisma/schema.prisma` — `AthleteProfile` has no `arcSubtitle` field; no `ArcChapter` model
- `app/src/repositories/AthleteRepository.ts` — no `replaceArcChapters()` method, `richProfileInclude` does not include `arcChapters`
- `app/src/api/athletes/AthleteService.ts` — no `replaceMyArcChapters()` method, `toProfileDto()` does not map `arcSubtitle` or `arcChapters`
- `app/src/api/athletes/AthleteController.ts` — no `replaceMyArc` handler
- `app/src/api/athletes/AthleteRouterFactory.ts` — no `PUT /me/arc` route
- `client/lib/api.ts` — no `replaceMyArc()` helper
- `client/lib/adapters.ts` — reads Arc from untyped `presentation` blob; needs to read from typed profile fields after common schema + API update
- No dedicated Arc editor page exists

---

## 5) Changes and considerations

**Significant changes:**
- New `ArcChapter` Prisma model (requires migration): structured columns for era, title, body, icon, tone, isCurrent, imageRef, sortOrder
- `arcSubtitle String?` added to `AthleteProfile`
- `athleteProfileSchema` gains `arcSubtitle` and `arcChapters` fields — this is a non-breaking additive change to the response contract
- `profileToRichProfile()` adapter switches from reading `presentation.arcChapters` (untyped) to `profile.arcChapters` (typed) — ensures Arc data is validated at the API boundary

**Impact and considerations:**
- The `richProfileInclude` change means all profile reads will now JOIN the `arc_chapters` table — low impact given expected row counts (≤20 chapters per athlete)
- Existing mock-based seed data stores Arc in `presentation`; the adapter switch will make `presentation.arcChapters` inert — seed athletes' Arc data will disappear from the live API until they save through the new editor. This is acceptable (pilot athletes are hand-onboarded; FAD acts as agent and will migrate their data)
- `ManageProfile.tsx` lines 703-888 (Arc section) will be removed; the Arc editor state (`arcChapters`, `arcSubtitle`) can be removed from that component's state

---

## 6) Constraints, assumptions, dependencies

**Constraints:**
- AGENTS.md [STRICT]: no Prisma CLI except `migrate:create`; no deployment commands
- AGENTS.md [STRICT]: API types from `fad-common` only — no duplicates in `app/` or `client/`
- client/AGENTS.md [STRICT]: Minimalism — the editor and preview must be legible, not cluttered
- Image upload is accepted as a URL string (`imageRef`); no CDN upload infra in this task

**Assumptions:**
- No real user has persisted Arc data in the database (no data migration needed)
- The `presentation` blob can continue to hold other fields (training, followers, etc.) after Arc is extracted; only `arcChapters` and `arcSubtitle` are removed from its read path
- The `ManageProfile.tsx` localStorage save is not used in production (mock mode only)

**Dependencies (ordered):**
1. Common schemas must be built before backend or client can consume new types
2. Prisma migration must be created before backend repository/service changes
3. Backend endpoint must exist before client save flow can be wired
4. Client API helper + adapter must be updated before the Arc editor page can function

---

## 7) Requirements

**Functional requirements:**
- `PUT /v1/athletes/me/arc` accepts `{ arcSubtitle?, chapters[] }` and returns the full `AthleteProfile` DTO
- Each chapter in the request carries: era, title, body, icon, tone, isCurrent?, imageRef?
- Save is a full replace: all existing chapters for the athlete are deleted and recreated in submitted order
- `arcSubtitle` update is atomic with the chapter replace (single transaction)
- Arc is optional — zero chapters is valid; `assertPublishable` is not modified
- The editor page seeds its state from `fetchMyProfile()` on mount (current saved Arc)
- Save button is explicit (no auto-save); shows a success/error toast
- Only one chapter may have `isCurrent: true`; the editor enforces this client-side (existing logic in `ManageProfile.tsx`)

**Non-functional requirements:**
- The editor page must be accessible from the main manage page via a clear "Edit Arc" link
- Max 20 chapters per Arc (Zod validation)
- The `arc_chapters` table is indexed on `(athleteProfileId, sortOrder)` for efficient ordered reads
- No additional env vars required

---

## 8) Proposed approach

1. **Zod first**: define request + response schemas in `common/src/zod/athlete.ts`; add `arcSubtitle` and `arcChapters` to `athleteProfileSchema`
2. **Prisma**: add `ArcChapter` model + `arcSubtitle` to `AthleteProfile`; draft migration with `migrate:create`
3. **Backend**: extend `richProfileInclude` → add repository method → service method → controller handler → router route; update `toProfileDto()` to map the new fields
4. **Client layer**: add `replaceMyArc()` to `api.ts`; update `adapters.ts` to read Arc from typed profile fields
5. **Dedicated editor page**: new `manage/arc/` page — left panel editor (adapted from existing `ManageProfile.tsx` Arc section), right panel live preview; seeds from `fetchMyProfile()`; explicit save button
6. **Manage page cleanup**: replace the embedded Arc section in `ManageProfile.tsx` with a summary card + "Edit Arc" link; remove Arc state from that component

---

## 9) Data model and contracts

### OpenAPI changes

`PUT /v1/athletes/me/arc` — new endpoint:
- Auth: required (bearer)
- Request body: `SetAthleteArcRequest`
- Response: `200 AthleteProfile` (same DTO as all other `PUT /me/*` endpoints)

`athleteProfileSchema` gains two new optional fields (non-breaking additive):
- `arcSubtitle: z.string().nullable().optional()`
- `arcChapters: z.array(arcChapterResponseSchema).optional()`

### Data model changes

Add to `AthleteProfile`:
```
arcSubtitle   String?
arcChapters   ArcChapter[]
```

New model:
```
model ArcChapter {
  id               String         @id @default(uuid()) @db.Uuid
  athleteProfileId String         @db.Uuid
  era              String         @db.VarChar(120)
  title            String         @db.VarChar(200)
  body             String
  icon             String         @db.VarChar(40)
  tone             String         @db.VarChar(40)
  isCurrent        Boolean        @default(false)
  imageRef         String?
  sortOrder        Int            @default(0)
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  athleteProfile   AthleteProfile @relation(fields: [athleteProfileId], references: [id], onDelete: Cascade)

  @@index([athleteProfileId, sortOrder])
  @@map("arc_chapters")
}
```

### Example shapes

Request — `PUT /v1/athletes/me/arc`:
```json
{
  "arcSubtitle": "From the rugby pitch to the podium — the chapters behind the athlete.",
  "chapters": [
    {
      "era": "Before Arc",
      "title": "National rugby",
      "body": "Before endurance, sport meant rugby — at the national level.",
      "icon": "medal",
      "tone": "primary",
      "isCurrent": false
    },
    {
      "era": "Now",
      "title": "What I'm chasing",
      "body": "The Lost Soul 100-miler this September.",
      "icon": "flag",
      "tone": "primary",
      "isCurrent": true
    }
  ]
}
```

Response — `arcChapters` array in the `AthleteProfile` DTO:
```json
{
  "arcChapterId": "uuid",
  "era": "Now",
  "title": "What I'm chasing",
  "body": "The Lost Soul 100-miler this September.",
  "icon": "flag",
  "tone": "primary",
  "isCurrent": true,
  "imageRef": null,
  "sortOrder": 1
}
```

---

## 10) Package-level impact

### common/
- `common/src/zod/athlete.ts`: add `arcChapterInputSchema`, `arcChapterResponseSchema`, `setAthleteArcRequestSchema`, `SetAthleteArcRequest`, `ArcChapterResponse`; extend `athleteProfileSchema` with `arcSubtitle` and `arcChapters`
- `common/src/index.ts`: no change needed (already re-exports `./zod/athlete`)

### app/
- `app/prisma/schema.prisma`: `ArcChapter` model + `arcSubtitle` on `AthleteProfile`
- `app/prisma/migrations/`: one new migration via `migrate:create`
- `app/src/repositories/AthleteRepository.ts`: extend `richProfileInclude`, add `ArcChapterInput` interface, add `replaceArcChapters()` method
- `app/src/api/athletes/AthleteService.ts`: add `replaceMyArcChapters()`, update `toProfileDto()` + add `toArcChapterDto()` mapper
- `app/src/api/athletes/AthleteController.ts`: add `replaceMyArc` handler, import `setAthleteArcRequestSchema`
- `app/src/api/athletes/AthleteRouterFactory.ts`: add `PUT /me/arc` route

### client/
- `client/lib/api.ts`: add `replaceMyArc()`, import `SetAthleteArcRequest`
- `client/lib/adapters.ts`: update `profileToRichProfile()` — read `arcSubtitle` from `profile.arcSubtitle`, read `arcChapters` from typed `profile.arcChapters` instead of `presentation` blob
- `client/app/(marketing)/athletes/[athleteSlug]/manage/arc/page.tsx`: new server component wrapper
- `client/app/(marketing)/athletes/[athleteSlug]/manage/arc/ArcEditor.tsx`: new client component (editor + preview)
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx`: remove Arc section (lines ~703-888), replace with summary card + link; remove `arcChapters`/`arcSubtitle` state

---

## 11) Edge cases and error handling

- **Empty Arc (zero chapters):** Valid — the API accepts `chapters: []` and the public profile simply omits the Arc section (existing behavior)
- **Multiple `isCurrent: true`:** The client editor already enforces single-current logic; the backend does not validate this (trusts client); the last chapter with `isCurrent: true` in the array is stored as-is
- **`arcSubtitle` omitted:** If the request omits `arcSubtitle`, the stored subtitle is left unchanged (only chapters are replaced in the transaction); if set to empty string `""`, it is stored as empty
- **API error on save:** The editor shows a toast with the error message; local state is preserved so the athlete can retry
- **Athlete has no profile yet:** `PUT /me/arc` returns 404 via `requireOwnProfile()` — same behavior as all other `PUT /me/*` endpoints

---

## 12) Failure modes and concurrency

**Concurrency/race conditions:**
- Two simultaneous saves from different tabs: the Prisma `$transaction` (delete-all + createMany) is serialized at the DB level; last write wins. Acceptable for this stage.

**Idempotency and retries:**
- `PUT /me/arc` is idempotent — repeating the same request produces the same state. Safe to retry on network failure.

**Failure modes:**
- If `arcChapter.createMany` fails mid-transaction, the `deleteMany` is rolled back — no chapters are lost
- If the `athleteProfile.update` (arcSubtitle) fails, the full transaction rolls back

---

## 15) Open questions

- **Editor layout:** Left/right split (editor + preview) vs. tabbed (edit tab / preview tab). Preference given screen width constraints for athletes on mobile?
  - Tentative: default to tabbed on mobile (`<md`), split on desktop (`md+`) — mirrors common CMS patterns and avoids side-by-side squeeze on small screens.
