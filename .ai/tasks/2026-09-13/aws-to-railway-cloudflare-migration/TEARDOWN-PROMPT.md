# AWS teardown prompt

> **✅ PREREQUISITE CLEARED — `DATA-MIGRATION-PROMPT.md` completed and verified
> 2026-09-15.** The AWS data now lives in Railway Postgres: 25 users, 21 athlete
> profiles, 14 published. `athletearc.ca` serves the real athletes and no seed
> fixtures. The AWS database is no longer the only copy.

Paste this into a fresh session once `athletearc.ca` has been stable on
Cloudflare + Railway for ~24h. Everything needed is in the prompt or the docs
it points at.

> **Soak requirement satisfied.** Cutover completed ~2026-09-15 02:20 UTC. A full
> pre-teardown audit on 2026-09-16 22:08 UTC — 43.7h later — passed every gate
> below, with zero AWS drift. `scott-duncan` published to Railway in that window,
> confirming real user writes land on the new stack.

---

Execute Step 8 (AWS production teardown + retained-resource sweep) of
`.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/`.

Read `MIGRATION-STATE.md` in that folder first — it is the live state of record
and supersedes anything stale in the steps docs.

**Go/no-go gate — run these BEFORE destroying anything, and stop if any fail:**
- `aws sts get-caller-identity` → must succeed. This session's credentials expire
  and the whole teardown is AWS CLI calls; confirm before starting, not halfway.
- `curl -s "https://athletearc.ca/v1/athletes?limit=50"` → must list **at least
  14** athletes including `liam-mcvarnock` and `nathaniel-ernst`, and **zero**
  seed slugs (`maya-okafor`, `emma-chen`, `jordan-blackhorse`, `priya-shah`,
  `felix-tremblay`, `naomi-osei`). Seed data showing = the database was
  re-seeded = **stop.**

  > Assert a floor, never an exact count. Real athletes publish continuously —
  > 14 immediately after the migration, 15 by 2026-09-16 (`scott-duncan`). An
  > equality check on this number will abort a teardown that should proceed.
- `./scripts/route-sweep.sh https://athletearc.ca` → expect 39/39
- `./scripts/smoke-test.sh https://athletearc.ca` → expect 13/13
- Confirm the API is Railway, not AWS:
  `curl -s -o /dev/null -w '%{http_code}' https://athletearc.ca/v1/athletes/joel-goullet`
  → must be **200**. `joel-goullet` and `donny-marchuk` were created after the
  cutover and have never existed in the AWS database (verified by grep against
  `~/arc-migration-backup-2026-09-13/aws-prod-arc.sql`: zero hits). A 404 means
  traffic is hitting AWS — **do not tear down.**
- `dig +short NS athletearc.ca @1.1.1.1` → must be `*.ns.cloudflare.com`
- **AWS drift check — the one that actually protects the data.** Confirm nothing
  has been written to AWS RDS since the migration dump; any newer row is lost at
  teardown. Open the tunnel (recipe and the `runtimeId` trap are in
  `DATA-MIGRATION-PROMPT.md`), then compare against the captured baseline:

  ```bash
  psql -Atc "select tablename||'='||(xpath('/row/cnt/text()', query_to_xml(
    format('select count(*) as cnt from %I.%I', schemaname, tablename),
    false, true, '')))[1]::text
    from pg_tables where schemaname='public' order by tablename;" \
    | diff -u ~/arc-migration-backup-2026-09-13/aws-prod-rowcounts-before.txt -
  ```

  Empty diff = clean. Also check `max("createdAt")` on `users` and
  `athlete_profiles`: both were `2026-09-14 20:22`–`20:23` UTC, i.e. before the
  cutover. Anything newer means live traffic is still reaching AWS — **stop.**

  > Verified clean twice: 2026-09-15 16:19 UTC and 2026-09-16 22:08 UTC, both
  > byte-identical to the dump.

  **Close the tunnel afterwards.** Killing the `aws ssm start-session` process
  leaves the `session-manager-plugin` child alive holding port 5433 open to prod
  RDS. `pkill -f session-manager-plugin`, then confirm the port is closed.

> **Do not use `tillson27+arcverify@gmail.com` as the Railway-vs-AWS proof.**
> That account lived only in Railway's pre-migration state and was deliberately
> dropped by the 2026-09-15 restore. Signing in as it now fails, which would
> look like an AWS-traffic failure and abort a teardown that should proceed.

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

Inventory confirmed live 2026-09-16 — the sweep list above matches AWS exactly:
2 ECR repos (`arc-prod-api`, `cdk-hnb659fds-container-assets-*`), 2 S3 buckets
(`arc-prod-web`, `cdk-hnb659fds-assets-*`), 5 `arc/prod/*` secrets, 7
`/arc/prod/*` SSM parameters, 1 shared OIDC provider.

> **Before deleting `arc/prod/resend/api-key`, confirm email actually works.**
> `RESEND_API_KEY` is boot-gated, so the API running proves the value is present
> and format-valid — but nothing proves Resend *accepts* it, and email delivery
> has not been verified since the cutover. Sign up on the live site and confirm
> the verification email arrives. Not a blocker: Secrets Manager keeps a 30-day
> recovery window, and Railway and the Resend dashboard both hold copies.

**Data safety nets, both verified — do not re-derive:**
- `Arc-prod-Data` carries `DeletionPolicy: Snapshot` on the DB instance
  (confirmed against the live template), so a **final snapshot is taken
  automatically** on delete.
- Automated snapshots are destroyed with the instance. After teardown the only
  AWS-side copy is that final snapshot; the local dumps in
  `~/arc-migration-backup-2026-09-13/` are the other copy. Both `.dump` files
  were validated with `pg_restore --list` (29 `TABLE DATA` entries each).

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

Cost baseline measured 2026-09-15 (month-to-date, for comparison afterwards):
RDS $24.52, EC2-Other/NAT $15.60, ELB $15.10, VPC $10.07, CloudWatch $7.52,
Secrets Manager $1.31, Route 53 $0.50, tax $4.81 — roughly a **$160/mo** run
rate. Everything but Route 53's $0.50 should disappear.
