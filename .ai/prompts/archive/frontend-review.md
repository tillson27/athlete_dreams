Review `client/AGENTS.md` as the **canonical source of frontend rules and principles**.

Treat **every rule, section, and rule type** (`[STRICT]` and `[GUIDELINE]`) in `client/AGENTS.md` as **in-scope**; do **not** limit review only to the categories listed below.

Scan the entire `client/` (frontend) directory for **violations, inconsistencies, and improvement opportunities** relative to those rules.

Focus especially on:

* Feature-first organization and folder ownership
* Next.js 16 App Router conventions
* State boundaries (TanStack Query vs Zustand vs local state)
* Tailwind CSS v4 usage and design token consistency
* Logging, API helpers, and side-effect management
* Dead code, duplication, and unnecessary abstractions
* Separation of concerns and long-term scalability

After identifying issues, **refactor and improve the code** to fully align with `client/AGENTS.md`.

Make changes deliberately, avoid over-engineering, and do not introduce tests or new tooling.
