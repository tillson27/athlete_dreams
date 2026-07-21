# Backer Dashboard and Race Result Notifications - Steps 11-13

## Step 11 - Client: result log page + header notification bell

### Metadata
**Status:** Incomplete
**Prereqs:** 10
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** The chronological history of everything the backer's athletes have done, plus the unread badge that pulls them back.

**Done When:**
- `client/app/(marketing)/backers/activity/page.tsx` + `BackerActivityClient.tsx` render a chronological timeline of results from backed athletes.
- Filter chips select "All athletes" or one athlete, reusing the chip *styling* from `CommunityClient.tsx`. The active filter is reflected in a URL query param so the view is linkable and survives refresh — this is net-new: `CommunityClient` and `AthleteDirectory` both use local `useState` with no URL sync, so there is no in-repo pattern to copy.
- Each timeline entry shows the athlete, date, result name, summary, an optional photo, an external results link when `resultUrl` is set, and a share affordance.
- `client/components/site/NotificationBell.tsx` renders in `SiteHeader` for signed-in users: a bell icon with an unread count badge, opening a panel of recent notifications.
- Clicking a notification marks it read and navigates to the linked athlete profile; a "Mark all read" action clears the badge.
- The panel closes on outside click and on Escape — both net-new, since `MobileMenu.tsx` is a native `<details>` element that demonstrates neither. Every control has `type="button"` and appropriate `aria-*` state — matching the bar set by `FollowButton.tsx` and `MobileMenu.tsx`.
- The bell renders nothing (not an empty badge) when signed out or when `ready` is false.
- Unread count refreshes on mount; no polling interval is added.
- Empty state uses `EmptyState` from Step 10.
- Verified in the browser at desktop and 375px in mock mode, with a screenshot.

**References:**
- Context §7, §8, §11
- Stitch reference: `arc_backer_full_activity_result_log/code.html` — the dashed vertical timeline line, circular icon nodes, and filter chips. Its "Fund Utilization", "GPS Verified", and "View Transparency Report" elements are out of scope (context §2).
- `client/app/(marketing)/community/CommunityClient.tsx` — chips, tabs, URL-param sync
- `client/components/site/MobileMenu.tsx` — a native `<details>` disclosure with a single `onClick` close. It is **not** an outside-click/Escape pattern; the panel's dismissal behaviour is net-new.
- `client/components/site/HeaderAuth.tsx` — `const { session, ready } = useSession()` gate
- `client/components/site/FollowButton.tsx` — aria/state conventions

### Plan
- Build the timeline with the dashed rail as a CSS `repeating-linear-gradient` using `--color-outline-variant`, matching the Stitch treatment with a token.
- Filter chips drive both the query param and the `useBackerActivity(athleteFilter)` hook.
    - Snippet:
      ```tsx
      // URL-synced so a filtered log is linkable and survives refresh. No existing
      // filter surface does this — the directory and community chips are local state.
      const searchParams = useSearchParams();
      const athleteFilter = searchParams.get('athlete');
      ```
    - Wrap any `useSearchParams()` consumer in `<Suspense>` — required for the static export build, as `/donate/thanks` already does.
- Notification bell:
    - Snippet:
      ```tsx
      const { data, loading } = useBackerNotifications();
      if (!ready || !session) return null;
      const unread = data.unreadCount;
      ```
    - Badge renders only when `unread > 0`; use `aria-label={`Notifications, ${unread} unread`}`.
- Mark-read is optimistic: update local state immediately, fire the request, roll back on failure with the existing one-sentence error convention.
- There is no pagination control — the API returns a capped list (context §6). If the cap is hit, show a quiet line saying so rather than implying there is more to load.
- QA in mock mode at both widths; confirm no console errors.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 12 - Client: athlete event picker, share graphic, guest sign-up prompt

### Metadata
**Status:** Incomplete
**Prereqs:** 11
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Give athletes the control that triggers the whole loop, and give backers something to share when it fires.

**Done When:**
- **Athlete side:** each race-result row in `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` gains an optional event picker, populated from the athlete's own roadmap events, that sets `athleteEventId` on save.
- The picker includes a "Not tied to an event" option, and copy makes the consequence explicit in one sentence — linking a result tells everyone who funded that event. Athletes must not trip the notification without knowing.
- The picker is the only new athlete-facing UI; the existing save flow, autosave behaviour, and `PUT /v1/athletes/me/races` call are otherwise untouched.
- **Share side:** `client/lib/shareImage.ts` gains a backer variant (`drawBackerImpactCard` or an equivalent option on `drawShareCard`) rendering the athlete photo, result name, result summary, and a "Proud Backer" badge.
- `client/app/(marketing)/backers/share/[athleteRaceResultId]/` renders a live preview with a square/story ratio toggle, a Download Image action, and a Copy Share Link action pointing at the athlete's public profile.
- The share graphic contains **no** verification or cryptographic-signature claim — the Stitch mock's "unique cryptographic signature verifying the timing result" line is dropped (context §2).
- Copy-link feedback uses the existing swap-the-label pattern (`{copied ? 'Copied!' : 'Copy link'}` with a 2s reset); no toast primitive is introduced.
- `generateStaticParams()` covers the mock result ids so the static export build succeeds.
- **Guest side:** `client/app/(marketing)/donate/thanks/page.tsx` gains a `SignUpPrompt.tsx` modal shown to signed-out donors, selling the journey rather than asking for an account. Signed-in donors instead get a plain "See your backer dashboard" CTA to `/backers` and no modal.
- The modal's copy names the three concrete things a profile gets them — following the athlete toward their next event, receiving the race result when they finish, and keeping every athlete they back in one place — plus a line stating the donation they just made will attach to the new profile automatically if they use the same email.
- The modal is dismissible (Escape, backdrop click, and an explicit secondary action). Dismissing leaves an inline card on the page with the same CTA, so the path is never lost.
- The modal appears after a short beat rather than instantly, so the thank-you headline registers first, and never appears more than once per visit.
- **The accessibility work here is net-new — there is no complete modal precedent in the repo to copy.** `DonateWidget.tsx` provides only `role="dialog"` (`:58`), `aria-modal="true"` (`:59`), an `aria-label` (`:60`), and backdrop-click dismissal (`:61`); it has **no portal, no focus management, no Escape handler, and no scroll lock**. The only `createPortal` usage in the client is `client/app/register/review/PublishPanel.tsx:4,124`. Build the prompt with all of: `createPortal` (pattern from `PublishPanel`), `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing at the heading, focus moved into the dialog on open and returned to the trigger on close, Escape-to-close, and background scroll lock.
- `/sign-up` carries a single contextual line when arriving with `?from=donation`, so the promise made in the modal is repeated at the form rather than dropped.
- Verified in the browser: the picker saves and round-trips, the modal opens/dismisses/traps focus correctly signed out and is absent signed in, the canvas renders in both ratios, download produces a file, at desktop and 375px, with a screenshot.

**References:**
- Context §7, §2 (share-graphic non-goals), §5 (the link must survive replace-all saves)
- Stitch reference: `shareable_impact_report/code.html` — the ratio toggle, glass-overlay stat tiles, and "PROUD BACKER" badge
- `client/lib/shareImage.ts` — `ShareCardData` (`:4`), `ShareCardFonts` (`:13`), `drawShareCard(ctx, W, H, data, image, fonts)` (`:15`) — note it takes a canvas context and dimensions, not just data
- `client/app/(marketing)/athletes/[athleteSlug]/ShareCard.tsx` — the existing UI around the canvas, including download handling
- `client/app/(marketing)/athletes/[athleteSlug]/manage/ManageProfile.tsx` — the race-results editor rows
- `client/lib/manageApi.ts` — DTO↔editor field mapping; `athleteEventId` must be threaded through both directions or the link is dropped on save
- `client/app/(marketing)/athletes/[athleteSlug]/DonateWidget.tsx` — dialog roles and backdrop dismissal only; **verified to lack** portal, focus trap, Escape, and scroll lock. Do not assume it is a complete a11y reference.
- `client/app/register/review/PublishPanel.tsx:4,124` — the repo's only `createPortal` usage; the portal pattern to follow
- `client/app/(marketing)/donate/thanks/page.tsx` — already frames the moment as "Congratulations on being a part of {athleteName}'s journey"; the modal continues that thread rather than restating it
- `client/lib/session.ts` — `useSession()` returns `{ session, ready }`; the modal must stay hidden until `ready` to avoid flashing at signed-in donors

### Plan
- Thread `athleteEventId` through **three** places, all verified to exist. Missing the read direction silently clears every link on the athlete's next save — this is the highest-risk detail in the step.
    - `EditRace` in `client/lib/athleteEdits.ts` — add the field to the editor-side type.
    - `toEditRaces` in `client/lib/manageApi.ts:58-66` — the **read** direction, DTO → editor.
    - `toRacesRequest` in `client/lib/manageApi.ts:112+` — the **write** direction, editor → `SetAthleteRaceResultsRequest`.
    - Snippet:
      ```ts
      // Round-trips the event link. Dropping this on the read side would clear every
      // link on the next save, because the write path replaces the whole result set.
      athleteEventId: race.athleteEventId ?? null,
      ```
    - Note the field-mapping comment block at `client/lib/manageApi.ts:32` documents the DTO↔editor name mapping; extend it rather than leaving the new field undocumented.
    - Add an explicit QA assertion for the round trip: link an event, save, hard-reload the manage page, save again **without touching anything**, and confirm the link is still set and no second notification was produced.
- Add the picker as a `<select>` styled with the existing `formInputClass`, sourced from the athlete's roadmap events already loaded in the editor.
- Extend the canvas module rather than adding a second renderer; share the font-loading and download helpers already in `shareImage.ts`.
    - Snippet:
      ```ts
      export type BackerImpactCardData = {
        athleteName: string;
        resultName: string;
        resultSummary: string;
        photoUrl: string | null;
        ratio: 'square' | 'story';
      };
      ```
- Build the share page around the existing `ShareCard.tsx` structure: canvas left, controls right, stacking on mobile. Ratio toggle is a two-button pill group using existing token classes.
- Build `client/app/(marketing)/donate/thanks/SignUpPrompt.tsx` as a portal modal mirroring `DonateWidget.tsx`. Use this copy as written — it is the whole point of the prompt, and inventing it at execution time is how it becomes a generic "Create an account".
    - Snippet:
      ```tsx
      // The ask lands right after a donation, so it sells the relationship rather
      // than the account. Three concrete things, one sentence, then the reassurance.
      <h2 id={headingId} className="font-display text-2xl font-extrabold text-on-surface">
        Stay in {athleteName ?? 'their'} corner
      </h2>
      <p className="mt-3 text-on-surface-variant">
        Make a free profile to follow {athleteName ?? 'this athlete'} on the road to their
        next event, get their result the moment they finish, and keep every athlete you
        back in one place.
      </p>
      <p className="mt-4 text-sm text-on-surface-variant">
        Sign up with the same email you just used and we&rsquo;ll connect this donation to
        your profile automatically.
      </p>
      ```
    - Primary action: `Create my free profile` → `/sign-up?from=donation&athlete={slug}`. Secondary: `Not right now`, which closes the modal.
    - **The "we'll connect this donation automatically" sentence is conditional on context §15.** The claim is gated on a verified email and does nothing until the in-flight auth task lands verification. If this task ships first, **cut that sentence** — do not promise a connection the system will not make. Confirm which way the open question resolved before writing the final copy.
- Gate the modal on `ready && !session`, and delay it behind a short timer so the thank-you headline reads first.
    - Snippet:
      ```tsx
      // Let the thank-you land before asking for anything.
      useEffect(() => {
        if (!ready || session) return;
        const timer = setTimeout(() => setPromptOpen(true), 1200);
        return () => clearTimeout(timer);
      }, [ready, session]);
      ```
- On dismissal, render the same offer as an inline card beneath the existing CTAs so a closed modal does not dead-end the guest.
- Add the contextual line to `/sign-up` when `?from=donation` is present — one sentence, e.g. "Your donation is waiting to be connected to your new profile." Wrap the `useSearchParams()` read in `<Suspense>`.
- Signed-in donors get a `See your backer dashboard` link to `/backers` in the existing CTA stack and no modal at all.
- Keep every string above within `client/AGENTS.md` [STRICT] Minimalism — one heading, one benefit sentence, one reassurance, two buttons. If it reads long during QA, cut the reassurance line into the sign-up page rather than lengthening the modal.
- QA: link a result to an event in the manage editor, save, reload, and confirm the link persisted; then verify the modal signed out (opens, traps focus, Escape and backdrop dismiss, inline card remains) and its absence signed in; then render both share ratios and download.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 13 - Final Validation & Cleanup

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Confirm the whole backer loop is coherent end to end, and hand the owner a clear list of what only they can do.

**Additional validation specific to this task:**
- Trace the full loop against the code: donation succeeds → notification + `SUPPORTER` role → athlete links a result to the event → fan-out → backer sees badge → result log → athlete profile → share.
- **Re-verify the idempotency property end to end**, since it is the load-bearing guarantee of this design: saving an athlete profile repeatedly must never produce a second notification, and the result log must not reorder between saves.
- Confirm no client surface breaks in mock mode and `npm run build --prefix client` succeeds with `STATIC_EXPORT=true`.
- Confirm no page or share graphic makes a verification, audit, OCR, or cryptographic-signature claim anywhere in the copy.
- Confirm no donor PII appears in any payload or page.
- Record the owner follow-ups in the Completion Notes: (1) start Postgres and set `DATABASE_URL`; (2) draft and apply the migration via `npm run migrate:create --prefix app -- --name add_backer_notifications_and_result_event_link`, coordinating with the in-flight `platform-polish-and-real-auth` Step 6 migration; (3) run the DB-backed test suite with `RUN_DB_TESTS=1`; (4) exercise a real donation → link result → notification round trip in Stripe test mode.
- Note the pre-existing `cdk` `constructs` type errors as unrelated to this task, as the prior task did.
- Surface the §15 open question — whether post-hoc spend reporting ever gets built — as an explicit product decision for the owner rather than leaving it implied.

### Final Step Checklist
* [ ] Confirm all prior steps are complete
* [ ] Review and resolve any outstanding TODOs introduced during this task
* [ ] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [ ] Run the `$ci` (`/ci`) skill and confirm it passes
- [ ] Fix any issues caused by `$ci` (`/ci`)
* [ ] Update task metadata in the steps docs and the steps guide index
* [ ] Move `.ai/tasks/2026-07-20/backer-dashboard-and-result-notifications/` to `.ai/tasks/2026-07-20/completed/backer-dashboard-and-result-notifications/`
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
