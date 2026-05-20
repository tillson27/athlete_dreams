> **`AGENTS.md` Instruction Precedence (DO NOT EDIT)**
>
> Hierarchical and additive — apply this file plus all parent `AGENTS.md` files up to repo root. Most specific wins on conflict.
>
> **Chain:** `client/AGENTS.md` _(this file)_ > `AGENTS.md` _(root)_

---

# client/ — Marketing Site + App UI

Next.js 15 (App Router) + React 19 + Tailwind CSS v4. Today's mandate is the **marketing site** for FAD (Fund an Athlete's Dream): athlete discovery, donation funnels, sponsor pages, ambassador program intake.

## Folder Layout

- `app/` — Next.js App Router pages and layouts. Routes are currently flat (no route groups yet) — split into `(marketing)/`, `(directory)/`, `(auth)/` groups when the route count justifies the indirection.
- `components/` — Shared UI:
  - `site/` — Marketing chrome (Header, Footer, Section primitives, AthleteCard).
  - `ui/` — Generic building blocks (Button, Badge, ProgressBar, etc.).
- `lib/` — Non-UI utilities (formatters, mock data fixtures, future API client).
- `styles/globals.css` — Tailwind v4 entry + design tokens.

## Design Principles (Product Mandates)

- **[STRICT] Minimalism.** Athletes and brands are not technical users. Every page must read in under 10 seconds. Default to fewer fields, fewer steps, fewer fonts.
- **[STRICT] Story-first.** Lead with the athlete's name, sport, story, and photo. Metrics (funding raised, supporter count) come after.
- **[STRICT] Transparency.** Whenever we show a campaign, show the cost breakdown — what the money is for.
- **[GUIDELINE]** Use motion sparingly. A subtle hover state beats a bouncing card every time.

## Rules

- **[STRICT]** Import API types from `fad-common`. Never duplicate request/response shapes.
- **[STRICT]** Money displays come from a single helper (`lib/format.ts → formatCents`). No ad-hoc `(cents / 100).toFixed(2)` in components.
- **[GUIDELINE]** Server Components by default; only mark `'use client'` when interactivity demands it.
- **[GUIDELINE]** Routes are organized by **audience**, not by feature — supporters, athletes, and brands each see a distinct landing.
