Review **both** `app/AGENTS.md` and `client/AGENTS.md` as the **canonical sources of rules, conventions, and architecture principles** for the backend and frontend respectively.

Treat **every rule, section, and rule type** (`[STRICT]` and `[GUIDELINE]`) in **both files** as **fully in-scope**. Do **not** limit the review to only the categories listed below.

Scan the **entire codebase**, including `app/` (server) and `client/` (frontend), for **violations, inconsistencies, and improvement opportunities** relative to those rules.

---

## Core Objective (Highest Priority)

**Verify and validate all end-to-end data flows and interaction sequences** across the system.

This includes, but is not limited to:

* Client → Backend → Client request/response lifecycles
* Multi-step flows spanning multiple endpoints or screens
* Authentication, session, and authorization flows
* Email, passcode, magic link, or verification flows
* Webhooks and background jobs
* Interactions with **any external services** (payments, auth providers, email, AI vendors, etc.)
* Async flows, retries, idempotency, and failure handling
* Contract alignment at every boundary (request shape, response shape, error shape)

For **every meaningful interaction**, ensure that:

* Ownership is clear at each layer
* Responsibilities are not duplicated
* Data transformations are intentional and justified
* State transitions make sense and are observable
* Errors propagate in a controlled, predictable way
* The full sequence is understandable when traced end-to-end

If any flow is confusing, brittle, leaky, or inconsistent, **refactor it** to be clearer, more explicit, and more robust.

---

## Backend Review Focus (`app/`)

In addition to full rule coverage from `app/AGENTS.md`, focus especially on:

* API feature layout and folder structure under `src/api/<feature>`
* Correct separation of concerns
  (router → validator → controller → service → repository → assembler)
* Transport vs domain boundaries (HTTP, auth, errors, DTOs)
* Prisma usage, repositories, and transaction boundaries
* State, side effects, idempotency, and retries
* Error shaping, logging, tracing, and observability
* DRY violations, dead code, and duplicated logic
* Performance risks (especially **N+1 queries** and unbounded fan-out)
* Naming, typing, and strict alignment with `common/openapi.yaml`
* Consistency between API behavior and how the frontend actually consumes it

---

## Frontend Review Focus (`client/`)

In addition to full rule coverage from `client/AGENTS.md`, focus especially on:

* Feature-first organization and clear folder ownership
* Next.js 16 App Router conventions
* State boundaries
  (TanStack Query vs Zustand vs local component state)
* API call patterns and request lifecycle handling
* Loading, error, and empty states for every async interaction
* Tailwind CSS v4 usage and design token consistency
* Logging, side-effect management, and user feedback
* Dead code, duplication, and unnecessary abstractions
* Alignment between UI flows and backend expectations
* Long-term scalability and clarity of user journeys

---

## Execution Requirements

* After identifying issues, **refactor and improve the code** to fully align with **both** `AGENTS.md` files.
* Make changes deliberately and incrementally.
* Prioritize clarity, correctness, and end-to-end coherence over cleverness.
* Avoid over-engineering.
* Do **not** introduce tests, new frameworks, or new tooling.
* Preserve existing architectural intent unless it clearly violates the canonical rules or breaks data-flow integrity.

The end result should be a system where **every interaction makes sense when followed from the user action all the way through the backend and back again**, and where both frontend and backend strictly adhere to their respective `AGENTS.md` contracts.
