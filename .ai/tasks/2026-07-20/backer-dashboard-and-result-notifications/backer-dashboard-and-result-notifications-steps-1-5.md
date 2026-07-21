# Backer Dashboard and Race Result Notifications - Steps 1-5

## Step 1 - Prisma schema: result→event link, event completion, `BackerNotification`

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** small
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Add the persistence changes first, so the generated Prisma types exist before any contract or handler references them.

> **Ordering note:** this step comes before the Zod contracts deliberately. `athleteRaceResultSchema` gains a non-optional `athleteEventId`, which immediately breaks the type of `toRaceResultDto` in `app/src/api/athletes/AthleteService.ts:332-344`. That mapper cannot be fixed until `AthleteRaceResult.athleteEventId` exists on the generated Prisma client, so schema must land first or Step 2 cannot leave CI green.

**Done When:**
- `app/prisma/schema.prisma` matches context §9: `AthleteRaceResult.athleteEventId` (nullable, `onDelete: SetNull`, indexed), `AthleteEvent.completedAt`, `AthleteEvent.raceResults` back-relation, `enum BackerNotificationType`, and the `BackerNotification` model.
- `User` gains `backerNotifications BackerNotification[]`.
- The `dedupeKey` field carries the intent comment explaining why it keys on the event rather than the result.
- `npm run build-client --prefix app` (`prisma generate`) succeeds and the generated client exposes the new model and field.
- **No migration file is created by AI.** An owner follow-up is recorded in this step's Completion Notes: start Postgres, set `DATABASE_URL`, then run `npm run migrate:create --prefix app -- --name add_backer_notifications_and_result_event_link` and apply it — noting the draft will also sweep up the still-unmigrated Stripe Connect delta.
- `app/prisma/seed.ts` seeds a completed event with a linked race result for an existing seeded athlete, so DB-backed tests and local QA have data.
- `npm run ci` passes — this step changes no TypeScript surface, so it must be green on its own.

**References:**
- Context §9 (data model changes), §6 (Prisma constraints), §5 (why the dedupe key is event-scoped)
- Repo root `AGENTS.md` — **[STRICT] Prisma CLI Usage (AI Only)**: AI may not apply migrations, may not hand-write migration files, and existing migration files are immutable
- `app/prisma/schema.prisma` — `AthleteRaceResult`, `AthleteEvent`, `Campaign`, `DonationEvent` for naming and mapping conventions
- `app/prisma/seed.ts`

### Plan
- Apply the schema changes from context §9, keeping the file's existing section grouping (result/event changes in the athlete domain block, notifications near `Donation`).
- Follow file conventions exactly: `@id @default(uuid()) @db.Uuid`, `@@map` to snake_case plural table names, explicit field names.
- Include the dedupe-key comment verbatim — this rationale is non-obvious and earns a comment under the [STRICT] Comment Rules.
    - Snippet:
      ```prisma
      // Idempotency guard. Keyed on athleteEventId, NOT athleteRaceResultId: the
      // races write path is delete-all-then-recreate, so result ids churn on every
      // profile save. Event ids are stable only because the roadmap write path was
      // reconciled to update in place rather than recreate (context §5).
      dedupeKey String @unique
      ```
- Extend `app/prisma/seed.ts`: give a seeded athlete (e.g. `felix-tremblay`) an `AthleteEvent` with `completedAt` set and a race result carrying that `athleteEventId`.
- Run `npm run build-client --prefix app`. Do **not** run any `prisma migrate` command.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - Contracts: race-result event link, backer, and notification Zod schemas

### Metadata
**Status:** Incomplete
**Prereqs:** 1
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Land every Zod contract this task needs, and update the one existing mapper the contract change breaks, so CI stays green.

**Done When:**
- `common/src/zod/athlete.ts` — `athleteRaceResultSchema` gains `athleteEventId: idSchema.nullable()`, and `setRaceResultInputSchema` gains `athleteEventId: idSchema.optional()`.
- **`toRaceResultDto` in `app/src/api/athletes/AthleteService.ts:332-344` returns `athleteEventId`.** Without this the app fails type-check and every athlete-profile response fails client-side schema validation in `apiRequest`.
- No repository change is needed to expose the field: `richProfileInclude.raceResults` (`app/src/repositories/AthleteRepository.ts:16`) uses `orderBy` with no `select`, so every scalar — including the new `athleteEventId` — is already returned. Verified during planning; do not add a redundant `select`.
- `common/src/types/enums.ts` exports `BackerNotificationType` with `EVENT_RESULT_POSTED` and `DONATION_SUCCEEDED`.
- `common/src/zod/backer.ts` exports `backedAthleteSchema`, `impactSummarySchema`, `upcomingBackedEventSchema`, `backedResultSchema`, `backerDashboardResponseSchema`, `backerActivityQuerySchema`, `backerActivityResponseSchema`, and inferred types.
- `common/src/zod/notification.ts` exports `backerNotificationSchema`, `backerNotificationListResponseSchema`, and types.
- Both new modules are re-exported from `common/src/index.ts`.
- `npm run build --prefix common` succeeds, and existing athlete tests (`app/src/api/athletes/athletes.read.test.ts`, `athletes.write.test.ts`) still pass — they assert on `raceResults` shape.
- Response shapes match the example payloads in context §9 field-for-field.

**References:**
- Context §9 (example shapes), §10 (`common/` impact)
- `common/src/zod/athlete.ts:46-58` (`athleteRaceResultSchema`) and `:228-243` (`setRaceResultInputSchema` — a module-private `const`, not exported — plus `setAthleteRaceResultsRequestSchema`). Note `setRaceResultInputSchema` carries no `occurredOn`, so the write path cannot set it.
- `app/src/api/athletes/AthleteService.ts:332-344` — the mapper that must be updated in this same step
- `common/src/zod/shared.ts` — reuse `idSchema`, `isoDateTimeSchema`, `slugSchema`, `moneyCentsSchema`, `mediaRefSchema`, `paginationResponseSchema`
- `common/src/zod/follow.ts` — the template for a "my X" list contract
- Repo root `AGENTS.md` — [STRICT] Explicit Naming, and the Zod-first workflow (edit `common/`, build it, then update `app/`, then `client/`)

### Plan
- Extend the two race-result schemas. Adding `athleteEventId` to the *input* schema is what lets the link survive the replace-all save (context §5).
    - Snippet:
      ```ts
      // Nullable link attributing this result to a funded event. Optional on the
      // write side; omitting it on a save clears the link, because the race-results
      // write path replaces the whole set.
      athleteEventId: idSchema.nullable(),
      ```
- Build `common`, then immediately update `toRaceResultDto` so `app` compiles again:
    - Snippet:
      ```ts
      athleteEventId: raceResult.athleteEventId,
      ```
- Add the enum to `common/src/types/enums.ts` alongside `DonationStatus`. **That file uses `as const` objects plus a derived type — never a TypeScript `enum`.** Match the convention exactly; `z.nativeEnum` accepts the const object, which is how `SportCategory` is already consumed.
    - Snippet:
      ```ts
      export const BackerNotificationType = {
        EventResultPosted: 'EVENT_RESULT_POSTED',
        DonationSucceeded: 'DONATION_SUCCEEDED',
      } as const;

      export type BackerNotificationType =
        (typeof BackerNotificationType)[keyof typeof BackerNotificationType];
      ```
    - Note the Prisma-generated enum is a separate symbol with `SCREAMING_SNAKE` members. Where app code writes a notification row it uses the Prisma enum; where it maps to the DTO it uses this one. Keep the import sources straight or the two will silently diverge.
- Create `common/src/zod/backer.ts`.
    - Snippet:
      ```ts
      export const impactSummarySchema = z.object({
        backedAthleteCount: z.number().int().nonnegative(),
        totalBackedCents: moneyCentsSchema,
        backedEventCount: z.number().int().nonnegative(),
        unreadNotificationCount: z.number().int().nonnegative(),
      });

      // A race result surfaced to a backer. `wasBacked` is true when the result is
      // linked to an event the caller actually funded, so the UI can distinguish
      // "your event" from "another result by an athlete you back".
      export const backedResultSchema = z.object({
        athleteRaceResultId: idSchema,
        athleteEventId: idSchema.nullable(),
        athleteSlug: slugSchema,
        athleteName: z.string(),
        primarySport: z.nativeEnum(SportCategory),
        resultName: z.string().min(1).max(200),
        displayDate: z.string().min(1).max(120),
        occurredOn: z.string().date().nullable(),
        resultSummary: z.string().min(1).max(2000),
        resultUrl: z.string().url().nullable(),
        heroPhotoRef: mediaRefSchema.nullable(),
        wasBacked: z.boolean(),
      });

      // Card data for the backer dashboard. `totalBackedCents` and `donationCount`
      // are THIS backer's figures only — never the athlete's total raised.
      export const backedAthleteSchema = z.object({
        athleteId: idSchema,
        athleteSlug: slugSchema,
        athleteName: z.string(),
        primarySport: z.nativeEnum(SportCategory),
        disciplineLabel: z.string().nullable(),
        heroMediaUrl: mediaRefSchema.nullable(),
        totalBackedCents: moneyCentsSchema,
        donationCount: z.number().int().positive(),
        firstBackedAt: isoDateTimeSchema,
        latestResultName: z.string().nullable(),
        latestResultSummary: z.string().nullable(),
        latestResultOccurredOn: z.string().date().nullable(),
      });

      export const backerDashboardResponseSchema = z.object({
        impactSummary: impactSummarySchema,
        backedAthletes: z.array(backedAthleteSchema),
        upcomingBackedEvents: z.array(upcomingBackedEventSchema),
        recentResults: z.array(backedResultSchema),
      });

      export const backerActivityQuerySchema = z.object({
        athleteId: idSchema.optional(),
        limit: z.coerce.number().int().positive().max(100).optional().default(50),
      });

      export const backerActivityResponseSchema = paginationResponseSchema(backedResultSchema);
      ```
    - Note there is no `cursor` field: result lists are capped and uncursored, following the `FollowService` precedent, because result ids churn (context §6).
- Create `common/src/zod/notification.ts`. `paginationResponseSchema` returns a `ZodObject`, so `.extend()` on its result is valid — confirm this compiles rather than assuming it.
    - Snippet:
      ```ts
      export const backerNotificationListResponseSchema = paginationResponseSchema(
        backerNotificationSchema
      ).extend({ unreadCount: z.number().int().nonnegative() });
      ```
- Append the barrel exports to `common/src/index.ts` and rebuild `common`.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Stabilize athlete event identity (fixes live campaign→event data loss)

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Make `AthleteEvent.id` survive a roadmap save. Everything downstream — the campaign→event join the dashboard reads, the result→event link, and the fan-out dedupe key — assumes it does, and today it does not.

> **This step fixes a bug that exists in `main` right now, independent of this feature.** `replaceRoadmapEvents` deletes every `AthleteEvent` for the athlete and recreates them (`app/src/repositories/AthleteRepository.ts:294-316`). `Campaign.athleteEvent` is `onDelete: SetNull` (`app/prisma/schema.prisma:373`), and `CampaignService.createCampaign` persists `athleteEventId` (`app/src/api/campaigns/CampaignService.ts:61-77`). So **every time an athlete edits their roadmap, every campaign→event link on their profile is silently destroyed.** That link is the join `Donation → Campaign → AthleteEvent` that this entire task depends on.

**Done When:**
- `AthleteRepository.replaceRoadmapEvents` no longer deletes and recreates unconditionally. It reconciles: events present in the payload with a known id are updated in place, events absent from the payload are deleted, and events with no id are created.
- `AthleteEvent.id` values are unchanged across a save that does not remove the event. Verified by a test that saves the same roadmap twice and asserts the id set is identical.
- `Campaign.athleteEventId` survives a roadmap save. This is the regression test that proves the live bug is fixed.
- `common/src/zod/athlete.ts` — `setRoadmapInputSchema` gains `athleteEventId: idSchema.optional()` so the client can round-trip existing ids; omitting it still means "create new".
- `client/lib/manageApi.ts` — `toEditRoadmap` stops discarding the real id. It currently does `id: uid()` (`client/lib/manageApi.ts:70-76`), which throws away `athleteEventId` entirely; the editor must carry the server id so `toRoadmapRequest` can send it back.
- `EditRoadmapItem` in `client/lib/athleteEdits.ts` distinguishes a server-assigned `athleteEventId` from the editor's local row key. Do not overload one field for both — locally-added rows have no server id yet.
- Deleting an event from the roadmap still cascades correctly and still nulls any dependent `Campaign.athleteEventId`. That behaviour is correct; only the *incidental* deletion is being removed.
- Existing roadmap tests in `app/src/api/athletes/athletes.write.test.ts` still pass, including ordering assertions.
- `npm run ci` passes.

**References:**
- Context §5 (identity churn), §4 (gaps), §12 (transaction shape)
- `app/src/repositories/AthleteRepository.ts:294-316` — `replaceRoadmapEvents`, the method being reconciled
- `app/src/repositories/AthleteRepository.ts:267-291` — `replaceRaceResults`, which stays replace-all deliberately (results have no inbound foreign keys; events do)
- `app/prisma/schema.prisma:355-384` — `Campaign`, showing the `athleteEvent` relation and `onDelete: SetNull`
- `client/lib/manageApi.ts:70-76` (`toEditRoadmap`) and `:132+` (`toRoadmapRequest`)
- `client/lib/athleteEdits.ts` — `EditRoadmapItem`
- `common/src/zod/athlete.ts` — `setRoadmapInputSchema`, `athleteRoadmapItemSchema` (which already exposes `athleteEventId`)

### Plan
- Reconcile rather than replace. `orderedTimestamps` is currently used to force a stable read order via `createdAt`; preserve that intent by writing `sortOrder`-equivalent ordering without destroying rows.
    - Snippet:
      ```ts
      // Reconciled, not replaced: AthleteEvent.id is referenced by Campaign and by
      // AthleteRaceResult, both onDelete: SetNull. Deleting and recreating on every
      // roadmap save silently severed those links (context §5).
      replaceRoadmapEvents(
        athleteId: string,
        events: RoadmapEventInput[]
      ): Promise<AthleteProfileWithRelations> {
        return this.prisma.$transaction(async (tx) => {
          const keptIds = events.map((e) => e.athleteEventId).filter(Boolean) as string[];
          await tx.athleteEvent.deleteMany({
            where: { athleteId, id: { notIn: keptIds.length > 0 ? keptIds : ['00000000-0000-0000-0000-000000000000'] } },
          });
          for (const [index, event] of events.entries()) {
            if (event.athleteEventId) {
              await tx.athleteEvent.update({
                where: { id: event.athleteEventId },
                data: { eventName: event.eventName, displayDate: event.displayDate, eventStartDate: parseEventStartDate(event.displayDate) },
              });
            } else {
              await tx.athleteEvent.create({ data: { athleteId, /* … */ } });
            }
          }
          return tx.athleteProfile.findUniqueOrThrow({ where: { id: athleteId }, include: richProfileInclude });
        });
      }
      ```
    - **Scope the `update` by `athleteId` as well as `id`**, or an athlete could rename another athlete's event by supplying a foreign uuid. Prefer `updateMany({ where: { id, athleteId } })` and assert the affected count.
    - Watch the empty-`keptIds` case: `notIn: []` matches nothing in Prisma, which would delete nothing rather than everything. Handle "payload is empty, delete all" explicitly rather than relying on a sentinel uuid.
- Preserve read ordering. The existing include orders by `[{ eventStartDate: 'asc' }, { createdAt: 'asc' }]`; reconciled rows keep their original `createdAt`, so verify ordering is still deterministic for same-date events and adjust the include if not.
- Client: carry the real id.
    - Snippet:
      ```ts
      // Round-trips the server id so a roadmap save updates events in place instead
      // of recreating them — which used to sever campaign and result links.
      function toEditRoadmap(profile: AthleteProfile): EditRoadmapItem[] {
        return (profile.roadmap ?? []).map((event) => ({
          id: uid(),                       // local row key for React
          athleteEventId: event.athleteEventId, // server identity
          name: event.eventName,
          date: event.displayDate,
        }));
      }
      ```
- Extend the field-mapping comment block at `client/lib/manageApi.ts:32` to document the new id round-trip.
- Add the two regression tests named in Done When. The campaign-link one is the important one — it is the proof the live bug is closed.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Repositories: backer aggregates, notifications, result link, donation claim

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Own every new Prisma query behind repositories, so the services in Steps 5-8 never touch the client directly.

**Done When:**
- `app/src/repositories/BackerRepository.ts` exposes `listBackedAthletes(supporterUserId)`, `listUpcomingBackedEvents(supporterUserId, limit)`, `listResultsForBacker(supporterUserId, filter, limit)`, `listBackerUserIdsForEvent(athleteEventId, tx?)`, and `listBackedEventIds(supporterUserId)`.
- `app/src/repositories/BackerNotificationRepository.ts` exposes `createMany(rows, tx?)` with `skipDuplicates: true`, `listForUser(recipientUserId, limit)`, `countUnread(recipientUserId)`, `markRead(recipientUserId, backerNotificationId)`, and `markAllRead(recipientUserId)`.
- `app/src/repositories/AthleteRepository.ts` — `replaceRaceResults` carries `athleteEventId` through the `createMany`; a new `findOwnedEventIds(athleteId, athleteEventIds)` supports the Step 5 ownership check; a new `markEventCompleted(athleteEventId, tx?)` is guarded on `completedAt: null`.
- **`replaceRaceResults` is refactored to accept an optional `tx` and reuse it instead of opening its own transaction.** It currently calls `this.prisma.$transaction(...)` unconditionally (`app/src/repositories/AthleteRepository.ts:267-291`). Step 5 needs to call it from inside an outer transaction, and Prisma does not support nested interactive transactions — without this refactor the call either errors or deadlocks against the rows the outer transaction holds. Existing callers that pass no `tx` must behave exactly as they do today.
- `app/src/repositories/DonationRepository.ts` gains `claimForSupporterEmail(supporterUserId, supporterEmail)` returning the claimed count.
- `listResultsForBacker` orders by `occurredOn desc` (never `createdAt` or `id` — they churn), takes a capped limit, and returns `nextCursor: null` at the service layer.
- Every athlete/campaign join filters `deletedAt: null`. Only `SUCCEEDED` donations count toward backing.
- `npm run type-check --prefix app` passes and existing athlete write tests still pass.

**References:**
- Context §5 (replace-all constraint), §12 (transaction shape), §7, §11
- `app/AGENTS.md` — **[STRICT]** all Prisma access is funnelled through repositories (`:33`); "each new entity gets a Repository even if there is only one caller" (`:37`) is a **[GUIDELINE]**, followed here by choice
- `app/src/repositories/AthleteRepository.ts:267-291` — the `replaceRaceResults` delete/recreate this must extend and make transaction-reusable
- `app/src/repositories/FollowRepository.ts` — `Prisma.validator` column-select pattern and idempotent-write comments
- `app/src/repositories/DonationRepository.ts` — the optional `tx?: Prisma.TransactionClient` threading convention
- `app/src/api/follows/FollowService.ts` — the capped-list, `nextCursor: null` precedent

### Plan
- Create `BackerRepository`. Backing is derived, so the core query is a grouped aggregate over donations joined to campaigns.
    - Snippet:
      ```ts
      // Backing is derived, never stored: a backer is any user with at least one
      // SUCCEEDED donation to one of the athlete's campaigns (context §5).
      async listBackedAthletes(supporterUserId: string): Promise<BackedAthleteRow[]> {
        const grouped = await this.prisma.donation.groupBy({
          by: ['campaignId'],
          where: { supporterUserId, donationStatus: DonationStatus.SUCCEEDED },
          _sum: { donationAmountCents: true },
          _count: { _all: true },
          _min: { createdAt: true },
        });
        // …resolve campaigns → athletes, fold per athlete…
      }
      ```
    - Folding happens per athlete, not per campaign: a backer who funded two campaigns of the same athlete must see one card with the combined total and the summed donation count.
- Add `listBackerUserIdsForEvent` — the fan-out recipient set. Must accept a transaction client and exclude guests.
    - Snippet:
      ```ts
      async listBackerUserIdsForEvent(
        athleteEventId: string,
        tx?: Prisma.TransactionClient
      ): Promise<string[]> {
        const db: Prisma.TransactionClient = tx ?? this.prisma;
        const rows = await db.donation.findMany({
          where: {
            donationStatus: DonationStatus.SUCCEEDED,
            supporterUserId: { not: null },
            campaign: { athleteEventId, deletedAt: null },
          },
          select: { supporterUserId: true },
          distinct: ['supporterUserId'],
        });
        return rows.map((row) => row.supporterUserId as string);
      }
      ```
- `listResultsForBacker` returns results from backed athletes, ordered by the stable field:
    - Snippet:
      ```ts
      // Ordered by occurredOn, NOT createdAt: the races write path recreates
      // every row on each profile save, so createdAt and id are both unstable.
      orderBy: [{ occurredOn: 'desc' }, { sortOrder: 'asc' }],
      ```
    - `occurredOn` is nullable. Decide and document the null placement (Postgres sorts NULLs first on `DESC` by default) so undated results do not silently head the log — prefer `{ occurredOn: { sort: 'desc', nulls: 'last' } }`.
- Refactor `replaceRaceResults` to be transaction-reusable. Extract the body into a local function and either run it on a supplied client or open a transaction:
    - Snippet:
      ```ts
      // Callable standalone (opens its own transaction) or inside an outer one.
      // Prisma has no nested interactive transactions, so passing `tx` MUST reuse
      // it rather than opening a second — see Step 5.
      replaceRaceResults(
        athleteId: string,
        races: RaceResultInput[],
        tx?: Prisma.TransactionClient
      ): Promise<AthleteProfileWithRelations> {
        const run = async (db: Prisma.TransactionClient) => {
          await db.athleteRaceResult.deleteMany({ where: { athleteId } });
          if (races.length > 0) {
            await db.athleteRaceResult.createMany({
              data: races.map((race, index) => ({
                athleteId,
                athleteEventId: race.athleteEventId ?? null,
                resultName: race.resultName,
                displayDate: race.displayDate,
                resultSummary: race.resultSummary,
                resultUrl: race.resultUrl,
                links: race.links as Prisma.InputJsonValue | undefined,
                photoRefs: race.photoRefs,
                sortOrder: index,
              })),
            });
          }
          return db.athleteProfile.findUniqueOrThrow({
            where: { id: athleteId },
            include: richProfileInclude,
          });
        };
        return tx ? run(tx) : this.prisma.$transaction(run);
      }
      ```
    - Verify no existing caller or test breaks: `tx` is optional and the no-arg path is byte-equivalent to today's behaviour.
- Add `findOwnedEventIds(athleteId, athleteEventIds)` returning the subset of ids that belong to the athlete, for the Step 5 gate.
- Add `markEventCompleted` as a guarded `updateMany`:
    - Snippet:
      ```ts
      // Guarded so a repeat save never bumps the timestamp (context §11).
      return db.athleteEvent.updateMany({
        where: { id: athleteEventId, completedAt: null },
        data: { completedAt: new Date() },
      });
      ```
- Add `BackerNotificationRepository.createMany` with the `skipDuplicates` comment, and `DonationRepository.claimForSupporterEmail` as an `updateMany` guarded on `supporterUserId: null`.
- Add focused unit tests for the non-trivial folding logic, using the mock style in `app/src/api/donations/DonationService.test.ts`; gate anything needing a live DB behind `RUN_DB_TESTS`.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 - Result→event link on the existing races write path + backer fan-out

### Metadata
**Status:** Incomplete
**Prereqs:** 2, 3, 4
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** When an athlete attaches a race result to one of their events, mark the event complete and tell every backer — exactly once, no matter how many times they save afterwards.

**Done When:**
- `PUT /v1/athletes/me/races` accepts an optional `athleteEventId` per race and persists it. **No new endpoint is added.**
- Every supplied `athleteEventId` is validated to belong to the calling athlete before anything is written; an unowned or unknown id rejects the whole save with `ForbiddenError` (403) — never partially applied.
- In one `$transaction`: results are replaced, each newly-linked event is marked completed (guarded), and one notification per distinct backer per event is inserted.
- `dedupeKey` is `` `${recipientUserId}:EVENT_RESULT_POSTED:${athleteEventId}` ``.
- **Saving the same profile twice produces zero additional notifications.** This is the headline test for this step.
- Two results linked to the same event produce one notification per backer, not two.
- An event with no campaign, or with only `PENDING` donations, links fine and notifies nobody.
- `logger.info({ athleteEventId, recipientCount }, 'event.result_posted')` is emitted **after** the transaction commits, not inside it.
- A `BackerNotificationService` owns `fanOutEventResult(context, tx)` so Step 6 can reuse the service for the donation notification.
- Tests cover: repeated-save idempotency, ownership rejection, two-results-one-event, and guest exclusion from the recipient set.

**References:**
- Context §5 (the replace-all constraint — read this first), §11 (edge cases), §12 (transaction shape, idempotency), §13 (observability)
- `app/src/api/athletes/AthleteService.ts:166-183` — `replaceMyRaceResults`, the method being extended
- `app/src/api/webhooks/StripeWebhookService.ts:22-31` — the `PrismaService` injection precedent for transaction orchestration in a service
- `app/src/api/webhooks/StripeWebhookService.ts:102-134` — the existing transactional idempotency pattern to mirror
- `BackerRepository.listBackerUserIdsForEvent` and `BackerNotificationRepository.createMany` from Step 4

### Plan
- Create `app/src/api/backers/BackerNotificationService.ts`.
    - Snippet:
      ```ts
      @injectable()
      export class BackerNotificationService {
        constructor(
          private readonly backers: BackerRepository,
          private readonly notifications: BackerNotificationRepository
        ) {}

        async fanOutEventResult(
          context: EventResultContext,
          tx: Prisma.TransactionClient
        ): Promise<number> {
          const recipientUserIds = await this.backers.listBackerUserIdsForEvent(
            context.athleteEventId,
            tx
          );
          if (recipientUserIds.length === 0) return 0;
          await this.notifications.createMany(
            recipientUserIds.map((recipientUserId) => ({
              recipientUserId,
              notificationType: BackerNotificationType.EVENT_RESULT_POSTED,
              athleteId: context.athleteId,
              athleteEventId: context.athleteEventId,
              notificationTitle: `${context.athleteName} finished ${context.eventName}`,
              notificationBody: context.resultSummary,
              dedupeKey: `${recipientUserId}:EVENT_RESULT_POSTED:${context.athleteEventId}`,
            })),
            tx
          );
          return recipientUserIds.length;
        }
      }
      ```
- Inject `PrismaService` into `AthleteService` so it can open the transaction. This does **not** violate `app/AGENTS.md` — that rule forbids importing `PrismaClient`, and `StripeWebhookService` already injects `PrismaService` for exactly this orchestration purpose. All actual queries still go through repositories.
- Validate ownership **before** opening the transaction:
    - Snippet:
      ```ts
      const requestedEventIds = [
        ...new Set(input.races.map((race) => race.athleteEventId).filter(Boolean) as string[]),
      ];
      if (requestedEventIds.length > 0) {
        const ownedEventIds = await this.athleteRepository.findOwnedEventIds(
          athlete.id,
          requestedEventIds
        );
        // Reject the whole save: a partially-applied link would silently drop the
        // athlete's intent on some rows and keep it on others (context §11).
        const unowned = requestedEventIds.filter((id) => !ownedEventIds.includes(id));
        if (unowned.length > 0) throw new ForbiddenError('Event does not belong to this athlete');
      }
      ```
- Wrap the write in a transaction that folds completion + fan-out, passing `tx` into `replaceRaceResults` (which Step 4 made transaction-reusable):
    - Snippet:
      ```ts
      const fanOutLog: Array<{ athleteEventId: string; recipientCount: number }> = [];
      const updated = await this.prisma.$transaction(
        async (tx) => {
          const profile = await this.athleteRepository.replaceRaceResults(athlete.id, rows, tx);
          for (const athleteEventId of requestedEventIds) {
            await this.athleteRepository.markEventCompleted(athleteEventId, tx);
            const recipientCount = await this.backerNotifications.fanOutEventResult(
              buildEventResultContext(athlete, athleteEventId, rows),
              tx
            );
            fanOutLog.push({ athleteEventId, recipientCount });
          }
          return profile;
        },
        // Default interactive-transaction timeout is 5s. This fold does a full
        // result replace plus two queries per linked event, so it is raised
        // deliberately rather than left to fail under a slow connection.
        { timeout: 15_000 }
      );
      // Logged after commit: logging inside the transaction would claim a fan-out
      // that a later rollback undoes.
      for (const entry of fanOutLog) this.logger.info(entry, 'event.result_posted');
      ```
- Keep the per-event work to exactly two queries — one recipient lookup, one `createMany`. Never loop per recipient; that is what turns this into a timeout.
- `buildEventResultContext` picks the **first result in payload order** linked to that event for the notification body, so two results on one event produce one deterministic message. It also needs the event name, which is not in the request payload — resolve it from the ids already fetched by `findOwnedEventIds` rather than issuing another query.
- Do not swallow fan-out errors; a failure must roll the save back so a retry is safe (context §12).
- Write the idempotency test explicitly: call the endpoint twice with identical payloads and assert the notification count is unchanged.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$backend-review` (`/backend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---
