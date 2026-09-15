# Data migration prompt — AWS RDS → Railway Postgres

**Run this BEFORE `TEARDOWN-PROMPT.md`.** The AWS database holds real production
data that was never ported during the infrastructure cutover.

---

Migrate the production data from the AWS RDS database into Railway Postgres for
the Athlete Arc project. Context lives in
`.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/` — read
`MIGRATION-STATE.md` first.

## Why this exists

The infra cutover on 2026-09-15 moved `athletearc.ca` to Cloudflare + Railway but
**seeded the new database from `app/prisma/seed.ts` instead of porting data**.
The task plan recorded "the user has explicitly accepted data loss"; on
inspection that loss turned out to be real users, so the decision was reversed.

**Live symptom:** `athletearc.ca` is currently serving 6 fictional seed athletes
(maya-okafor, emma-chen, jordan-blackhorse, priya-shah, felix-tremblay,
naomi-osei) while 12 real published athletes are missing from the site. Fixing
this is the point of the task.

## Verified state (measured 2026-09-15)

**AWS RDS `arc` — 32 MB, PostgreSQL 16.13**

| Table | Rows |
|---|---|
| users | 23 (14 verified) |
| athlete_profiles | 19 — **12 published** |
| email_verification_tokens | 33 |
| personal_bests | 27 |
| teams / team_memberships | 23 / 23 |
| platform_role_assignments | 21 |
| athlete_media | 17 |
| athlete_race_results | 14 |
| athlete_accomplishments | 7 |
| follows | 5 |
| athlete_events | 4 |
| password_reset_tokens | 1 |
| **donations, campaigns, payouts, brands** | **0 — nothing financial** |

Real signups run 2026-08-16 → 2026-09-14 across gmail/hotmail/outlook/ualberta.ca/
telus.net/skiuphill.ca/natefit.ca.

**Railway Postgres — PostgreSQL 17**: 6 seed fixtures plus two profiles created
after cutover, `joel-goullet` and `donny-marchuk`.

**Both databases share identical `_prisma_migrations`** — the same four
migrations ending at `20260816162025_add_signup_allowlist`. No schema drift, so
this is a data-only problem.

**Photos are base64 `data:` URIs stored in the database**, not S3/CloudFront, so
images travel with the dump and nothing breaks when CloudFront is destroyed.

## Required outcome (user decision, 2026-09-15)

Restore the AWS production data over Railway, **and preserve the two
post-cutover profiles** `joel-goullet` and `donny-marchuk`. The six fictional
seed athletes should NOT survive — they must not be live production content.

Final state: 23 real users + 2 post-cutover profiles, zero seed fixtures.

## Connection details

**AWS RDS** is in a private VPC (`PubliclyAccessible: false`). Reach it with an
SSM port-forward through the running prod ECS task:

```bash
CLUSTER=Arc-prod-Api-ClusterEB0386A7-lqPlRNSfDP42
TASK=$(aws ecs list-tasks --cluster $CLUSTER \
  --service-name Arc-prod-Api-Service9571FDD8-ijc9IXtJWmGz \
  --desired-status RUNNING --query 'taskArns[0]' --output text)
TASK_ID=$(basename $TASK)
RUNTIME_ID=$(aws ecs describe-tasks --cluster $CLUSTER --tasks "$TASK" \
  --query 'tasks[0].containers[0].runtimeId' --output text)

aws ssm start-session \
  --target "ecs:${CLUSTER}_${TASK_ID}_${RUNTIME_ID}" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters '{"host":["arc-prod-data-databaseb269d8bb-zdkemzlft9cr.cmv4iku0aovh.us-east-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["5433"]}'
```

> **Trap:** the SSM target needs the container's **runtimeId**, not its name. The
> archived `scripts/port-forward-prod-rds.sh` (in git at `f59bb4a`) uses the
> container name and fails with `Invalid target ID format`.

Credentials: `aws secretsmanager get-secret-value --secret-id arc/prod/rds/master`
(JSON, `.password`). Connect as `psql -h localhost -p 5433 -U arc_admin -d arc`.

**Railway Postgres** has no public endpoint by default. Create a temporary TCP
proxy via the Railway GraphQL API (`tcpProxyCreate`, `applicationPort: 5432`,
serviceId `d7d5010c-673f-468a-9246-7c358aa89bca`, environmentId
`00b9dfb1-d622-43cf-9610-0bc3bf2cc3b6`), read `DATABASE_PUBLIC_URL` from that
service's variables, and **delete the proxy immediately when done** — it exposes
Postgres to the internet while it exists. Railway auth uses the
`Project-Access-Token` header, not `Authorization: Bearer`.

## Procedure

1. **Back up both sides first, outside the repo** (e.g.
   `~/arc-migration-backup-2026-09-13/`): a `pg_dump` of AWS prod and a
   `pg_dump` of Railway's current state. The Railway dump is the rollback if the
   restore goes wrong. Do not proceed until both files exist and are non-trivial
   in size.
2. **Extract the two post-cutover profiles from Railway** before overwriting.
   Capture every related row, not just `users` + `athlete_profiles`:
   `athlete_media`, `personal_bests`, `athlete_race_results`,
   `athlete_accomplishments`, `athlete_events`, `teams`, `team_memberships`,
   `platform_role_assignments`, `follows`. Verify the extraction is complete
   before destroying anything.
3. **Restore the AWS dump into Railway**, replacing current contents.
4. **Re-insert the two preserved profiles.** Watch for primary-key or slug
   collisions with restored AWS rows.
5. **Verify** — see below.
6. **Delete the Railway TCP proxy** and close the SSM tunnel.

## Constraints

- **The site is live.** Keep the write window short and do it during low traffic.
  Check `railway logs` for real user activity before starting.
- **Never run `prisma db seed` against Railway again.** That is what put the
  fictional athletes into production.
- Local `pg_dump` is 18.6, source is PG 16.13, target is PG 17 — a newer
  `pg_dump` reading an older server is fine, but use `pg_dump`/`pg_restore` from
  the 18.x install consistently.
- `_prisma_migrations` is identical on both sides; do not let a restore leave it
  inconsistent or Prisma will try to re-apply migrations on the next deploy.
- Secret values must never be written into the repo, a task doc, or a commit.

## Verification (all must pass)

```bash
curl -s "https://athletearc.ca/v1/athletes?limit=50"   # expect the 12 real published athletes
./scripts/smoke-test.sh https://athletearc.ca          # expect 13/13
./scripts/route-sweep.sh https://athletearc.ca         # expect 39/39
```

- No seed slugs (`maya-okafor`, `emma-chen`, `jordan-blackhorse`, `priya-shah`,
  `felix-tremblay`, `naomi-osei`) appear in the directory.
- `joel-goullet` and `donny-marchuk` are still present.
- Real athletes resolve individually, e.g. `/athletes/liam-mcvarnock` and
  `/athletes/nathaniel-ernst` return 200 with their content.
- A known real user can still sign in (password hashes port unchanged), and
  `/v1/users/me` returns the expected `emailVerifiedAt`.

## When done

Update `MIGRATION-STATE.md` (correct the "accepted data loss" note — it was
reversed), record row counts before/after, commit via the `$commit` skill, and
tell the user explicitly that `TEARDOWN-PROMPT.md` is now safe to run.
