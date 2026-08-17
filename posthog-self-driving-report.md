# PostHog Self-driving Setup Report

**Project:** FAD (Fund an Athlete's Dream) — `fad-client` + `fad-app`
**Date:** 2026-08-17
**Inbox:** https://us.posthog.com/project/519881/inbox

## Summary

PostHog Self-driving was configured for the FAD athlete crowdfunding platform. Error tracking (already instrumented server-side), session replay, support/conversations, and health-check signal sources were all enabled, and a five-scout troop was tuned to watch the product's most active surfaces: general cross-product patterns, revenue analytics, product analytics, health checks, and observability gaps. Two Replay Vision scanners were armed on the athlete donation flow. Findings will start appearing in the inbox at https://us.posthog.com/project/519881/inbox within ~30 minutes.

---

## AI Data Processing

**Status:** Approved — organization-level AI data processing consent was granted before this run started.

---

## GitHub

**Status:** Connected during this run (integration ID: 227944, account: tillson27).

Self-driving can now research findings in the codebase and propose fixes. The GitHub App was granted access during setup — ensure the `athlete_dreams` repository is included in the App's authorized repositories.

---

## Products Enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Enabled (server-side flip) | Inert until `posthog-js` is added to the Next.js client — no `posthog-js` dependency found in `client/package.json`. See Follow-ups. |
| Error Tracking | Already instrumented | `enableExceptionAutocapture: true` in `app/src/services/infrastructure/PostHogService.ts`. Server flip confirmed active. |
| Support (Conversations) | Enabled (server-side flip) | Idle until an inbound channel (email / inbox / Slack) is connected in PostHog. See Follow-ups. |

> **Note:** `products-enable` was not available via MCP on this deploy. The server flip was not verified via API. If any product is not showing as active in PostHog settings, enable it manually: Session Replay → Settings → "Record user sessions"; Error Tracking → Settings → "Enable exception autocapture"; Support → product sidebar.

---

## Signal Sources

| Source Product | Source Type | Action | Notes |
|---|---|---|---|
| `health_checks` | `health_issue` | **Enabled** (id: `01a010fe-3bb2-7b30-8f89-18cd173531a6`) | Always on — instrumentation issues are always actionable. |
| `error_tracking` | `issue_created` | **Enabled** (id: `01a010fe-4106-76fc-995b-8c255ad7b882`) | Error tracking already instrumented in `app/`. |
| `error_tracking` | `issue_reopened` | **Enabled** (id: `01a010fe-43ce-7231-9be1-9689f4ee4d7c`) | |
| `error_tracking` | `issue_spiking` | **Enabled** (id: `01a010fe-49f2-720c-8f97-02023f786f33`) | |
| `session_replay` | `session_analysis_cluster` | **Enabled** (id: `01a010fe-4bc9-7e52-94b1-457626e53180`, sample rate: 0.1) | Idle until recordings exist (posthog-js needed on client). |
| `conversations` | `ticket` | **Enabled** (id: `01a010fe-501e-76bf-aa3f-116ab78301eb`) | Idle until an inbound channel is connected. |
| `signals_scout` | `cross_source_issue` | **On by default** | No config row needed — scout findings reach the inbox automatically. |
| `replay_vision` | — | **Skipped** | Replay Vision scanners are self-authorizing via `emits_signals` — no source row needed. |
| `llm_analytics` | — | **Skipped** | No LLM/AI usage found in this codebase. |
| `logs` | — | **Skipped** | Not a v1 responder. |

---

## Connected Tools

| Tool | Status |
|---|---|
| All external tools (GitHub Issues, Linear, Jira, Sentry, Zendesk, etc.) | **Not used** — user selected "None of these" in setup. |

No connected-tool signal sources were created.

---

## Scout Troop

**Daily budget:** 100 runs/day (max 3/tick) — early access default. 0 runs used today.
**Banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

### Enabled (5 scouts)

| Scout | Reason enabled |
|---|---|
| `signals-scout-general` | Always on — cross-product correlations, uncovered surfaces. Was already enabled. |
| `signals-scout-revenue-analytics` | Stripe SDK (`stripe` v22.3.2) installed; `donation_succeeded`, `donation_failed`, `stripe_onboarding_started` events captured to PostHog. |
| `signals-scout-product-analytics` | Dense event instrumentation: full auth, athlete, campaign, donation, and follow funnels captured server-side. Watches saved funnel/retention flows for conversion regressions. |
| `signals-scout-health-checks` | Fresh PostHog setup — instrumentation health monitoring is immediately valuable. |
| `signals-scout-observability-gaps` | Events are captured but the project has no saved insights or dashboards yet — this scout will find uncovered surfaces. |

### Disabled (22 scouts)

| Scout | Reason disabled |
|---|---|
| `signals-scout-error-tracking` | Covered by native `error_tracking` source (enabled above). |
| `signals-scout-session-replay` | Covered by native `session_replay` source (enabled above). |
| `signals-scout-feature-flags` | No feature flag usage found. Enable in PostHog if you add flags. |
| `signals-scout-surveys` | No surveys in use. Enable if you add PostHog surveys. |
| `signals-scout-experiments` | No A/B experiments configured. Enable when experiments start. |
| `signals-scout-web-analytics` | No `posthog-js` on the client — no web analytics data. Enable after adding the client-side SDK. |
| `signals-scout-web-vitals` | No `posthog-js` — no Core Web Vitals data. |
| `signals-scout-ai-observability` | No LLM/AI SDK or `$ai_*` events found. |
| `signals-scout-logs` | PostHog logs product not in use. |
| `signals-scout-csp-violations` | No CSP reporting configured. |
| `signals-scout-customer-analytics` | B2C platform — no group/account analytics in use. |
| `signals-scout-data-pipelines` | No CDP destinations, batch exports, or hog flows. |
| `signals-scout-replay-vision` | No prior Replay Vision observations to trend across yet (scanners just created). Enable after observations accumulate. |
| `signals-scout-anomaly-detection` | No saved dashboards/insights yet — nothing to detect anomalies in. |
| `signals-scout-inbox-validation` | Fresh setup — no resolved reports to validate. Enable after Self-driving has been running for a while. |
| `signals-scout-conversations` | No `$conversation_*` events yet (conversations product just enabled). |
| `signals-scout-data-warehouse` | No external warehouse sources connected. |
| `signals-scout-apm` | No distributed tracing / OpenTelemetry configured. |
| `signals-scout-insight-alerts` | No insight alerts configured. |
| `signals-scout-tasks` | Not a priority for this setup. |
| `signals-scout-mcp-tool-calls` | Not relevant to this project. |
| `signals-scout-skills-store` | Not relevant to this project. |

---

## Custom Scouts

Two custom scouts were proposed based on a gap analysis of the project's event taxonomy against the built-in troop:

| Proposed Scout | What it would watch | Filter that ruled it out |
|---|---|---|
| Athlete onboarding funnel | Drop-offs across `user_signed_up` → `athlete_profile_created` → `campaign_created` → `campaign_status_changed` | Declined by user |
| Donation conversion health | `donation_failed / donation_initiated` ratio vs 7-day baseline | Declined by user |

**Surfaces considered and ruled out:**
- **Stripe onboarding drop-off** — `stripe_onboarding_started` exists but no completion event is instrumented; not scout-ready.
- **Admin approval pipeline** — can't distinguish a slow admin from no pending profiles; discriminator too weak.

**Result:** No custom scouts created. Built-in troop kept as-is.

**Noise escape hatch:** If any built-in scout turns out noisy after it runs, set `emit: false` on its config in PostHog to switch it to dry-run (it continues running and logging but writes nothing to the inbox).

---

## Replay Vision Scanners

Replay Vision scanners are LLMs that watch individual session recordings on a schedule and push what they find directly to the Self-driving inbox. Findings arrive at half weight — a single finding can't reach the inbox alone; it needs corroboration from a second observation before it's promoted into a report. This is the only part of this setup that spends Replay Vision quota (15 credits per observation, $0.01/credit).

**No session recordings exist yet** (no `posthog-js` on the client). Both scanners are armed and will begin scanning the day recordings start — no second setup required.

| Scanner | Status | Query scope | Sampling rate | Estimated monthly credits |
|---|---|---|---|---|
| **Broken experiences** | Created (id: `01a0110a-d35a-7413-b04e-7311694d157d`) | Sessions visiting `/athletes/` (athlete profile pages — where donation discovery and conversion happen) | 0.5 | 0 (no recordings yet) |
| **User frustration** | Created (id: `01a0110a-ef07-7233-b770-1ded87d311b4`) | Sessions with `$rageclick` events (any page) | 1.0 | 0 (no recordings yet) |

**Why `/athletes/` for scanner 1:** The athlete profile page (`/athletes/[athleteSlug]`) is the key conversion surface — it's where supporters discover athletes and initiate donations. A broken experience there turns lost rendering into lost revenue, making it the highest-value flow to monitor. Scanner 2 is gated on `$rageclick` rather than URLs, keeping queries disjoint (no session is matched by both filters).

**Org quota:** 2,500 credits remaining for this billing period (ends 2026-08-18). Both scanners project 0 credits until recordings exist.

> **Note:** The `creating-replay-vision-scanners` skill was not available on this deploy, so spend was estimated directly with `vision-scanners-estimate-create`. The skeletons were created at conservative defaults (scoped query, `sampling_rate ≤ 1`).

---

## Follow-ups

- [ ] **Add `posthog-js` to the Next.js client** — Session Replay and web analytics won't capture any data until `posthog-js` is installed and initialized in `client/`. Once added, session recordings will start flowing to the two Replay Vision scanners automatically.
- [ ] **Enable Session Replay in PostHog settings** — Go to Settings → Session replay → "Record user sessions" to confirm the product is switched on (the `products-enable` MCP tool was unavailable so the flip couldn't be verified via API).
- [ ] **Connect a Support inbound channel** — Go to PostHog → Support → connect an email, inbox, or Slack channel. Until then, the `conversations/ticket` signal source is enabled but idle.
- [ ] **Confirm GitHub App repository access** — Ensure the PostHog GitHub App has access to the `athlete_dreams` repository so Self-driving can research findings and propose code fixes.
- [ ] **Instrument a Stripe onboarding completion event** — `stripe_onboarding_started` is captured but there is no completion event. Adding `stripe_onboarding_completed` (or equivalent) would unlock a full Stripe onboarding funnel and enable the donation-health custom scout.
- [ ] **Add custom scouts (optional)** — Two custom scouts were proposed but declined: an athlete onboarding funnel scout and a donation conversion health scout. They can be created later from the PostHog inbox or by re-running this setup.
- [ ] **Enable `signals-scout-web-analytics` and `signals-scout-web-vitals`** — Once `posthog-js` is on the client and web traffic is being recorded, enable these two scouts from the PostHog inbox.

---

## What Happens Next

- The scout coordinator picks up the fresh configs within **~30 minutes** — the first scans fire shortly after.
- Each enabled scout runs once a day (1,440-minute interval) and draws from the 100-run daily budget.
- Findings cluster into reports in the inbox at https://us.posthog.com/project/519881/inbox.
- Immediately-actionable reports (bugs, regressions, gaps) can start coding tasks — Self-driving can open a draft PR for any finding it can fix.
