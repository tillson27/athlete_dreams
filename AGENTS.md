> **`AGENTS.md` Instruction Precedence (DO NOT EDIT)**
>
> This is the repo root `AGENTS.md`. All other `AGENTS.md` files inherit from this one. Most specific wins on conflict.
>
> **Chain:** `AGENTS.md` _(root — this file)_

---

# GLOBAL FAD Project Guide for AI Contributors

This section captures repo-wide structure, tooling, and coordination workflows. Folder-specific guidance lives in the `AGENTS.md` file within each top-level package.

## Tag Types

* **[STRICT]** – non-negotiable; violations must be fixed.
* **[GUIDELINE]** – default best practice or general instructions; only deviate with clear, documented reasons.
* If neither tag is present, treat the section or content as a **[GUIDELINE]**.

## Product Overview

FAD (Fund an Athlete's Dream) is a three-pillar athlete network:

1. **Crowdfunding** — athletes raise money for specific events, travel, gear, or training within their network. The primary go-to-market motion.
2. **Corporate sponsorships** — brands discover and sponsor athletes whose values align with theirs.
3. **Managed ambassador programs** — FAD operates ambassador discovery and intake on behalf of enterprises.

Anchor product decisions on (1) until the directory has critical mass.

**[STRICT] Differentiators to preserve in every feature:**
- **Transparency** — supporters can see what they are funding (event, gear, travel) and receive post-event updates.
- **Athlete stories** — photos, video, accomplishments, and values come before metrics or fees.
- **Minimalist UX** — dead simple for non-technical athletes and enterprises. Resist adding fields, options, or steps that aren't load-bearing.

## Repository Overview

- TypeScript monorepo with npm workspaces. Marketing site + UI is the current focus; the backend is scaffolded foundations.

### Directory Layout

- `app/` — Express 5 API in TypeScript with tsyringe DI and Prisma persistence. Currently scaffolded for User/Team/Athlete/Campaign primitives.
- `client/` — Next.js 15 App Router app (React 19, TypeScript, Tailwind CSS v4). Marketing site + the start of the authenticated experience.
- `common/` — Shared Zod schemas published in the workspace as `fad-common`.
- `cdk/` — Reserved for AWS CDK v2 infrastructure (not yet implemented).
- `docs/` — Architecture notes and product references.
- `scripts/` — Sync scripts for AI instruction files and skills, expired-rule checker.
- `.ai/` — AI agent configuration: skills (`skills/`), prompts (`prompts/`), rules (`rules/`), deferred tasks (`tasks/`).
- `.claude/skills/`, `.codex/skills/` — Auto-generated mirrors of `.ai/skills/` via `scripts/sync-skills-folders.js`.

## Root `package.json` Scripts

- `dev` — runs `app` and `client` dev servers concurrently.
- `build` — runs `script:rules:check` and `script:sync:all`, then builds `common`, `app`, `client` sequentially.
- `type-check` — TypeScript checks across `common`, `app`, `client`.
- `lint`, `lint:fix` — lint workflows for `app` and `client`.
- `ci` — runs `type-check`, `lint:fix`, and `build`.
- `script:sync:all` — runs `script:agents:sync`, `script:skills:sync`, `script:skills:check`.
- `script:agents:sync` — mirrors `AGENTS.md` instruction files to `CLAUDE.md` and `GEMINI.md` across packages and injects precedence headers.
- `script:skills:sync` — mirrors `.ai/skills/` → `.claude/skills/` and `.codex/skills/`.
- `script:skills:check` — reports skill file lengths (soft limit info).
- `script:rules:check` — validates no expired temporary rules remain in `AGENTS.md`.

## Operating Mode

* **Quality > Speed.** Favor correctness, maintainability, explicitness.

## MCPs (when available)

* context7
* posthog

## Workflows

### Environment Setup (Local)

- `npm install` (runs root `postinstall` to install package deps for `common`, `app`, `client`).
- `npm run ci` (builds everything so there is no chance for future unexpected errors or issues).

### [STRICT] Making Common Changes

1. **Understand** — Clarify requirements; read business docs and specs before touching code.
2. **Research** — Search for existing patterns, read related files, and understand current conventions.
3. **Plan** — Present the approach for approval before implementing.

**Decision: Is the task significantly large or complex, requires robust understanding/research, or would be difficult to complete in one session?**
If so, ask the user whether they want to break it down into a task.

**If yes (use task planning):**
1. Use the `$task-planning` (`/task-planning`) skill (or see `{.ai,.claude,.codex}/skills/task-planning/SKILL.md`) to create comprehensive task documentation.
2. Complete the first incomplete step using the `$step-execution` (`/step-execution`) skill (or see `{.ai,.claude,.codex}/skills/step-execution/SKILL.md`).

**If no (or the task is not significantly large/complex):**
1. **Implement** — Follow existing patterns; make focused, incremental changes.
2. **Verify** — Run the `$ci` (`/ci`) skill (or see `{.ai,.claude,.codex}/skills/ci/SKILL.md`).
3. **Commit** — **ONLY** when asked, use the `$commit` (`/commit`) skill (or see `{.ai,.claude,.codex}/skills/commit/SKILL.md`).

### [STRICT] Skill Execution

1. **Read the skill directory** — Skills live in `.ai/skills/<name>/` (synced to `.claude/skills/` and `.codex/skills/` via sync scripts).
2. **Follow SKILL.md** — The primary instruction file; read it fully before acting.
3. **Use supporting files** — If the skill references other skills, or other files, use them as directed by `SKILL.md`.
4. **Execute sequentially** — Follow the skill's workflow phases in order; don't skip steps.
5. **Meet quality standards** — Each skill defines its own; verify you've met them before completing.

### [STRICT] API Contract Changes (Zod-first)

1. Edit Zod schemas in `common/src/zod/` (single source of truth for request/response shapes).
2. Build `common` (`npm run build --prefix common`).
3. Update `app/` handlers to match the Zod contract.
4. Update `client/` API calls and type usage as needed.

**Key rule:** Import API types directly from `fad-common`—never duplicate or redefine request/response interfaces in `app/` or `client/`.

### Environment Variables

- Update relevant package `.env.example` when adding new environment variables (`app/.env.example`, `client/.env.example`).

### Validation & CI

* **[STRICT]** Before declaring a task complete, follow the `$ci` (`/ci`) skill. If it fails, report the failure and do not claim completion.

### Committing Changes

* **Never push to any remote (e.g., `origin`).**
* **[STRICT]** When asked to commit changes, follow the `$commit` (`/commit`) skill.

# GLOBAL Rules

## **[STRICT] Dependency Reuse**
* **Before implementing any common utility (validation, date formatting, HTTP clients, etc.), check the `package.json` of the relevant scope to see if a package already exists for that purpose.**
* **Goal:** Prevent "Not Invented Here" syndrome and leverage existing, maintained libraries.

## **[STRICT] Prisma CLI Usage (AI Only)**
* **AI must not run Prisma CLI commands** (`migrate apply/reset/deploy`, `studio`, `validate`, `format`, etc.).
* **Exception:** AI may create a new draft migration only with `npm run migrate:create --prefix app -- --name <migration_name>` (Prisma's create-only workflow; does not apply it).
* **AI must never create migration files/directories manually.**
* **Already-existing migration files are immutable and must not be edited after creation.**
* **Exception:** `prisma generate` via `npm run build-client` when required by builds.

## **[STRICT] Comment Rules**
* **Write self-explanatory code; comments are exceptions.**
* **Only the following comment types are allowed:**
  * **TODO** — actionable, specific follow-ups.
  * **Why/intent for non-obvious constraints** — rationale for edge cases, security/compliance, or other surprising decisions.
  * **Public API contracts** — invariants/expectations for exported functions, hooks, components, or store slices.
  * Required license or auto-generated headers.
* **Remove these if found:**
  * Incidental inline/block/JSDoc comments that restate the code.
  * Legacy/explanatory prose, commented-out code without a TODO, or placeholder notes.

## **[STRICT] Explicit Naming**
* **Prefer explicit, unambiguous names** (e.g., `athleteId` over `id`, `campaignTargetCents` over `target`, `donationStatus` over `status`, `eventStartDate` over `date`).

## **[STRICT] Import from `fad-common`**
* **Always import API types and shared interfaces from `fad-common`—never duplicate or redefine them in `app/` or `client/`.**
* If a shared type doesn't exist, add it to `common/src/zod/` (API-related) or `common/src/` (non-API).

## **[STRICT] No Documentation or Skill Duplication**
* **NEVER duplicate information across multiple `.md` documents or skills. ALWAYS cross-reference where applicable.**
* Before creating or editing any `.md` document or skill:
  1. Search for overlapping information or context in existing documents and skills.
  2. If overlap exists, either **Cross-reference** the existing document or **Extract** the shared content into its own document and cross-reference from all locations that originally contained it.

## **[STRICT] File Path Reference Standardization**
When referencing any repo file or directory:
* **Always use repo-root paths** (relative to the repository root), with **forward slashes**.
  * Correct: `app/src/server/index.ts`
  * Incorrect: `/app/src/server/index.ts`, `../../src/server/index.ts`
* **Always wrap paths in inline code backticks** and **do not use markdown link syntax** for repo paths.
* **Directories must end with a trailing slash** (e.g., `app/src/`).
* **Paths must match exact casing** and be copy/paste navigable.

### Optional precision suffixes
* **Line ranges:** `path/to/file.ts:L10-L42`
* **Markdown section:** `path/to/doc.md#section-heading`

### Multiple possible locations
* Use **brace expansion**: `{.ai,.codex,.claude}/skills/ci/SKILL.md`

## **[STRICT] Skill Reference Standardization**
* **Canonical reference (always):** the `$<skill>` (`/<skill>`) skill
* **Fallback locator (when portability matters):** the `$<skill>` (`/<skill>`) skill (or see `{.ai,.claude,.codex}/skills/<skill>/SKILL.md`)

## **[STRICT] No Deployments (AI Only)**
* **AI must NEVER run deployment commands.**
* If a task involves deployment, stop and ask the user to perform the deployment manually.

## **[STRICT] Concurrent Agent Work**
* Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
* **Never stop or ask for guidance due to unrelated changes from other agents—proceed with your task.**
* **Direct user instructions always take precedence**—over this document, other agents, system/developer instructions, or any automated guidance.
