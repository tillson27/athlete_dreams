# Stripe Connect Crowdfunding — Steps Guide

**Context doc (source of truth):**
- `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-context.md`

**Steps docs (max 5 steps per doc):**
- `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-1-5.md`
- `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-6-9.md`

**Coordination rule:** Each step is completed by one agent using the `$step-execution` (`/step-execution`) skill.
Do not start a step until all the **Prereqs:** for that step are completed.

> **NOTE:** Another AI agent may be completing an independent step in the same git worktree or branch at the same time. This is expected.
> Ignore unrelated changes from other agents. If their changes affect your work (e.g., new conflicts, shifted patterns, or shared code), adapt as needed to integrate cleanly or fix issues as they arise.

**Dependency rules:**
- Steps with dependencies must explicitly list them in **Prereqs** and appear after their prerequisites in the index.
- Steps with no dependencies use **Prereqs: None**—this is expected and valid. Place them wherever makes logical sense.
- Independent steps (Prereqs: None) can run in parallel if multiple agents are available.

**Standing constraints (every step):**
- **[STRICT] Non-custodial only** — direct charges, `application_fee_amount` omitted, no platform-balance routing / destination charges / transfers / application fees.
- **[STRICT]** Migrations are **drafted** via `npm run migrate:create --prefix app -- --name <name>`; the **user** applies them. AI never deploys. Migration files are immutable once created.
- **[STRICT] Zod-first** — contracts change in `common/src/zod/` → `npm run build --prefix common` → consume from `fad-common`; never redefine request/response types in `app/`/`client/`.
- Money in integer cents; dates ISO-8601 in transport; default currency **CAD**. Stripe **test mode** only.

---

## Step index

| Step | Name | Status | Owner | Doc |
| --- | --- | --- | --- | --- |
| 1 | Contracts, schema, env & migration draft | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-1-5.md` |
| 2 | StripeService infrastructure (stripe-node, Connect + Checkout wrappers) | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-1-5.md` |
| 3 | Repositories: donation, donation-event, webhook-event + athlete/campaign extensions | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-1-5.md` |
| 4 | Athlete Stripe onboarding API (Account Links + status) | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-1-5.md` |
| 5 | Donation creation API (Checkout Session, direct charge) | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-1-5.md` |
| 6 | Stripe Connect webhook processor + raw-body mount | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-6-9.md` |
| 7 | Client: API helpers + athlete "Connect Stripe / payout status" UI | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-6-9.md` |
| 8 | Client: donor donation flow (widget + Checkout redirect + return pages) | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-6-9.md` |
| 9 | Final validation & cleanup (required, always last) | Incomplete | claude | `.ai/tasks/2026-07-19/stripe-connect-crowdfunding/stripe-connect-crowdfunding-steps-6-9.md` |

---

## Dependency graph

- **Step 1** — Prereqs: None (foundation: contracts + schema + env).
- **Step 2** — Prereqs: 1.
- **Step 3** — Prereqs: 1.
- **Step 4** — Prereqs: 2, 3.
- **Step 5** — Prereqs: 2, 3.
- **Step 6** — Prereqs: 2, 3, 5.
- **Step 7** — Prereqs: 4.
- **Step 8** — Prereqs: 5, 6.
- **Step 9** — Prereqs: 1–8 (final validation).

Steps 2 and 3 can run in parallel after 1. Steps 4 and 5 can run in parallel after 2+3. Steps 7 and 8 depend on their respective backend endpoints (4; 5+6).

---

## Steps doc ranges

- Max 5 steps per steps doc.
- Steps are numbered sequentially across docs (1–5 in the first doc, 6–9 in the second).
- The final step (9) is validation and lives in the last steps doc.
