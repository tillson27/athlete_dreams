---
name: worktree-task
description: Run a rigorous, isolated task pipeline end-to-end — create a named git worktree off the current working dir, then chain $task-planning → $validate-task (with N parallel sub-agents) → $step-loop-no-commit → a single $commit → $rebase onto the latest local dev tip if dev has moved forward since the worktree was created. Use whenever the user asks for the full validated workflow, a "rigorous" or "thorough" task run, anything phrased as "do this in a worktree with planning + validation", or any plan-then-execute request that should land as one clean commit.
---

# Worktree Task

## Overview

A thin delegator that wraps the rigorous, isolated task pipeline. All real work is done by the wrapped skills — this skill only sequences them and locks in the worktree + heavy-validation + single-final-commit + rebase-onto-dev conventions.

## Inputs

- A task description, objective, or link to a spec — same shape `$task-planning` (`/task-planning`) accepts.
- **`sub_agents`** (optional, integer): number of parallel sub-agents to dispatch in Step 3. **Defaults to `2`** when not specified. Treat any value the user mentions ("with 4 sub-agents", "use 6 agents", "extensively with 4+") as the override.
- **Worktree name** (optional): a preferred name for the worktree. If omitted, derive one from the task slug.

## Workflow

1. Create a **named** git worktree off the current working dir (use whatever native worktree tooling is available; otherwise fall back to `git worktree add <path> -b <branch-name>`). Switch the session into it. All subsequent steps run inside that worktree — never silently fall back to working on the base branch.
2. Run the `$task-planning` (`/task-planning`) skill to produce the context, steps guide, and steps documents.
3. Run the `$validate-task` (`/validate-task`) skill — dispatch **`sub_agents` parallel sub-agents** (default `2`, override with the input above), each scoped to an independent slice of the validation checklist (e.g., codebase / technical accuracy, completeness + logical correctness, external research + best practices, risks + missing details + edge cases). Resolve every issue surfaced before moving on.
4. Run the `$step-loop-no-commit` (`/step-loop-no-commit`) skill to execute the full plan end-to-end without per-step commits.
5. Before committing, run a blocking external provider contract gate for any third-party API touched by the task:
   - Run or verify the `$provider-contract-verification` (`/provider-contract-verification`) skill.
   - Do not run `$commit` (`/commit`) until provider response shapes used by code are proven and encoded in tests or fixtures with exact observed casing.
6. Run the `$commit` (`/commit`) skill exactly once, to land all the work as a single coherent commit.
7. Rebase onto the latest local `dev` tip if `dev` has moved forward since the worktree was created (i.e., the worktree is now behind `dev`):
   - Resolve dev's tip: `DEV_SHA=$(git rev-parse dev)`.
   - If `git merge-base --is-ancestor "$DEV_SHA" HEAD` returns success, dev's tip is already in this branch's history — no rebase needed; skip.
   - Otherwise dev has moved forward: run the `$rebase` (`/rebase`) skill with `$DEV_SHA` as the target SHA (the rebase skill requires a SHA, not a branch name).

## Guardrails

- Treat every wrapped skill as authoritative for its own behavior — do not duplicate or restate their workflows here.
- Step 3's sub-agent count comes from the `sub_agents` input. If the user did not specify, default to **2**. The sub-agents must run in parallel; running them sequentially defeats the purpose.
- Steps 2–7 all run inside the worktree from Step 1.
- Only the Step 6 `$commit` lands a commit during execution. If an earlier step tries to commit, override it the same way `$step-loop-no-commit` overrides `$step-loop`. Step 7 may produce additional commits via `$rebase`'s normal conflict-resolution flow — that is expected.
- Step 7 rebases onto **local `dev`** specifically, not `origin/dev` or `main`. Never push.
- If a wrapped skill fails or surfaces a blocker that needs a user decision, stop and ask — do not skip the failed skill or substitute a lighter-weight one.
