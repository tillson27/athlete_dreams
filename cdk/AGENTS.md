> **`AGENTS.md` Instruction Precedence (DO NOT EDIT)**
>
> Hierarchical and additive — apply this file plus all parent `AGENTS.md` files up to repo root. Most specific wins on conflict.
>
> **Chain:** `cdk/AGENTS.md` _(this file)_ > `AGENTS.md` _(root)_

---

# cdk/ — AWS Infrastructure

AWS CDK v2 TypeScript package for the FAD hosting baseline.

## Rules

- **[STRICT]** Never run deployment or destructive infrastructure commands (`cdk deploy`, `cdk destroy`, bootstrap, or equivalent). Synthesis and type-checking are allowed.
- **[STRICT]** Store credentials and application secrets in AWS Secrets Manager or encrypted AWS-managed facilities. Do not hardcode secrets in source, Dockerfiles, task-definition plain environment, or examples.
- **[STRICT]** Keep RDS private. Do not add public database access for local convenience.
- **[GUIDELINE]** Canada Central (`ca-central-1`) is the default application region. If custom CloudFront certificates are added later, create those certificates in `us-east-1`.
- **[GUIDELINE]** Validate CDK changes with type-check, build, and synth. Do not add CDK unit tests unless a later task explicitly asks for an infrastructure test suite.
