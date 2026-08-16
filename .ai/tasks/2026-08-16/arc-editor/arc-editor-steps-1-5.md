# Arc Editor — Steps 1–5

## Step 1 — Common Zod schemas for Arc

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** small
**Owner:** ai

### Context

**Objective:** Add Arc request/response schemas to `fad-common` and extend `athleteProfileSchema` so the new fields are available to both `app/` and `client/`.

**Done When:**
- `setAthleteArcRequestSchema`, `SetAthleteArcRequest`, `arcChapterResponseSchema`, `ArcChapterResponse` are exported from `fad-common`
- `athleteProfileSchema` includes `arcSubtitle: z.string().nullable().optional()` and `arcChapters: z.array(arcChapterResponseSchema).optional()`
- `npm run build --prefix common` succeeds with no errors

**References:**
- Context §7 (functional requirements — schema shapes)
- Context §9 (example request/response shapes)
- `common/src/zod/athlete.ts` — existing schema file; add after `setAthleteGalleryRequestSchema`
- `common/src/index.ts` — already re-exports `./zod/athlete`; no change needed
- Existing patterns: `setAthleteHighlightsRequestSchema`, `setAthleteGalleryRequestSchema`

### Plan

- Add icon and tone enum schemas plus `arcChapterInputSchema` and `arcChapterResponseSchema` to `common/src/zod/athlete.ts`:
    - Snippet:
      ```ts
      const chapterIconSchema = z.enum([
        'medal', 'heart', 'history', 'trophy', 'flag', 'timer', 'book', 'groups',
      ]);
      const chapterToneSchema = z.enum(['primary', 'secondary', 'tertiary']);

      const arcChapterInputSchema = z.object({
        era: z.string().max(120),
        title: z.string().min(1).max(200),
        body: z.string().max(4000),
        icon: chapterIconSchema,
        tone: chapterToneSchema,
        isCurrent: z.boolean().optional(),
        imageRef: mediaRefSchema.optional(),
      });

      export const arcChapterResponseSchema = z.object({
        arcChapterId: idSchema,
        era: z.string(),
        title: z.string(),
        body: z.string(),
        icon: z.string(),
        tone: z.string(),
        isCurrent: z.boolean(),
        imageRef: z.string().nullable(),
        sortOrder: z.number().int(),
      });
      export type ArcChapterResponse = z.infer<typeof arcChapterResponseSchema>;

      export const setAthleteArcRequestSchema = z
        .object({
          arcSubtitle: z.string().max(200).optional(),
          chapters: z.array(arcChapterInputSchema).max(20),
        })
        .strict();
      export type SetAthleteArcRequest = z.infer<typeof setAthleteArcRequestSchema>;
      ```

- Extend `athleteProfileSchema` with the new optional fields (add inside the existing `z.object({...})` call):
    - Snippet:
      ```ts
      arcSubtitle: z.string().nullable().optional(),
      arcChapters: z.array(arcChapterResponseSchema).optional(),
      ```

- Run `npm run build --prefix common` and confirm zero errors.

### Step checklist
- [ ] `arcChapterResponseSchema` and `ArcChapterResponse` added and exported
- [ ] `setAthleteArcRequestSchema` and `SetAthleteArcRequest` added and exported
- [ ] `athleteProfileSchema` extended with `arcSubtitle` and `arcChapters`
- [ ] `npm run build --prefix common` passes
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 — Prisma migration — ArcChapter model

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** small
**Owner:** ai

### Context

**Objective:** Add `arcSubtitle` to `AthleteProfile` and create the `ArcChapter` model in the Prisma schema, then draft the migration file.

**Done When:**
- `app/prisma/schema.prisma` has `arcSubtitle String?` on `AthleteProfile` and the `ArcChapter` model with all required fields
- A new migration file exists in `app/prisma/migrations/` (created by `migrate:create`, not applied)

**References:**
- Context §9 (data model changes)
- `app/prisma/schema.prisma` — `AthleteProfile` model starts at line ~216; add `arcSubtitle` and `arcChapters ArcChapter[]` relation; append the `ArcChapter` model after the last model in the file
- AGENTS.md [STRICT]: AI may only use `npm run migrate:create --prefix app -- --name <name>`; must not apply migrations

### Plan

- Add `arcSubtitle String?` and `arcChapters ArcChapter[]` to the `AthleteProfile` model in `app/prisma/schema.prisma`:
    - Snippet:
      ```prisma
      arcSubtitle    String?
      arcChapters    ArcChapter[]
      ```

- Append the `ArcChapter` model to `app/prisma/schema.prisma` after the last existing model:
    - Snippet:
      ```prisma
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

- Create the draft migration:
    - Snippet:
      ```bash
      npm run migrate:create --prefix app -- --name add-arc-chapters
      ```

### Step checklist
- [ ] `arcSubtitle String?` added to `AthleteProfile` in schema
- [ ] `arcChapters ArcChapter[]` relation added to `AthleteProfile`
- [ ] `ArcChapter` model added with all fields and correct index + map
- [ ] Migration created via `migrate:create` (not applied)
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 — Backend Arc API endpoint

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2
**Size:** medium
**Owner:** ai

### Context

**Objective:** Wire the full backend stack for `PUT /v1/athletes/me/arc` — from `richProfileInclude` through repository, service, controller, and router — and update `toProfileDto()` to include the new Arc fields.

**Done When:**
- `AthleteRepository.replaceArcChapters()` exists and follows the delete-all + createMany transaction pattern
- `AthleteService.replaceMyArcChapters()` delegates to the repository
- `AthleteController.replaceMyArc` handler parses the body and delegates to the service
- `PUT /me/arc` is registered in `AthleteRouterFactory`
- `toProfileDto()` maps `arcSubtitle` and `arcChapters` into the response DTO
- `npm run ci` passes

**References:**
- Context §8 (proposed approach), §9 (example shapes)
- `app/src/repositories/AthleteRepository.ts` — `richProfileInclude` at line 14; `replaceHighlights()` at line 217 as the pattern reference
- `app/src/api/athletes/AthleteService.ts` — `replaceMyHighlights()` at line 155 as the pattern; `toProfileDto()` at line 280
- `app/src/api/athletes/AthleteController.ts` — `replaceMyHighlights` handler at line 94 as the pattern
- `app/src/api/athletes/AthleteRouterFactory.ts` — existing `PUT /me/highlights` route as the pattern

### Plan

- Update `richProfileInclude` in `AthleteRepository.ts` to include `arcChapters`:
    - Snippet:
      ```ts
      const richProfileInclude = Prisma.validator<Prisma.AthleteProfileInclude>()({
        // ... existing includes ...
        arcChapters: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      });
      ```

- Add `ArcChapterInput` interface and `replaceArcChapters()` method to `AthleteRepository`:
    - Snippet:
      ```ts
      export interface ArcChapterInput {
        era: string;
        title: string;
        body: string;
        icon: string;
        tone: string;
        isCurrent?: boolean;
        imageRef?: string;
      }

      replaceArcChapters(
        athleteId: string,
        arcSubtitle: string | undefined,
        chapters: ArcChapterInput[]
      ): Promise<AthleteProfileWithRelations> {
        return this.prisma.$transaction(async (tx) => {
          await tx.arcChapter.deleteMany({ where: { athleteProfileId: athleteId } });
          if (arcSubtitle !== undefined) {
            await tx.athleteProfile.update({
              where: { id: athleteId },
              data: { arcSubtitle },
            });
          }
          if (chapters.length > 0) {
            await tx.arcChapter.createMany({
              data: chapters.map((chapter, index) => ({
                athleteProfileId: athleteId,
                era: chapter.era,
                title: chapter.title,
                body: chapter.body,
                icon: chapter.icon,
                tone: chapter.tone,
                isCurrent: chapter.isCurrent ?? false,
                imageRef: chapter.imageRef,
                sortOrder: index,
              })),
            });
          }
          return tx.athleteProfile.findUniqueOrThrow({
            where: { id: athleteId },
            include: richProfileInclude,
          });
        });
      }
      ```

- Add `replaceMyArcChapters()` to `AthleteService` and add `toArcChapterDto()` mapper; update `toProfileDto()`:
    - Snippet:
      ```ts
      // In AthleteService:
      type ArcChapterRelation = AthleteProfileWithRelations['arcChapters'][number];

      async replaceMyArcChapters(
        userId: string,
        input: SetAthleteArcRequest
      ): Promise<AthleteProfileDto> {
        const athlete = await this.requireOwnProfile(userId);
        const updated = await this.athleteRepository.replaceArcChapters(
          athlete.id,
          input.arcSubtitle,
          input.chapters.map((chapter) => ({
            era: chapter.era,
            title: chapter.title,
            body: chapter.body,
            icon: chapter.icon,
            tone: chapter.tone,
            isCurrent: chapter.isCurrent,
            imageRef: chapter.imageRef,
          }))
        );
        return toProfileDto(updated);
      }

      // toProfileDto additions:
      arcSubtitle: athlete.arcSubtitle,
      arcChapters: athlete.arcChapters.map(toArcChapterDto),

      // New mapper:
      function toArcChapterDto(chapter: ArcChapterRelation): ArcChapterResponse {
        return {
          arcChapterId: chapter.id,
          era: chapter.era,
          title: chapter.title,
          body: chapter.body,
          icon: chapter.icon,
          tone: chapter.tone,
          isCurrent: chapter.isCurrent,
          imageRef: chapter.imageRef,
          sortOrder: chapter.sortOrder,
        };
      }
      ```

- Add `replaceMyArc` handler to `AthleteController`:
    - Snippet:
      ```ts
      replaceMyArc = async (req: Request, res: Response): Promise<void> => {
        if (!req.authenticatedUserId) throw new UnauthorizedError();
        const body = parseRequestBody(setAthleteArcRequestSchema, req);
        const profile = await this.athleteService.replaceMyArcChapters(req.authenticatedUserId, body);
        ResponseHandler.success(res, 200, profile);
      };
      ```

- Add route to `AthleteRouterFactory` (before `/:athleteSlug` catch-all):
    - Snippet:
      ```ts
      router.put('/me/arc', this.auth.required, this.wrap(this.athleteController.replaceMyArc));
      ```

- Import `setAthleteArcRequestSchema`, `SetAthleteArcRequest`, `ArcChapterResponse` from `fad-common` in the relevant files.

### Step checklist
- [ ] `richProfileInclude` updated with `arcChapters` relation
- [ ] `ArcChapterInput` interface added to repository
- [ ] `replaceArcChapters()` method added to `AthleteRepository`
- [ ] `ArcChapterRelation` type alias added to `AthleteService`
- [ ] `replaceMyArcChapters()` method added to `AthleteService`
- [ ] `toArcChapterDto()` mapper added; `toProfileDto()` updated to include `arcSubtitle` and `arcChapters`
- [ ] `replaceMyArc` handler added to `AthleteController`; import updated
- [ ] `PUT /me/arc` route added to `AthleteRouterFactory`
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 — Client API helper + adapter update

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 3
**Size:** small
**Owner:** ai

### Context

**Objective:** Add `replaceMyArc()` to the client API module and update `profileToRichProfile()` to read `arcSubtitle` and `arcChapters` from the typed profile fields instead of the untyped `presentation` blob.

**Done When:**
- `client/lib/api.ts` exports `replaceMyArc(body: SetAthleteArcRequest): Promise<AthleteProfile>`
- `profileToRichProfile()` in `client/lib/adapters.ts` reads `arcSubtitle` from `profile.arcSubtitle` and `arcChapters` from `profile.arcChapters` (no longer reads from `presentation`)
- TypeScript compilation passes for `client/`

**References:**
- Context §10 (client/ impact)
- `client/lib/api.ts` — `replaceMyHighlights()` at line 372 as pattern
- `client/lib/adapters.ts` — `profileToRichProfile()` at line 271; `toArcChapters()` at line 198 (this local function becomes unused after the switch and should be removed)
- `client/lib/athleteProfiles.ts` — `ArcChapter` type with fields: era, title, icon, tone, body, image?, current?

### Plan

- Add `replaceMyArc()` to `client/lib/api.ts` (import `SetAthleteArcRequest` from `fad-common`):
    - Snippet:
      ```ts
      export function replaceMyArc(body: SetAthleteArcRequest): Promise<AthleteProfile> {
        return apiRequest('/v1/athletes/me/arc', athleteProfileSchema, {
          method: 'PUT',
          body,
          authed: true,
        });
      }
      ```

- Update `profileToRichProfile()` in `client/lib/adapters.ts` — replace the `presentation` blob reads for Arc:
    - Snippet:
      ```ts
      // Remove:
      arcSubtitle: asString(presentation.arcSubtitle),
      arcChapters: toArcChapters(presentation.arcChapters),

      // Replace with:
      arcSubtitle: profile.arcSubtitle ?? '',
      arcChapters: (profile.arcChapters ?? []).map((chapter) => ({
        era: chapter.era,
        title: chapter.title,
        icon: chapter.icon as ArcChapter['icon'],
        tone: chapter.tone as ArcChapter['tone'],
        body: chapter.body,
        image: chapter.imageRef ?? undefined,
        current: chapter.isCurrent ? true : undefined,
      })),
      ```

- Remove the now-unused `toArcChapters()` helper function from `client/lib/adapters.ts` (lines 198-212).

### Step checklist
- [ ] `replaceMyArc()` added to `client/lib/api.ts` with correct type imports
- [ ] `profileToRichProfile()` reads `arcSubtitle` from `profile.arcSubtitle`
- [ ] `profileToRichProfile()` reads `arcChapters` from `profile.arcChapters` (typed array)
- [ ] `toArcChapters()` local helper removed from `adapters.ts`
- [ ] TypeScript `type-check` passes for `client/`
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 — Dedicated Arc editor page

### Metadata
**Status:** Incomplete
**Prereqs:** 4
**Size:** medium
**Owner:** ai

### Context

**Objective:** Create the dedicated Arc editor page at `client/app/(marketing)/athletes/[athleteSlug]/manage/arc/`. The page has a chapter editor panel (adapted from the existing ManageProfile Arc section) and a live preview panel showing how the Arc renders on the public profile.

**Done When:**
- `client/app/(marketing)/athletes/[athleteSlug]/manage/arc/page.tsx` exists as a server component
- `client/app/(marketing)/athletes/[athleteSlug]/manage/arc/ArcEditor.tsx` exists as a client component
- The editor seeds from `fetchMyProfile()` on mount (loads current `arcSubtitle` and `arcChapters`)
- Saving calls `replaceMyArc()` and shows a success/error toast
- The live preview panel mirrors the Arc display from `AthleteProfile.tsx`
- On mobile, layout is tabbed (Editor / Preview tabs); on `md+` it is a split panel
- A back link returns to `/athletes/[slug]/manage`
- TypeScript compilation passes

**References:**
- Context §8 (proposed approach), §11 (edge cases)
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` lines 703-888 — extract the Arc editor UI (SortableList, per-chapter fields, AddRowButton, subtitle input)
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` — Arc display section (collapsible `<details>` with timeline) for the preview panel
- `client/lib/athleteEdits.ts` — `CHAPTER_ICONS`, `CHAPTER_TONES`, `EditArcChapter`, `patchChapter` helpers
- `client/lib/api.ts` — `fetchMyProfile()` (seeds editor state), `replaceMyArc()` (saves)
- `client/app/(marketing)/athletes/[athleteSlug]/manage/page.tsx` — existing server page pattern

### Plan

- Create `client/app/(marketing)/athletes/[athleteSlug]/manage/arc/page.tsx` as a thin server component that renders `<ArcEditor athleteSlug={athleteSlug} />`:
    - Snippet:
      ```tsx
      import type { Metadata } from 'next';
      import { ArcEditor } from './ArcEditor';

      export async function generateMetadata({
        params,
      }: {
        params: Promise<{ athleteSlug: string }>;
      }): Promise<Metadata> {
        const { athleteSlug } = await params;
        return { title: `Edit Arc — ${athleteSlug}` };
      }

      export default async function ArcEditorPage({
        params,
      }: {
        params: Promise<{ athleteSlug: string }>;
      }) {
        const { athleteSlug } = await params;
        return <ArcEditor athleteSlug={athleteSlug} />;
      }
      ```

- Create `client/app/(marketing)/athletes/[athleteSlug]/manage/arc/ArcEditor.tsx` as a `'use client'` component. Key structure:
  - On mount: call `fetchMyProfile()`, seed `arcSubtitle` and `arcChapters` state from response
  - If the profile is not found / user is unauthenticated, show an appropriate message
  - Editor panel: subtitle `<input>`, `SortableList` of chapters (era, title, body, icon, tone, isCurrent checkbox, PhotoUploader), AddRowButton — adapted directly from `ManageProfile.tsx` lines 703-888
  - Preview panel: renders the same Arc timeline HTML/structure as `AthleteProfile.tsx` (lift the Arc `<details>` block into a shared `ArcPreview` component or duplicate the display logic here)
  - Save button calls `replaceMyArc({ arcSubtitle, chapters: arcChapters.map(toApiChapter) })`; shows success/error toast using the existing toast pattern in `ManageProfile.tsx`
  - "Back to manage" link: `<Link href={/athletes/${athleteSlug}/manage}>← Back</Link>`
  - Layout: `<div className="grid md:grid-cols-[1fr_1fr] gap-6">` — stacks vertically on mobile, side-by-side on desktop

- The `toApiChapter` helper converts `EditArcChapter` → `SetAthleteArcRequest['chapters'][number]` (drops the client-only `id` field, maps `photo` → `imageRef`, maps `current` → `isCurrent`):
    - Snippet:
      ```ts
      function toApiChapter(chapter: EditArcChapter) {
        return {
          era: chapter.era,
          title: chapter.title,
          body: chapter.body,
          icon: chapter.icon,
          tone: chapter.tone,
          isCurrent: chapter.current,
          imageRef: chapter.photo,
        };
      }
      ```

### Step checklist
- [ ] `arc/page.tsx` server component created
- [ ] `arc/ArcEditor.tsx` client component created with editor + preview panels
- [ ] Editor seeds from `fetchMyProfile()` on mount
- [ ] Save calls `replaceMyArc()` and shows success/error toast
- [ ] Live preview panel mirrors Arc display from `AthleteProfile.tsx`
- [ ] Back link to `/athletes/[slug]/manage` present
- [ ] Mobile layout: stacked / tabbed; desktop: split grid
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
