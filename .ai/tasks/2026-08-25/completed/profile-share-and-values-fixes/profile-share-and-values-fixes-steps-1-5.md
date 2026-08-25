# Athlete Profile: Share Surface, Core Values, and URL Consistency Fixes - Steps 1-5

## Step 1 - Core value contract: make `body` optional (common → app → client)

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-25
**Completion Notes:**
- `common/src/zod/athlete.ts` — `athleteCoreValueSchema.body` is now `z.string().max(2000).default('')`. `AthleteCoreValue['body']` stays `string`. Rebuilt `common` before touching `app/` and `client/`.
- `app/src/api/athletes/AthleteService.ts` — `toCoreValues` now filters on `title` only and coerces a missing/non-string `body` to `''`, so a legacy or body-less stored entry survives the read instead of being dropped.
- `app/src/api/athletes/athletes.write.test.ts` — added `persists a core value that has a title but no body`, covering both an omitted `body` and an explicit `''` through PATCH and the public read.
- `client/lib/manageApi.ts` — `toEditCoreValues` defends with `value.body ?? ''`; `toStoryAndValuesPatch` no longer filters out title-only values and now throws `A saved core value needs a title.` for the body-without-title case.
- **Extra work required to meet "Done When":** `toManageSaveError` collapsed *every* thrown error to the generic `We couldn't save your changes.` sentence, so the new message (and the pre-existing highlight/race/roadmap messages) could never reach the banner. Added an exported `ManageEditsValidationError` in `client/lib/manageApi.ts`; all four editor-validation throws now use it and `toManageSaveError` returns its `message` verbatim. Transport failures still get the generic sentence.
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` — a body-less core value no longer renders an empty `<p>`.
- **Test caveat:** `app` DB tests are gated behind `RUN_DB_TESTS=1` and no local Postgres is running (`localhost:5432` unreachable), so the new round-trip test could not be executed locally. It is skipped by default and did not affect `npm run ci`.
- `npm run ci` passes (type-check, lint, build, cdk test/synth).

### Context

**Objective:** Stop the platform from silently discarding a core value that has a title but no "what it means to you" body, and give the inverse case (body, no title) a visible error.

**Done When:**
- `athleteCoreValueSchema` accepts an omitted or empty `body`, and `AthleteCoreValue['body']` is still typed `string`.
- Saving a core value with a title and a blank body from the manage editor persists it, and it reappears in the editor after a reload.
- Saving a core value with a body but no title surfaces `A saved core value needs a title.` in the editor's save error banner.
- The public profile does not render an empty paragraph element for a body-less core value.
- A new `app/` test covers a title-only core value round-trip.

**References:**
- Context sections 4 (Gaps), 9 (Data model and contracts), 11 (Edge cases)
- `common/src/zod/athlete.ts:69-72` — the schema
- `common/src/zod/athlete.ts:113` and `:188` — its two consumers
- `app/src/api/athletes/AthleteService.ts:363-371` — `toCoreValues`
- `client/lib/manageApi.ts:116-122` — `toEditCoreValues`
- `client/lib/manageApi.ts:289-301` — `toStoryAndValuesPatch`
- `client/lib/manageApi.ts:161-172` — the highlights error pattern to mirror
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx:391-399` — the render
- `app/src/api/athletes/athletes.write.test.ts:149-160` — the existing core value test

### Plan

- Relax the schema in `common/src/zod/athlete.ts`. Use `.default('')` rather than `.optional()` so the inferred output type stays `string` and no downstream consumer needs a null-check.
    - Snippet:
      ```ts
      export const athleteCoreValueSchema = z.object({
        title: z.string().min(1).max(120),
        body: z.string().max(2000).default(''),
      });
      ```
- **Rebuild `common` before touching anything else:** `npm run build --prefix common`.
- Make `toCoreValues` in `app/src/api/athletes/AthleteService.ts` coerce rather than drop, so a legacy or body-less stored entry survives the read.
    - Snippet:
      ```ts
      function toCoreValues(value: unknown): AthleteCoreValue[] {
        if (!Array.isArray(value)) return [];
        return value
          .filter(
            (entry): entry is { title: string; body?: unknown } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { title?: unknown }).title === 'string'
          )
          .map((entry) => ({
            title: entry.title,
            body: typeof entry.body === 'string' ? entry.body : '',
          }));
      }
      ```
- Stop the client dropping title-only values, and add the missing error, in `client/lib/manageApi.ts`.
    - Snippet:
      ```ts
      function toStoryAndValuesPatch(edits: AthleteEdits): UpdateAthleteProfileRequest {
        const untitledValue = edits.coreValues.find(
          (value) => !value.title.trim() && value.body.trim()
        );
        if (untitledValue) {
          throw new Error('A saved core value needs a title.');
        }
        const patch: UpdateAthleteProfileRequest = {
          coreValues: edits.coreValues
            .filter((value) => value.title.trim())
            .map((value) => ({ title: value.title.trim(), body: value.body.trim() })),
        };
        // ...storyIntro / storyBody unchanged
      }
      ```
- Harden `toEditCoreValues` against a body-less entry so the editor input never receives `undefined`.
    - Snippet:
      ```ts
      body: value.body ?? '',
      ```
- Suppress the empty paragraph on the public profile in `AthleteProfile.tsx`.
    - Snippet:
      ```tsx
      {value.body ? <p className="text-xs text-white/70">{value.body}</p> : null}
      ```
- Add the round-trip test in `app/src/api/athletes/athletes.write.test.ts` next to the existing case, asserting a `{ title, body: '' }` value persists and reads back.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$backend-review` (`/backend-review`) run — uncommitted scope, no `app/AGENTS.md` violations found
- [x] `$frontend-review` (`/frontend-review`) run — surfaced the `toManageSaveError` swallowing issue, fixed above
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - Bridge onboarding values into the editor and stop the profile dropping them

### Metadata
**Status:** Complete
**Prereqs:** 1
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-25
**Completion Notes:**
- `client/lib/manageApi.ts` `toEditCoreValues` — merges on load: stored `coreValues` first, then any `values` entry not already represented (case-insensitive), capped at `ATHLETE_CORE_VALUES_MAX`. Built with an explicit loop that adds to the `seen` set as it goes, so duplicates *within* `values` cannot both bridge.
- `client/lib/manageApi.ts` `toStoryAndValuesPatch` — rewrites `patch.values` from the surviving core value titles (40-char truncation, 8-entry cap), so a deletion sticks instead of resurrecting from `values` on the next load.
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx` — the either/or branch is now a union render: core value cards, then pills for any `athlete.values` entry with no matching core value title. The card is still hidden when both are empty.
- **Defect found and fixed during implementation:** the `values` mirror truncates titles to 40 chars, but a core value title may be up to 120. A >40-char title would therefore fail the case-insensitive match on the next load and bridge back as a *duplicate* editor row (and render as a duplicate pill on the public profile). Both the merge set and the profile's `coreValueTitles` set now also match on the truncated form.
- **Caps moved into the contract:** `ATHLETE_VALUE_MAX_LENGTH` (40), `ATHLETE_VALUES_MAX` (8), and `ATHLETE_CORE_VALUES_MAX` (12) are now exported from `common/src/zod/athlete.ts` and used both by the schemas themselves and by the two client call sites, rather than three copies of the same magic numbers. Follows the `ATHLETE_GALLERY_MAX_PHOTOS` precedent.
- **Deviation from the plan snippet:** the plan had `toStoryAndValuesPatch` silently truncate `coreValues` to 12. The merge is already capped at 12 on load, so anything over 12 at save time is the athlete manually adding rows — silently dropping their typed work is worse than the pre-existing generic save failure. It now throws a `ManageEditsValidationError` with actionable copy instead.
- **Gates verified by reading, not by running** (no local DB / API): the load-bearing gate is `deriveApiChecklist` in `client/app/(marketing)/dashboard/DashboardClient.tsx:197` (`profile.values.length > 0`). The `DashboardClient.tsx:100` and `PublishPanel.tsx:72,86` gates read the **onboarding draft store** (`useOnboarding()`), not the API profile, so a manage save cannot affect them at all. The API gate stays satisfied because the bridge loads `values` into the editor and the sync writes them straight back.
- `values` is only ever empty after a save if the athlete deleted every core value — a deliberate action, not a side effect.
- `npm run ci` passes.

### Context

**Objective:** Make the two disconnected value stores behave as one. Values chosen during onboarding must appear in the manage editor as editable, deletable rows, deletions must stick, and no value the athlete can see today may disappear from the public profile.

**Done When:**
- An athlete whose values came from onboarding sees them as rows in the manage editor's Core Values section.
- Editing a bridged value's title or body and saving persists the change.
- Deleting a bridged value and saving keeps it deleted across a reload — it does not resurrect from `values`.
- Saving a core value never makes previously visible values vanish from the public profile.
- `profile.values` is never emptied by a manage save; the dashboard checklist item and the publish-readiness gate still register values as present.

**References:**
- Context sections 4 (Gaps), 5 (Impact and considerations), 11 (Edge cases)
- `client/lib/manageApi.ts:116-122, 136-157, 289-301`
- `client/lib/onboardingApi.ts:122` — onboarding writes `values`
- `client/lib/onboardingProfileView.ts:119` — the existing values→coreValues mapping to mirror
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx:385-413` — the either/or render to replace
- `client/app/(marketing)/dashboard/DashboardClient.tsx:100` — completeness gate reading `values`
- `client/app/register/review/PublishPanel.tsx:72,86` — publish-readiness gate reading `values`
- `common/src/zod/athlete.ts:112,187` — `values` is `max(40)` per entry, `max(8)` entries; `coreValues` is `max(12)`

### Plan

- **[STRICT] Read the constraint first:** `values` is not display-only. Two gates read `profile.values.length`. This step syncs `values`; it must never clear it.
- Merge on load in `profileToEdits` (`client/lib/manageApi.ts:136`). Stored `coreValues` come first; any `values` entry whose title is not already represented (case-insensitive) is appended as a body-less core value. Cap at 12.
    - Snippet:
      ```ts
      function toEditCoreValues(profile: AthleteProfile): EditCoreValue[] {
        const stored = (profile.coreValues ?? []).map((value) => ({
          id: uid(),
          title: value.title,
          body: value.body ?? '',
        }));
        const seen = new Set(stored.map((value) => value.title.trim().toLowerCase()));
        const bridged = (profile.values ?? [])
          .filter((value) => value.trim() && !seen.has(value.trim().toLowerCase()))
          .map((value) => ({ id: uid(), title: value.trim(), body: '' }));
        return [...stored, ...bridged].slice(0, 12);
      }
      ```
- Sync on save in `toStoryAndValuesPatch` (`client/lib/manageApi.ts:289`). Rewrite `values` from the surviving core value titles so a deletion sticks, honouring the 40-char and 8-entry caps.
    - Snippet:
      ```ts
      const titles = edits.coreValues
        .map((value) => value.title.trim())
        .filter((title) => title.length > 0);
      patch.values = titles.map((title) => title.slice(0, 40)).slice(0, 8);
      ```
    - Note the asymmetry deliberately: `coreValues` allows 12 and 120-char titles, `values` allows 8 and 40 chars. `values` is a lossy mirror kept only so the existing gates keep working. Do not "fix" this by widening the `values` schema.
- Replace the either/or branch in `AthleteProfile.tsx:385-413` with a union render: core value cards, then pills for any `athlete.values` entry not already present as a core value title (case-insensitive). Keep the whole card hidden when both are empty.
    - Snippet:
      ```tsx
      const coreValueTitles = new Set(
        profile.coreValues.map((value) => value.title.trim().toLowerCase())
      );
      const unmatchedValues = athlete.values.filter(
        (value) => !coreValueTitles.has(value.trim().toLowerCase())
      );
      ```
- Leave `client/lib/athleteEdits.ts` `deriveEdits` alone. Mock mode already receives onboarding values as core values via `onboardingProfileView.ts:119`, so it needs no bridge.
- Verify the two gates still pass by loading the dashboard for an athlete whose values exist only as onboarding `values`, then again after a manage save.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run — surfaced the 40-char truncation duplicate-row defect and the triplicated cap literals
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action

---

## Step 3 - Fix the mobile bottom nav / share bar collision

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-25
**Completion Notes:**
- **Reproduced first**, dev server on `:3000`: `/athletes?profile=maya-okafor` → 1 nav, `/athletes/maya-okafor` → 0. Matches the context §14 evidence.
- `client/components/site/MobileBottomNav.tsx` — the private regex is gone. The nav now calls `athleteRouteFromPath(pathname, searchParams)` and returns `null` only for `kind === 'profile'`, so the manage page keeps its nav (context §15 open question resolved as planned: current behaviour preserved).
- `client/app/(marketing)/layout.tsx` — the mount is wrapped in `<Suspense>`, required because `useSearchParams` opts the subtree out of the static prerender under `output: 'export'`.
- **Deviation from the plan (`fallback={null}`), with reason.** A `null` fallback made the export build drop the nav from **every** prerendered page — verified: `index.html`, `community.html`, `dashboard.html`, `for-athletes.html` all went to 0 occurrences. That trades the profile-page overlap for a bottom nav that pops in after hydration on every mobile page of the site, which conflicts with the "no visible flash" non-functional requirement and the `client/AGENTS.md` fast-read mandate. Added `MobileBottomNavFallback`, which reads only `usePathname()` (prerender-safe) and renders the nav unless the path is under `/athletes`. Under `output: 'export'` a single `athletes.html` serves `/athletes`, `/athletes?profile=<slug>` and the rewritten `/athletes/<slug>`, so that page genuinely cannot be resolved at build time — but every other route can.
- Verified against the rebuilt static export (`client/out/`): `index.html` 1, `community.html` 1, `dashboard.html` 1, `for-athletes.html` 1, `athletes.html` 0, `athletes/maya-okafor.html` 0, `athletes/maya-okafor/manage.html` 0. The manage page's nav now arrives on hydration rather than in the prerender; acceptable, since that page loads all of its data client-side anyway.
- Verified against the dev server in **mock** mode (`:3100`, `NEXT_PUBLIC_DATA_SOURCE=mock`), after the fix: `/athletes/maya-okafor` 0, `/athletes?profile=maya-okafor` 0, `/athletes` 1, `/` 1, `/community` 1, `/dashboard` 1, `/athletes/maya-okafor/manage` 1. All seven Done-When route expectations hold.
- Sticky bar confirmed present alongside the hidden nav on the path form: `/athletes/maya-okafor` serves the `SHARE` button and the `env(safe-area-inset-bottom)` bar with 0 nav occurrences.
- **Verification caveat:** the Chrome extension is not connected in this environment, so the 390px *visual* check could not be run. The overlap is nonetheless disproved structurally rather than by z-index reasoning — the nav element is not rendered at all on either profile URL form, so it cannot paint over the share bar. On the `?profile=` form the SHARE button is client-rendered by `AthleteDirectory`, so it is absent from the server HTML by design and was not directly asserted; the nav absence (the actual defect) was.
- `STATIC_EXPORT=true npm run build --prefix client` succeeds. `npm run ci` passes.

### Context

**Objective:** Make the mobile bottom nav recognise both profile URL forms so it stops painting over the profile's sticky action bar and hiding the SHARE button.

**Done When:**
- `client/components/site/MobileBottomNav.tsx` contains no route regex of its own and calls `athleteRouteFromPath`.
- On a mobile viewport, the SHARE button is visible and tappable at both `/athletes/<slug>` and `/athletes?profile=<slug>`.
- The nav still renders on `/athletes`, `/`, `/community`, and `/dashboard`.
- The nav still renders on `/athletes/<slug>/manage` (current behaviour preserved — see the open question in context §15).
- There is no visible flash of the nav on profile pages.
- `STATIC_EXPORT=true npm run build --prefix client` succeeds.

**References:**
- Context sections 4 (Gaps), 6 (Constraints), 15 (Open questions)
- `client/components/site/MobileBottomNav.tsx:56-59` — the regex to remove
- `client/lib/profileUrl.ts:58-74` — `athleteRouteFromPath`
- `client/app/(marketing)/athletes/AthleteDirectory.tsx:47` — the same helper in use
- `client/app/(marketing)/layout.tsx:16` — where the nav is mounted
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx:589-612` — the sticky bar being covered

### Plan

- Reproduce first so the fix is verifiable. With `npm run dev:client` running:
    - Snippet:
      ```sh
      for u in "/athletes?profile=maya-okafor" "/athletes/maya-okafor"; do
        echo "$u -> $(curl -s "http://localhost:3000$u" | grep -c 'aria-label="Mobile primary"')"
      done
      # before this step: 1 then 0. after: 0 then 0.
      ```
- Replace the private regex with the shared helper. Narrow the guard to `kind === 'profile'` so the manage page keeps its nav.
    - Snippet:
      ```tsx
      const pathname = usePathname();
      const searchParams = useSearchParams();
      // Profile pages have their own sticky action bar; two stacked bars is too much chrome.
      const athleteRoute = athleteRouteFromPath(pathname, searchParams);
      if (athleteRoute?.kind === 'profile') return null;
      ```
- **Gotcha:** `useSearchParams` in a client component forces the nearest parent to opt out of static prerendering unless it sits under a Suspense boundary, and this build ships as `output: 'export'`. Wrap the mount in `client/app/(marketing)/layout.tsx`.
    - Snippet:
      ```tsx
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
      ```
    - If the export build still objects, the proven in-repo alternative is `AthleteDirectory`'s pattern — read `window.location.search` inside a `useEffect` (`AthleteDirectory.tsx:42-54`). Prefer the Suspense route; fall back only if the build forces it, and note which was used in the completion notes.
- Confirm the sticky bar is genuinely visible, not merely present in the DOM, at a 390px-wide viewport on both URL forms. The two elements are both `fixed` at `z-40`, so a DOM-presence check alone does not prove the fix.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run — surfaced the site-wide prerender regression from `fallback={null}`
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action

---

## Step 4 - Share UX: native share sheet and Copy link

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** medium
**Owner:** ai
**Completed At:** 2026-08-25
**Completion Notes:**
- All changes are in `client/app/(marketing)/athletes/[athleteSlug]/ShareCard.tsx`. `client/lib/shareImage.ts` and the platform size list are untouched, as scoped.
- `canNativeShare` is detected in a `useEffect`, so first render is identical on server and client and there is no hydration mismatch by construction.
- `toShareFile()` wraps the callback-based `canvas.toBlob` in a promise and resolves `null` on a throw, which is the tainted-canvas case (`crossOrigin='anonymous'` is set, but a non-CORS photo host would still taint it).
- `nativeShare()` degrades in three tiers: `canShare({files})` → image + link; otherwise `navigator.share({title,text,url})` → link only; on any other rejection → `download()`. `AbortError` (the athlete dismissing the OS sheet) returns silently.
- `copyLink()` reuses the `DashboardClient.tsx:466-475` pattern verbatim in behaviour — swallow on failure, 2s transient `Copied` label.
- `absoluteUrl` and `shareText` were hoisted out of `share()` so the web intents, the native share, and Copy link cannot drift apart on what they send.
- **Interpretation of "the per-platform intent steps down":** where `navigator.share` exists, the OS sheet already routes the image and link to X/Facebook/LinkedIn/Instagram/TikTok, so the per-platform web-intent button is *removed* on that path rather than kept beside it. Both paths therefore show exactly three actions — mobile: Share / Download image / Copy link; desktop: Download image / Share to `<platform>` / Copy link — instead of a native button plus a redundant intent. This is the `client/AGENTS.md` "replace clutter, do not add to it" reading; flag it if the intent button should have been retained on mobile too.
- Added a `LinkGlyph`; the copy button swaps to the existing `CheckGlyph` while confirming.
- **Verification caveat:** the Chrome extension is not connected here, so the OS share sheet, the clipboard write, and the console-warning check could not be exercised in a real browser. What was verified: the profile page serves the SHARE button, type-check and lint are clean, and the static export build succeeds. The Web Share API paths need a manual pass on a phone — carried into Step 7.
- `npm run ci` passes; `STATIC_EXPORT=true npm run build --prefix client` succeeds.

### Context

**Objective:** Give athletes the one-tap mobile path they asked for — the OS share sheet carrying the generated card image and their profile link — plus a Copy link action for sharing by message.

**Done When:**
- On a mobile browser supporting the Web Share API, the share modal offers a primary native Share action that opens the OS sheet with the PNG attached and the profile URL included.
- When the browser supports `navigator.share` but not file payloads, sharing falls back to link-only without an error.
- When `navigator.share` is absent, the native button is not rendered and the existing platform intents and Download remain.
- A Copy link action copies the absolute profile URL and shows transient confirmation.
- Dismissing the OS share sheet produces no error UI.
- No hydration warning appears in the console on the profile page.

**References:**
- Context sections 7 (Functional requirements), 11 (Edge cases)
- `client/app/(marketing)/athletes/[athleteSlug]/ShareCard.tsx:130-157` — `download()` and `share()`
- `client/app/(marketing)/athletes/[athleteSlug]/ShareCard.tsx:274-297` — the actions row to extend
- `client/app/(marketing)/dashboard/DashboardClient.tsx:466-475` — the copy-link pattern to reuse
- `client/lib/shareImage.ts` — the canvas renderer (unchanged by this step)
- `client/AGENTS.md` — minimalism: replace clutter, do not add to it

### Plan

- Feature-detect in an effect, never during render. `navigator` does not exist during prerender, so a render-time check would desync hydration.
    - Snippet:
      ```tsx
      const [canNativeShare, setCanNativeShare] = useState(false);
      useEffect(() => {
        setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
      }, []);
      ```
- Add a canvas→`File` helper. `toBlob` is callback-based; wrap it. Guard against a tainted canvas throwing.
    - Snippet:
      ```tsx
      const toShareFile = (): Promise<File | null> =>
        new Promise((resolve) => {
          const canvas = canvasRef.current;
          if (!canvas) return resolve(null);
          try {
            canvas.toBlob((blob) => {
              resolve(blob ? new File([blob], `${slug}-${platform}.png`, { type: 'image/png' }) : null);
            }, 'image/png');
          } catch {
            resolve(null);
          }
        });
      ```
- Add `nativeShare()` with the three-tier degradation: files → link-only → download. Swallow `AbortError`, which is the user dismissing the sheet.
    - Snippet:
      ```tsx
      const nativeShare = async () => {
        const url = resume.url.startsWith('http') ? resume.url : `https://${resume.url}`;
        const text = `Back ${resume.name} on ARC. ${resume.tagline}.`;
        const file = await toShareFile();
        try {
          if (file && navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: resume.name, text, url });
            return;
          }
          await navigator.share({ title: resume.name, text, url });
        } catch (error) {
          if ((error as Error)?.name === 'AbortError') return;
          download();
        }
      };
      ```
- Add Copy link, reusing the `DashboardClient` pattern verbatim in behaviour (try/catch, swallow on failure, transient "Copied" label).
- Place the actions so the mobile-primary path is obvious: when `canNativeShare`, the native Share button is the primary action and the per-platform intent button steps down. Do not render both a native Share and six platform buttons as equals — that fails the minimalism mandate.
- Leave `client/lib/shareImage.ts` and the platform size list untouched. The card artwork is not in scope.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run — drove hoisting the shared URL/text and the action-count decision
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action

---

## Step 5 - Verify the CloudFront `/athletes/<slug>` rewrite and add a CDK regression test

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** ai
**Completed At:** 2026-08-25
**Completion Notes:**

### VERDICT: the rewrite is LIVE — verified on production (`athletearc.ca`), not on test

**`test.athletearc.ca` could not be used: it does not resolve.**

```
$ nslookup test.athletearc.ca
** server can't find test.athletearc.ca: NXDOMAIN
$ curl -o /dev/null -w '%{http_code}' https://test.athletearc.ca/athletes
000   (curl exit 6, could not resolve host)
```

The test environment is not currently deployed. Production is up (`https://athletearc.ca/` → 200) and is the host that actually matters for this gate: `PROFILE_HOST` in `client/lib/profileUrl.ts` is `athletearc.ca`, so every share link Step 6 generates resolves against production, not test. Verified there instead.

**Evidence — content identity, not status codes.** Every path returns 200 (the 404 page is served with a 200), so the check compares response bodies against two known controls: `/athletes` (the athletes page) and `/nonexistent-page-xyz` (the 404 page). Within a single run:

```
/athletes/maya-okafor         -> md5 5b65766c…  athletes-page marker: 1
/athletes/maya-okafor/manage  -> md5 5b65766c…  athletes-page marker: 1
/athletes/x/y/z               -> md5 2d80e540…  athletes-page marker: 0
/nonexistent-page-xyz         -> md5 2d80e540…  athletes-page marker: 0
```

An earlier run also showed `/athletes/maya-okafor` byte-identical to `/athletes` (both md5 `c5cb5325…`, 33704 bytes) while `/athletes/x/y/z` was byte-identical to `/nonexistent-page-xyz` (both `384713c2…`, 13648 bytes). So: the slug path and the manage path are both rewritten to the athletes page, and the known-bad `/athletes/x/y/z` correctly falls through to `/404.html`. The rewrite is live and its negative control behaves.

> Note the md5s differ between runs for the same path — the deployed HTML carries some per-response variance. Only within-run comparisons are meaningful, which is how the evidence above is structured. The `"That dream isn't on our map yet"` grep from the plan returns 0 even on the real 404 page: the deployed 404 predates that copy, and the source spells it `&rsquo;`. The control-path comparison replaces it and is stronger.

**Regression test added** — `cdk/test/web-stack.test.ts`. Rather than string-matching the escaped regex (brittle, and passes even if the branch is unreachable), the test evaluates the **synthesized** CloudFront Function source and asserts the routing it actually performs:

```
/athletes/maya-okafor          -> /athletes.html
/athletes/maya-okafor/         -> /athletes.html
/athletes/maya-okafor/manage   -> /athletes.html
/athletes/maya-okafor/manage/  -> /athletes.html
/athletes                      -> /athletes.html
/athletes/maya/okafor/extra    -> /404.html
/                              -> /
/_next/static/chunk.js         -> /_next/static/chunk.js
```

Deleting the `/athletes/` branch makes the first four assertions fail. `npm run test --prefix cdk` passes; `npm run synth:test --prefix cdk` passes as part of `npm run ci`. No changes to `cdk/lib/web-stack.ts` — it was already correct.

**Client-side navigation** (Step 6 depends on this): `client/app/_components/AthleteRouteFallback.tsx` is the covering mechanism. It is wired into both `client/app/not-found.tsx` and `client/app/(marketing)/not-found.tsx`, reads the route via `athleteRouteFromPath(pathname)`, and renders `AthleteProfileHydrator` (or `ManageProfile`) when the Next router 404s on a slug that was never pre-rendered. So an in-app `<Link>` to `/athletes/<slug>` resolves without the CloudFront rewrite, and a hard load resolves with it.

**No deployment was run**, per root `AGENTS.md`. Step 6 is unblocked on the strength of the production evidence above.

**For the user:** if `test.athletearc.ca` is meant to be live, it is not — worth checking separately. It does not block this task.

### Context

**Objective:** Establish, with evidence, whether the deployed CloudFront distribution rewrites `/athletes/<slug>` to `/athletes.html`. Step 6 is gated on the answer. Add a test so the rewrite cannot silently regress.

**Done When:**
- A recorded verdict exists in this step's Completion Notes: the rewrite is either **live on test** or **not live**, with the command output that proves it.
- `cdk/test/web-stack.test.ts` asserts the synthesized CloudFront function source contains the `/athletes/` rewrite branch.
- `npm run test --prefix cdk` and `npm run synth:test --prefix cdk` pass.
- If the rewrite is **not** live, Step 6 is marked Blocked in the steps guide and the user is asked to deploy. **Do not deploy.**

**References:**
- Context sections 4 (Current state), 6 (Constraints), 12 (Failure modes)
- `cdk/lib/web-stack.ts:53-114` — `STATIC_ROUTE_REWRITE_CODE`
- `cdk/lib/web-stack.ts:71-74` — the `/athletes/<slug>` branch
- `cdk/test/web-stack.test.ts` — currently has no `athletes` coverage
- `cdk/README.md:378` — the smoke-test entry point against `https://test.athletearc.ca`
- Root `AGENTS.md` — **[STRICT] No Deployments (AI Only)**

### Plan

- Verify against the deployed test distribution. A 200 alone is not proof — the 404 page also returns 200 on some configurations, so assert on content that only the athletes page carries.
    - Snippet:
      ```sh
      SLUG=<a seeded test athlete slug>
      curl -s -o /dev/null -w '%{http_code}\n' "https://test.athletearc.ca/athletes/$SLUG"
      # Distinguish the athletes page from the 404 page:
      curl -s "https://test.athletearc.ca/athletes/$SLUG" | grep -c "That dream isn't on our map yet"
      # 0 => rewrite is working (athletes page served)
      # 1 => request fell through to /404.html
      ```
    - Cross-check the control case `https://test.athletearc.ca/athletes` and a known-bad path such as `/athletes/x/y/z`.
    - Seeded test accounts use `@seed.athletearc.ca` (`cdk/config/test.ts:35`); pick a slug from the seeded roster in `app/prisma/seed.ts`.
- If the rewrite is **not** live: stop. Record the evidence, set Step 6 to Blocked in the steps guide, and ask the user to deploy. Do not run any deploy command, and do not proceed to Step 6.
- Add the regression test to `cdk/test/web-stack.test.ts`, following whatever assertion style that file already uses.
    - Snippet:
      ```ts
      // The path-form profile URL depends on this rewrite; profileUrl.ts generates
      // /athletes/<slug> hrefs that 404 without it.
      assert.match(functionSource, /\\\/athletes\\\/\[\^\\\/\]\+/);
      ```
    - Assert on the synthesized template's CloudFront Function code, not on the TypeScript constant, so the test proves what actually ships.
- Note in the Completion Notes whether `AthleteRouteFallback` (`client/app/_components/AthleteRouteFallback.tsx`) is the mechanism covering client-side navigation to a non-prerendered slug, since Step 6 relies on it for in-app `<Link>` navigation.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$infra-review` (`/infra-review`) run — no stack changes needed; `cdk/lib/web-stack.ts` already correct, gap was test coverage only
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`) — none
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action
