> **`AGENTS.md` Instruction Precedence (DO NOT EDIT)**
>
> Hierarchical and additive — apply this file plus all parent `AGENTS.md` files up to repo root. Most specific wins on conflict.
>
> **Chain:** `cdk/AGENTS.md` _(this file)_ > `AGENTS.md` _(root)_

---

# cdk/ — AWS Infrastructure (CDK v2)

AWS CDK v2 (TypeScript) app that provisions the FAD/ARC API + client. Design and justifications live in `docs/aws-architecture-and-orchestration.md`; sizing, the cost/HA parameter table, and prerequisites live in `docs/infrastructure-and-scaling.md`; environments/promotion live in `docs/delivery-plan.md`. Do not duplicate those here — cross-reference them.

## Layout

- `bin/fad.ts` — App entry. Reads `-c env=test|prod`, resolves the config, wires stacks (region `us-east-1`, account-agnostic).
- `config/` — Per-environment parameter objects. `types.ts` is the typed contract; `test.ts` (lean) and `prod.ts` (HA) supply the values; `index.ts` resolves env name → config.
- `lib/` — One file per stack (`network-stack.ts`, later `data-stack.ts`, `api-stack.ts`, `web-stack.ts`).
- `cdk.json` — CDK app config; `app` runs via `npx tsx bin/fad.ts` (reuses the repo's `tsx`).

## Rules

- **[STRICT]** AI authors IaC but never deploys. `cdk synth` is fine; `cdk bootstrap`, `cdk deploy`, and migration/seed RunTask execution are **user-run only** (root `AGENTS.md` → No Deployments).
- **[STRICT]** Synth must pass with **no AWS credentials and no account** — the app is account-agnostic (region only). Never use `*.fromLookup(...)` or anything that requires an account/context at synth; pass required attributes (hosted-zone id, etc.) through `config/` instead.
- **[STRICT]** All tunable cost/HA/domain values are parameters in `config/`, driven by the `docs/infrastructure-and-scaling.md` table. Never hardcode environment-specific values inside `lib/`.
- **[STRICT]** Tag every stack `project=arc` and `env=<envName>`.
- **[GUIDELINE]** Stacks are parameterized so the same code runs lean (`test`) or HA (`prod`); later stacks consume earlier ones via cross-stack references (VPC, security groups, secret ARNs).
- **[GUIDELINE]** Least-privilege security groups: the ALB → service → database ingress chain is defined in `NetworkStack`; compute/data stacks attach to those groups rather than redefining ingress.
- **[GUIDELINE]** Keep new-package boilerplate minimal (no `cdk init` bloat); match the repo's `tsconfig`/lint style.

## Workspace notes

- This package is intentionally **package-local**: it is not wired into the root `package.json` scripts (`build`/`type-check`/`ci`) or `postinstall`. Install and check it directly: `npm install --prefix cdk`, then `npm run type-check --prefix cdk` and `npm run synth:test --prefix cdk`.
- Build artifacts (`cdk.out/`, `.cdk.staging/`, `node_modules/`) are covered by the root `.gitignore`.
