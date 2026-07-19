# Platform Polish + Real Auth - Steps 1-5

## Step 1 - New ARC logo mark

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Replaced the boxed A/header mark, favicon, and generated OG image with a shared arc-and-stride mark that supports light and dark logo tones.

### Context

**Objective:** Design and wire a warmer, more distinctive ARC logo mark across the site header, favicon, and OG image.
**Done When:**
- `client/components/site/Logo.tsx` renders the new SVG mark (short + full variants).
- `client/app/icon.svg` uses the same mark, sized for favicon (32×32 viewBox).
- `client/app/opengraph-image.tsx` renders the new mark inside the existing OG frame.
- Dark and light `tone` variants still render legibly on light + dark headers (`SiteHeader.tsx`, `MobileMenu.tsx`).

**References:**
- Context §5, §10, §14
- `client/components/site/Logo.tsx:1-50`
- `client/components/site/SiteHeader.tsx`
- `client/app/icon.svg`
- `client/app/opengraph-image.tsx`

### Plan
- Design an "arc + stride" mark using the palette tokens `--color-primary` (warm terracotta) and `--color-primary-container` (light warm accent).
    - Snippet:
      ```tsx
      function ArcMark({ className }: { className?: string }) {
        return (
          <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
            <defs>
              <linearGradient id="arc-fill" x1="0" x2="1" y1="1" y2="0">
                <stop offset="0" stopColor="var(--color-primary)" />
                <stop offset="1" stopColor="var(--color-primary-strong,var(--color-primary))" />
              </linearGradient>
            </defs>
            <path
              d="M6 30c2-14 12-22 26-22"
              stroke="url(#arc-fill)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M13 30l7-14 7 14" fill="var(--color-primary-container)" />
          </svg>
        );
      }
      ```
- Update `Logo.tsx` sizing map to use the new mark; keep the `variant="full"` "Network" suffix.
- Copy the same path structure into `client/app/icon.svg` with plain colour values (no CSS vars — favicons can't use design tokens).
- Update `client/app/opengraph-image.tsx` to render the new mark on the OG frame; confirm the OG image regenerates on `next build`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 2 - Full-viewport home hero

### Metadata
**Status:** Complete
**Prereqs:** None
**Size:** small
**Owner:** codex
**Completed At:** 2026-07-19
**Completion Notes:**
- Replaced fixed hero heights with `min-h-screen min-h-[100svh]`, added safe-area padding, and pinned the scroll cue above the bottom safe area.

### Context

**Objective:** Expand the home hero from its fixed `h-[540px] md:h-[640px]` to a full viewport experience while preserving legibility and the scroll cue.
**Done When:**
- `client/components/site/home/HomeHero.tsx` uses `min-h-svh` (with `h-screen` fallback) and safe-area padding.
- Copy remains vertically centred and readable on iPhone SE (375×667) and 14-inch laptop (1440×900).
- Ken-burns image fills the frame; gradient wash + vignette remain effective.

**References:**
- Context §1, §5
- `client/components/site/home/HomeHero.tsx:5-76`

### Plan
- Replace the fixed heights with `min-h-svh` (`h-screen` fallback for older Safari).
    - Snippet:
      ```tsx
      <section className="relative flex min-h-[100svh] w-full items-center overflow-hidden bg-inverse-surface">
      ```
- Add `pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]` to the outer section so the copy and scroll cue avoid the notch on mobile.
- Verify the scroll cue sits above the bottom bezel — clamp its `bottom` to `max(env(safe-area-inset-bottom), 1.25rem)`.

### Step checklist
- [x] Step-specific tasks complete
- [x] `$frontend-review` (`/frontend-review`) run
- [x] `$ci` (`/ci`) run
- [x] Fix any issues caused by `$ci` (`/ci`)
- [x] Step metadata updated in the steps doc and the steps guide index
- [x] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 3 - Athlete profile polish: story toggle + move "See more" triggers to bottom

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** small
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Keep the story intro visible when the reader taps "See more", and move the "See all results" / "See all races" triggers to the bottom of their respective sections.
**Done When:**
- `AthleteProfile.tsx` My Story section keeps `profile.storyIntro` visible when expanded; toggle text switches between "See more" / "See less".
- `ProfileEditableSections.tsx` `EditedHighlights` renders the `<details>` trigger **after** all visible rows.
- `ProfileEditableSections.tsx` `EditedRaces` renders the `<details>` trigger **after** all visible rows.
- Chevron rotates on expand as before.

**References:**
- Context §1, §5
- `client/app/(marketing)/athletes/[athleteSlug]/AthleteProfile.tsx:316-336`
- `client/app/(marketing)/athletes/[athleteSlug]/ProfileEditableSections.tsx:46-150`

### Plan
- In `AthleteProfile.tsx`, replace the story `<details>` with a controlled toggle that renders the intro paragraph always, then conditionally the rest of the body.
    - Snippet:
      ```tsx
      const [showFullStory, setShowFullStory] = useState(false);
      // …
      <p className="mb-4">{profile.storyIntro}</p>
      {showFullStory ? (
        <div className="space-y-4">
          {profile.storyBody.map((p) => (<p key={p.slice(0, 32)}>{p}</p>))}
        </div>
      ) : null}
      <button onClick={() => setShowFullStory((v) => !v)} className="label-bold inline-flex items-center gap-1 text-primary">
        {showFullStory ? 'See less' : 'See more'}
        <Icon name="chevron" className={`h-4 w-4 transition-transform ${showFullStory ? 'rotate-180' : ''}`} />
      </button>
      ```
- In `ProfileEditableSections.tsx`, move the `<details>` "more" trigger below the mapped `visible` rows in `EditedHighlights` and `EditedRaces`. Ensure the summary text stays semantic and the chevron still rotates via `group-open:rotate-180`.
    - Snippet:
      ```tsx
      <div className="mt-6 space-y-4">
        {visible.map(...)}
        {rest.length > 0 ? (
          <details className="group mt-4">
            <summary className="label-bold flex ...">{moreLabel}<Icon .../></summary>
            <div className="mt-4 space-y-4">{rest.map(...)}</div>
          </details>
        ) : null}
      </div>
      ```

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 4 - Discovery cleanup: remove filters, add pagination, tighten mobile row

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Reduce `/athletes` to search + Region filter only, cap results per page, and clean up the mobile filter pill row.
**Done When:**
- `AthleteDirectory.tsx` no longer defines or renders the `SPORTS` (Discipline) or `LEVELS` filter groups on desktop rail or mobile pills.
- Deep-linked `?sport=…` and `?level=…` params are ignored gracefully (no crash).
- Results are paginated in 12-per-page slices with URL-synced `?page=N` and Prev/Next + numeric controls.
- Mobile filter row shows only the Region pills and a full-width Search input.

**References:**
- Context §1, §5, §7
- `client/app/(marketing)/athletes/AthleteDirectory.tsx:1-260`

### Plan
- Delete the `SPORTS` and `LEVELS` constants; remove the `FilterGroup` blocks for Discipline and Level in the sidebar and both mobile pill rows.
- Remove `sport` and `level` from the `Filters` type; keep `country` + `search`.
- Add pagination state:
    - Snippet:
      ```tsx
      const PAGE_SIZE = 12;
      const [page, setPage] = useState(1);
      const start = (page - 1) * PAGE_SIZE;
      const paged = filtered.slice(start, start + PAGE_SIZE);
      const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
      ```
- Reset `page` to 1 whenever a filter changes or search text changes.
- Sync `page` to the URL (`replaceState` — no full navigation) and read it on mount alongside the existing `country`/`search`.
- Render a `<nav aria-label="Pagination">` with Prev / numeric window / Next.
    - Snippet:
      ```tsx
      <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
        <PageButton onClick={() => setPage(page - 1)} disabled={page <= 1}>Prev</PageButton>
        {pageWindow(page, totalPages).map((n) => (
          <PageButton key={n} active={n === page} onClick={() => setPage(n)}>{n}</PageButton>
        ))}
        <PageButton onClick={() => setPage(page + 1)} disabled={page >= totalPages}>Next</PageButton>
      </nav>
      ```
- Tighten the mobile filter row: single row of Region pills only, plus the search input on top.
- Keep the initial-URL sync tolerant to legacy params (silently ignore `sport`, `level`).

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 5 - Photo gallery block carousel / lightbox

### Metadata
**Status:** Incomplete
**Prereqs:** None
**Size:** medium
**Owner:** claude
**Completed At:** YYYY-MM-DD
**Completion Notes:**
- [Notes]

### Context

**Objective:** Turn the athlete-profile gallery from static thumbs into a clickable block-carousel/lightbox that swipes on mobile and arrows on desktop.
**Done When:**
- New `client/components/ui/PhotoCarousel.tsx` renders a full-screen (or contained) carousel that supports touch-swipe, arrow keys, and a close button; renders a single `<dialog>` for a11y.
- `EditedGallery` renders the tiles as buttons that open the carousel at the tapped index.
- Works with 1..N photos and empties (empty state unchanged).
- Passes desktop hover + mobile touch check.

**References:**
- Context §1, §7, §14
- `client/app/(marketing)/athletes/[athleteSlug]/ProfileEditableSections.tsx:169-193`

### Plan
- Add `client/components/ui/PhotoCarousel.tsx`:
    - Snippet:
      ```tsx
      export function PhotoCarousel({ photos, openIndex, onClose }: Props) {
        const dialogRef = useRef<HTMLDialogElement>(null);
        const [index, setIndex] = useState(openIndex);
        useEffect(() => {
          if (openIndex >= 0) dialogRef.current?.showModal();
        }, [openIndex]);
        useEffect(() => {
          const onKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % photos.length);
            if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + photos.length) % photos.length);
          };
          window.addEventListener('keydown', onKey);
          return () => window.removeEventListener('keydown', onKey);
        }, [photos.length]);
        // touch-swipe via touchstart/touchend delta X
        return (<dialog ref={dialogRef} onClose={onClose}>...</dialog>);
      }
      ```
- Update `EditedGallery` to render `<button type="button">` tiles that call `setOpenIndex(index)`.
- Keep the empty state via `<EmptySection />` unchanged.
- Prevent body scroll while the dialog is open (`document.body.style.overflow = 'hidden'` in an effect).

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$frontend-review` (`/frontend-review`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
