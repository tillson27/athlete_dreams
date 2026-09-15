# AWS teardown prompt

> **⛔ PREREQUISITE — `DATA-MIGRATION-PROMPT.md` must be complete and verified
> first.** The AWS database holds 23 real users and 19 athlete profiles that were
> never ported. Destroying `Arc-prod-Data` removes the live source. Do not run
> this until `athletearc.ca` serves the real athletes.

Paste this into a fresh session once `athletearc.ca` has been stable on
Cloudflare + Railway for ~24h. Everything needed is in the prompt or the docs
it points at.

---

Execute Step 8 (AWS production teardown + retained-resource sweep) of
`.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/`.

Read `MIGRATION-STATE.md` in that folder first — it is the live state of record
and supersedes anything stale in the steps docs.

**Go/no-go gate — run these BEFORE destroying anything, and stop if any fail:**
- `curl -s "https://athletearc.ca/v1/athletes?limit=50"` → must list the **real**
  athletes (e.g. `liam-mcvarnock`, `nathaniel-ernst`) and **no** seed slugs
  (`maya-okafor`, `emma-chen`). Seed data still showing = data migration not done
  = **stop.**
- `./scripts/route-sweep.sh https://athletearc.ca` → expect 39/39
- `./scripts/smoke-test.sh https://athletearc.ca` → expect 13/13
- Confirm the API is Railway, not AWS: sign in at
  `https://athletearc.ca/v1/auth/sign-in` as `tillson27+arcverify@gmail.com`
  (password in the migration notes) and confirm `/v1/users/me` returns
  `emailVerifiedAt 2026-09-15T01:50:35Z`. That account exists only in Railway
  Postgres. If it 401s, traffic is still hitting AWS — **do not tear down.**
- `dig +short NS athletearc.ca @1.1.1.1` → must be `*.ns.cloudflare.com`

**This is the point of no return.** Once the stacks are gone, reverting
nameservers no longer restores service. Report the gate results before proceeding.

**Known constraints — do not rediscover these the hard way:**
- **`cdk destroy` is broken on this machine.** It fails with
  `CredentialsProviderError: Could not load credentials from any providers` —
  the CDK Node SDK cannot read this credential source even though the AWS CLI
  can. Use `aws cloudformation delete-stack` + `aws cloudformation wait
  stack-delete-complete` directly.
- Never pipe a destroy through `tee` — the pipeline reports `tee`'s exit code
  and will mask a failure as success. Check the log body and the stack status.
- Prod RDS `arc-prod-data-databaseb269d8bb-zdkemzlft9cr` has **deletion
  protection ON**. Disable it first or `Arc-prod-Data` will not delete.
- `Arc-test-Cicd` owns the GitHub OIDC provider that `Arc-prod-Cicd` also
  references, so it must be destroyed **after** `Arc-prod-Cicd`.
- CloudFront must disable before it deletes; `Arc-prod-Web` can take 20–30 min.

**Order:** `Arc-prod-Web` → `Arc-prod-Api` → `Arc-prod-Data` → `Arc-prod-Network`
→ `Arc-prod-Cicd` → `Arc-test-Cicd`.

**Then sweep what survives the destroy** (per Step 8d–8f): the `arc-prod-api`
ECR repo, the `arc-prod-web` S3 bucket, the five `arc/prod/*` Secrets Manager
secrets, the seven `/arc/prod/*` SSM parameters, and the CDK bootstrap
(`CDKToolkit` stack, `cdk-hnb659fds-assets-*` bucket — empty it first —, and the
`cdk-hnb659fds-container-assets-*` ECR repo).

Already done on 2026-09-14, skip: all four `Arc-test-*` stacks, the
`arc-test-api` ECR repo, and three orphaned test log groups.

**[STRICT] Do NOT delete the Route 53 hosted zone `Z09125813QDW7R0WM4HV`.** It
costs $0.50/mo and is part of the DNS rollback path. Leave it.

Note: its apex/`www` A/AAAA records now point at **Cloudflare's edge IPs**, not
CloudFront, so rollback requires both restoring
`~/arc-migration-backup-2026-09-13/r53-rollback-to-cloudfront.json` and reverting
the registrar nameservers. Deleting `Arc-prod-Web` destroys the CloudFront
distribution that rollback target refers to — which is exactly why the go/no-go
gate above must pass first.

**Finish by:** re-running the verification queries in Step 8h, reporting
month-to-date AWS cost by service via Cost Explorer, updating Step 8 metadata +
the steps guide index + `MIGRATION-STATE.md`, and committing via the `$commit`
skill. Then report what is left running and its expected monthly cost.
