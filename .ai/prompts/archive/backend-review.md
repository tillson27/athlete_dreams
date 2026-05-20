Review `app/AGENTS.md` as the **canonical source of backend rules, conventions, and architecture principles**.

Treat **every rule, section, and rule type** (`[STRICT]` and `[GUIDELINE]`) in `app/AGENTS.md` as **in-scope**; do **not** limit review only to the categories listed below.

Scan the entire `app/` (server) directory for **violations, inconsistencies, and improvement opportunities** relative to those rules.

Focus especially on:

* API feature layout and folder structure under `src/api/<feature>`
* Correct separation of concerns (router → validator → controller → service (etc.) → repository → assembler)
* Transport vs domain boundaries (HTTP, auth, errors, DTOs)
* Prisma usage, repositories, and transaction boundaries
* State, side effects, and idempotency
* Error shaping, logging, and observability practices
* DRY violations, dead code, and duplicated logic
* Performance risks (especially **N+1 queries** and unbounded fan-out)
* Naming, typing, and contract alignment with `common/openapi.yaml`

After identifying issues, **refactor and improve the code** to fully align with `app/AGENTS.md`.

Make changes deliberately, avoid over-engineering, and do not introduce tests or new tooling.
