---
name: debug
description: Do a deep-dive diagnosis of a reported bug by walking through all relevant code, logs, configuration, and local infrastructure.
---

# Debug Skill

## Overview

Perform an exhaustive, evidence-based investigation of a reported bug or unexpected behavior. Systematically examine code, logs, and database state to identify root causes and provide actionable findings.

## Scope Modes

The user specifies a scope (defaults to **local** if not specified):

| Scope | What's Available |
|-------|------------------|
| **local** (default) | Codebase, local logs (`app/logs/`), local database via `app/.env` |
| **remote** | Not yet wired — FAD has no deployed environments yet. Skip remote-only steps and note the gap. |

## Guardrails

- Use the `$code-logic-summary` (`/code-logic-summary`) skill when the user only wants a walkthrough (not debugging).
- Use the `$validate-logic` (`/validate-logic`) skill when the user wants correctness validation (not debugging a specific issue).
- Use the `$task-planning` (`/task-planning`) skill if the debug scope is too large to complete in one session.
- **[STRICT] Read-only database access.** Never write, update, or delete data. Only SELECT/read queries are permitted.

## Workflow

### Phase 1: Scope and Context Gathering

1. **Confirm scope.** If the user does not specify, assume **local**.
2. **Capture the bug report.** Document: observed behavior, expected behavior, reproduction steps (if provided), and any error messages or screenshots.

### Phase 2: Code Investigation

1. **Identify entry points.** Find all code paths that could handle the reported behavior (API routes, UI actions, jobs, webhooks).
2. **Trace the flow.** Follow the suspected code path end-to-end, documenting each step.
3. **Check edge cases.** Review error handling, null checks, type conversions, and boundary conditions.
4. **Review recent changes.** Check `git log` and `git diff` for recent commits affecting the relevant code paths.
5. **Cross-reference dependencies.** Verify that external dependencies (packages, services) are used correctly.

### Phase 3: Log Analysis

**[STRICT] Always prioritize the most recent logs.** Start with the latest entries and work backwards.

**Local scope:**
- Read relevant log files from `app/logs/` (sorted by modification time, most recent first).
- Search for error messages, stack traces, and warnings related to the issue.

**Log query tips:**
- **Most recent first:** Always sort by timestamp descending and start with the newest entries.
- Filter by `requestId` to trace a single request across services.
- Filter by `level: "error"` or `level: "warn"` to find issues quickly.
- Look for patterns: repeated errors, sudden spikes, or missing expected logs.

### Phase 4: Database Inspection (if applicable)

- Use `app/.env` for the local database connection.
- Query relevant tables read-only to verify data state.
- Verify foreign key relationships, orphaned records, timestamps, and ordering.

### Phase 5: Synthesis and Root Cause

1. **Correlate findings.** Match code behavior with log evidence and database state.
2. **Identify root cause(s).** Distinguish between symptoms and actual causes.
3. **Assess impact.** Determine scope of the issue (single user, all users, specific conditions).
4. **Propose fix direction.** Provide actionable next steps (code changes, data fixes, configuration updates).

## Evidence Rules (non-negotiable)

- Tie every claim to a concrete file path, log entry, or database query.
- Use repo-root paths in backticks (e.g., `app/src/api/auth/AuthController.ts`).
- Include timestamps for log entries when relevant.
- Mark any unverifiable or configuration-dependent behavior as unknown, but continue the analysis.

## Output Template

```
Bug Report Summary
- Observed: [what's happening]
- Expected: [what should happen]
- Scope: [local]
- Timeframe: [when it started or was reported]

Investigation Trail

1. Code Analysis
2. Log Findings
3. Database State (if inspected)

Root Cause Analysis
Impact Assessment
Recommended Fix
Unknowns / Follow-ups
```

## Quality Checklist

Before concluding:

- [ ] All relevant code paths traced
- [ ] Logs examined for the reported timeframe
- [ ] Database state verified (if applicable to scope)
- [ ] Root cause identified with evidence
- [ ] Fix direction is actionable
- [ ] Unknowns explicitly documented
