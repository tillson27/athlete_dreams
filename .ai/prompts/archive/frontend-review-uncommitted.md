# Review Scope

Review `client/AGENTS.md` as the **canonical source of frontend rules and principles**.

Treat **every rule, section, and rule type** (`[STRICT]` and `[GUIDELINE]`) in `client/AGENTS.md` as **in-scope**; do **not** limit review only to the categories listed below.

Review the **uncommitted changes** in `client/` (frontend), plus only the **directly related context** needed to evaluate them, for **violations, inconsistencies, and improvement opportunities** relative to those rules.

Identify and explain any issues in the uncommitted changes and the directly related flows/context needed to assess them.

Focus especially on (as relevant to the uncommitted changes):

* Feature-first organization and folder ownership
* Next.js 16 App Router conventions
* State boundaries (TanStack Query vs Zustand vs local state)
* Tailwind CSS v4 usage and design token consistency
* Logging, API helpers, and side-effect management
* Dead code, duplication, and unnecessary abstractions
* Separation of concerns and long-term scalability

# Change Scope

Only implement modifications directly justified by the current uncommitted changes.

After identifying issues, **refactor and improve the code** to fully align with `client/AGENTS.md`.

Make changes deliberately, avoid over-engineering, and do not introduce tests or new tooling.


## Scope Control: Uncommitted-Change–Driven Work Only

Your work must be **driven exclusively by the current uncommitted changes** (both **staged** and **unstaged**) as the source of truth for scope.

### What This Means (Strict)

* You may **edit any files in the repo** (including adding, deleting, moving, or refactoring files) **as needed** to correctly implement, support, or clean up the uncommitted changes.
* However, **every modification you make must be directly attributable to the uncommitted changes**—i.e., necessary to complete them, make them correct, make them consistent with `AGENTS.md`, fix breakages they introduce, or refactor the surrounding code to integrate them cleanly.

### What This Does *Not* Allow

* Do **not** “opportunistically” refactor unrelated areas.
* Do **not** introduce new features, redesign architecture, or change behavior unrelated to the uncommitted-change intent.
* If you touch additional files, it must be **in service of** correctness, maintainability, or contract alignment **specifically for the uncommitted changes**.

---

## UI/UX Stability Contract (`client/AGENTS.md` Is Gospel)

When working on the frontend, treat the **user-facing UI as a frozen surface**. You have broad freedom to refactor internals to comply with `client/AGENTS.md`, but the **rendered UI and product semantics must remain mostly identical**.

**Do not change:**

* **Copy/text (strict):** no edits to any user-facing words anywhere (labels, headings, button text, placeholders, helper text, empty/error text, tooltips, etc.).
* **Feature set:** no adding/removing capabilities, actions, screens, controls, or flows (aside from potentially improved/added error displays/handling, and potentially other minor tweaks/additions).
* **Layout/structure/hierarchy:** no meaningful changes to placement, grouping, ordering, or information architecture as perceived by the user.
* **Established naming/concepts:** do not rename or re-conceptualize anything already established in the UI.
* **Navigation & interaction model:** do not move actions, restructure forms, or change how users accomplish tasks.

If a change would be noticeable to a typical user as “the UI changed,” it is out of bounds.

---

### Allowed Changes (Examples; Must Preserve Frozen Surface)

You may change/refactor **anything necessary** to comply with `client/AGENTS.md` and to make the uncommitted-change intent correct and robust, **as long as the frozen surface above is preserved**. Examples include:

* **Behavioral / data-flow UX correctness:** fixing loading/error/empty *behavior* (timing, correctness, preventing flicker, preventing stale UI, ensuring consistent disabled/enabled states, etc.), request lifecycle issues (race conditions, cancellation/abort, retries, idempotency assumptions, cache invalidation, stale data, etc.), and predictable error propagation **without changing any copy or layout**.
* **State boundary and architecture fixes:** correcting TanStack Query vs Zustand vs local state ownership, removing duplicated/conflicting sources of truth, clarifying data flow, simplifying abstractions, reorganizing code to match `client/AGENTS.md`.
* **Performance and reliability improvements:** preventing duplicate requests, removing waterfalls, reducing unnecessary re-renders, hardening edge cases—again **without changing layout or text**.
* **Minor visual polish:** small motion adjustments (including add/remove/tune) to reduce jank, tiny spacing/sizing tweaks that do not meaningfully alter structure, and small token-consistent color tweaks to adhere to theming/readability—**provided the result is subtle enough that a casual observer would not perceive a UI change** and the interaction model/layout/copy remain unchanged.

## Net Approach

Refactor freely to satisfy `client/AGENTS.md` and fix correctness, but **do not change what the user sees, reads, or understands the product to be**. **Scope is defined by the uncommitted changes**, but **file boundaries are not**—and **UI presentation is effectively frozen** aside from minimal, necessity-driven adjustments to adhere to `client/AGENTS.md`.
