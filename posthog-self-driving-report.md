# PostHog Self-driving Setup Report

**Project:** FAD (Fund an Athlete's Dream) — `fad-client` + `fad-app`
**Date:** 2026-08-23 (updated; first run: 2026-08-17)
**Inbox:** https://us.posthog.com/project/519881/inbox

## Summary

PostHog Self-driving is configured for the FAD athlete crowdfunding platform. Error tracking (server-side via `posthog-node`), session replay, support/conversations, and health-check signal sources are all enabled. A five-scout troop watches the product's most active surfaces: general cross-product patterns, revenue analytics, product analytics, health checks, and observability gaps. Two Replay Vision scanners are armed on the athlete donation flow and now carry product-specific prompts. Findings will start appearing in the inbox at https://us.posthog.com/project/519881/inbox within ~30 minutes.

---

## AI Data Processing

**Status:** Approved — organization-level AI data processing consent was granted before this run started.

---

## GitHub

**Status:** Already connected (integration ID: 227944, account: tillson27, connected 2026-08-17).

Self-driving can research findings in the codebase and propose fixes. Ensure the `athlete_dreams` repository is included in the GitHub App's authorized repositories.

---

## Products Enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Already enabled (server-side) | Inert until `posthog-js` is added to the Next.js client — no `posthog-js` dependency found in `client/package.json`. See Follow-ups. |
| Error Tracking | Enabled this run | `enableExceptionAutocapture: true` already set in `app/src/services/infrastructure/PostHogService.ts`. Active error tracking issues confirmed (posthog-node). |
| Support (Conversations) | Enabled this run | Idle until an inbound channel (email / inbox / Slack) is connected in PostHog. See Follow-ups. |

The `posthog.init` override check was not applicable — this project uses `posthog-node` on the backend only; there is no `posthog-js` client-side init to audit. Session Replay and Conversations are server-side enabled but inert for browser capture until `posthog-js` is added to the client.

---

## Signal Sources

All six native signal sources were already enabled from the prior setup run (2026-08-17). No new rows were created.

| Source Product | Source Type | Action | Config ID |
|---|---|---|---|
| `signals_scout` | `cross_source_issue` | **On by default** | No row needed — scout findings reach the inbox automatically. |
| `health_checks` | `health_issue` | Already enabled | `01a010fe-3bb2-7b30-8f89-18cd173531a6` |
| `error_tracking` | `issue_created` | Already enabled | `01a010fe-4106-76fc-995b-8c255ad7b882` |
| `error_tracking` | `issue_reopened` | Already enabled | `01a010fe-43ce-7231-9be1-9689f4ee4d7c` |
| `error_tracking` | `issue_spiking` | Already enabled | `01a010fe-49f2-720c-8f97-02023f786f33` |
| `session_replay` | `session_analysis_cluster` | Already enabled | `01a010fe-4bc9-7e52-94b1-457626e53180` |
| `conversations` | `ticket` | Already enabled | `01a010fe-501e-76bf-aa3f-116ab78301eb` |
| `replay_vision` | — | Skipped | Replay Vision scanners are self-authorizing via `emits_signals` — no source row needed. |
| `llm_analytics` | — | Skipped | No LLM/AI usage found in this codebase. |
| `logs` | — | Skipped | Not a v1 responder. |

---

## Connected Tools

| Tool | Status |
|---|---|
| All external tools (GitHub Issues, Linear, Jira, Sentry, Zendesk, etc.) | Not used — user selected "None of these" in setup. |

No connected-tool signal sources were created.

---

## Scout Troop

**Daily budget:** 100 runs/day (max 3/tick) — early access default. 5 runs used today, 95 remaining.
**Banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

### Enabled (5 scouts)

| Scout | Reason enabled |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations, uncovered surfaces. |
| `signals-scout-revenue-analytics` | Stripe SDK (`stripe` v22.3.2) installed; `donation_succeeded`, `donation_failed`, `stripe_onboarding_started` events captured to PostHog. Watches for Stripe sync stalls and revenue goal misses. |
| `signals-scout-product-analytics` | Dense event instrumentation: full auth, athlete, campaign, donation, and follow funnels captured server-side. Watches saved funnel/retention flows for conversion regressions. |
| `signals-scout-health-checks` | PostHog setup health monitoring — instrumentation issues are immediately actionable for a project using posthog-node. |
| `signals-scout-observability-gaps` | Events are captured but no saved insights or dashboards exist yet — this scout will surface uncovered surfaces. |

### Disabled (22 scouts)

| Scout | Reason disabled |
|---|---|
| `signals-scout-error-tracking` | Covered by native `error_tracking` source — not a re-enable follow-up. |
| `signals-scout-session-replay` | Covered by native `session_replay` source — not a re-enable follow-up. |
| `signals-scout-feature-flags` | No feature flag usage found. Enable in PostHog if you add flags. |
| `signals-scout-surveys` | No surveys in use. Enable if you add PostHog surveys. |
| `signals-scout-experiments` | No A/B experiments configured. Enable when experiments start. |
| `signals-scout-web-analytics` | No `posthog-js` on the client — no web analytics data. Enable after adding the client-side SDK. |
| `signals-scout-web-vitals` | No `posthog-js` — no Core Web Vitals data. Enable after adding the client-side SDK. |
| `signals-scout-ai-observability` | No LLM/AI SDK or `$ai_*` events found. |
| `signals-scout-logs` | PostHog logs product not in use. |
| `signals-scout-csp-violations` | No CSP reporting configured. |
| `signals-scout-customer-analytics` | B2C platform — no group/account analytics in use. |
| `signals-scout-data-pipelines` | No CDP destinations, batch exports, or hog flows. |
| `signals-scout-replay-vision` | Scanners were just updated — no historical observations to trend across yet. Enable after observations accumulate. |
| `signals-scout-anomaly-detection` | No saved dashboards/insights yet — nothing to detect anomalies in. Enable after the team builds out PostHog insights. |
| `signals-scout-inbox-validation` | Fresh setup — no resolved reports to validate yet. Enable after Self-driving has been running for a while. |
| `signals-scout-conversations` | No `$conversation_*` events yet — conversations product just enabled this run. |
| `signals-scout-data-warehouse` | No external warehouse sources connected. |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry configured. |
| `signals-scout-insight-alerts` | No insight alerts configured. |
| `signals-scout-tasks` | Not a priority for this setup. |
| `signals-scout-mcp-tool-calls` | Not relevant to this project. |
| `signals-scout-skills-store` | Not relevant to this project. |

---

## Custom Scouts

Two custom scouts were proposed based on a gap analysis of the project's instrumented event taxonomy against the enabled troop:

| Proposed Scout | Surface | What it would watch | Outcome |
|---|---|---|---|
| Athlete onboarding funnel | `user_signed_up` → `athlete_profile_created` → `campaign_created` | Drop-off across the athlete supply funnel — a widening gap means athletes aren't reaching the fundraising stage | Declined by user |
| Donation conversion health | `donation_initiated` → `donation_succeeded` / `donation_failed` ratio | Payment failure rate above 7-day baseline — catches Stripe config issues before donors notice | Declined by user |

**Surfaces considered and ruled out during gap analysis:**

| Surface | Filter that killed it |
|---|---|
| Stripe athlete onboarding completion | `stripe_onboarding_started` exists but no completion event instrumented — discriminator too weak |
| Admin approval pipeline backlog | Can't distinguish a slow admin from no pending profiles; not scout-ready |
| Campaign funding velocity | Campaign goal data is in the database, not in PostHog event properties — not queryable by a scout |

**Result:** No custom scouts created. Built-in troop kept as-is.

**Noise escape hatch:** If any built-in scout turns out noisy after it runs, set `emit: false` on its config in PostHog to switch it to dry-run — it keeps running and logging but writes nothing to the inbox.

---

## Replay Vision Scanners

Replay Vision scanners are LLMs that watch individual session recordings on a schedule and push what they find to the Self-driving inbox. Findings arrive at half weight — a single scanner finding cannot reach the inbox alone; it needs corroboration from a second observation before it is promoted into a report. This is the only part of this setup that spends Replay Vision quota (15 credits per observation at $0.01/credit).

**No session recordings exist yet** (no `posthog-js` on the client). Both scanners are armed and will begin scanning the day recordings start — no second setup required.

Both scanners were created in the prior setup run (2026-08-17) and **updated to v2 this run** with product-specific prompts and new names (upgraded from the legacy generic names "Broken experiences" and "User frustration").

| Scanner | Status | Query scope | Sampling rate | Est. monthly credits |
|---|---|---|---|---|
| **Athlete profile and donation flow breakage** | Updated to v2, enabled, `emits_signals: true` (id: `01a0110a-d35a-7413-b04e-7311694d157d`) | Sessions visiting `/athletes/` — the athlete profile pages where donation discovery and conversion happen | 0.5 | 0 (no recordings yet) |
| **Donor and athlete frustration** | Updated to v2, enabled, `emits_signals: true` (id: `01a0110a-ef07-7233-b770-1ded87d311b4`) | Sessions with `$rageclick` events (all pages) | 1.0 | 0 (no recordings yet) |

**Breakage scanner watches for:** donation widget not loading or appearing blank, Donate button failing to open the payment flow, campaign funding progress or goal amount not displaying, donation amount form rejecting input, athlete profile content failing to render, Stripe redirect returning an error.

**Frustration scanner watches for:** hammering the Donate button that isn't responding, donation amount form refusing input, hunting for the campaign goal without finding it, retrying registration forms after silent validation errors, follow/share buttons not responding, struggling to start a campaign as a newly registered athlete.

**Why `/athletes/` for the breakage scanner:** the athlete profile page is the key conversion surface — it's where supporters discover athletes and initiate donations. A broken experience there directly blocks revenue. The frustration scanner is gated on `$rageclick` only (no URL), keeping the two queries disjoint so sessions are never analyzed twice for overlapping questions.

**Org quota:** 2,500 credits remaining for this billing period (ends 2026-09-17). Both scanners project 0 credits until recordings exist.

---

## Follow-ups

- [ ] **Add `posthog-js` to the Next.js client** — Session Replay, web analytics, and the Replay Vision scanners won't capture any data until `posthog-js` is installed in `client/`. Once added: recordings flow to the scanners, the session replay source activates, and the `signals-scout-web-analytics` / `signals-scout-web-vitals` scouts become worth enabling.
- [ ] **Connect a Support inbound channel** — Go to PostHog → Support → connect an email, inbox, or Slack channel. Until then, the `conversations/ticket` signal source is enabled but idle.
- [ ] **Confirm GitHub App repository access** — Verify the PostHog GitHub App (account: tillson27) has access to the `athlete_dreams` repository so Self-driving can research findings and propose code fixes.
- [ ] **Instrument a Stripe onboarding completion event** — `stripe_onboarding_started` is captured but there is no completion event. Adding `stripe_onboarding_completed` would enable the athlete-to-fundraiser funnel custom scout and complete the Stripe onboarding funnel.
- [ ] **Enable `signals-scout-web-analytics` and `signals-scout-web-vitals`** — Once `posthog-js` is on the client and web traffic is being captured, enable these two scouts from the PostHog inbox settings.
- [ ] **Enable `signals-scout-replay-vision`** — Once Replay Vision observations accumulate (after `posthog-js` is added), this scout watches observation trends across sessions and surfaces recurring themes.
- [ ] **Consider custom scouts (optional)** — Two scouts were proposed but declined: an athlete onboarding funnel scout and a donation conversion health scout. Both can be added later from the PostHog inbox or by re-running this setup.

---

## What Happens Next

- The scout coordinator picks up fresh configs within **~30 minutes** — the first scans fire shortly after.
- Each enabled scout runs once a day (1,440-minute interval) and draws from the 100-run daily budget.
- Findings cluster into reports in the inbox at https://us.posthog.com/project/519881/inbox.
- Immediately-actionable reports (bugs, regressions, gaps) can kick off coding tasks — Self-driving can open a draft PR for any finding it can fix.
