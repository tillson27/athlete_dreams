# Migrate Production Off AWS to Railway + Cloudflare Workers - Steps 6-10

## Step 6 - [USER] Smoke-test the preview stack end-to-end

### Metadata
**Status:** Incomplete
**Prereqs:** 5
**Size:** medium
**Owner:** user
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Prove every user-facing flow works on the preview stack before any DNS change, with particular attention to the Stripe webhook raw body — the highest-risk detail in the migration.

> **[SUPERSEDED 2026-09-13]** The agent now executes this step; see the steps guide. Only 6c's email-link click needs the user, because it requires inbox access.

**Done When:**
- Sign-up, verification email delivery (Resend), and sign-in all succeed.
- An athlete profile publishes with an uploaded image, and the image renders after reload (proving the base64 `data:` URL round-trips through Postgres).
- ~~A Stripe test-mode donation completes and reaches the success URL.~~ **Dropped 2026-09-13** at the user's instruction.
- ~~**A Stripe webhook delivered to the preview URL verifies its signature** and creates the expected `WebhookEvent` / `DonationEvent` rows.~~ **Dropped 2026-09-13.** Raw-body passthrough proven in Step 3 instead; see 6d.
- `scripts/route-sweep.sh` passes against the preview URL (every `staticRoutes` entry, both athlete-slug shapes, `/favicon.ico`, 404 fallback).
- `scripts/smoke-test.sh` passes against the preview URL.
- No 5xx appears in the Railway logs during the run.

**References:**
- Context section 11 (Edge cases) — the raw-body failure mode
- `scripts/smoke-test.sh` — reuse or adapt the existing smoke test rather than writing a new one
- `app/src/api/webhooks/StripeWebhookRouterFactory.ts`

### Plan

**6a. `scripts/smoke-test.sh` already takes a base-URL argument** — verified 2026-09-13, no adaptation needed. It covers `/v1/health/live` and `/ready`, the directory filter + cursor page, the seeded profile's rich fields, the community and campaign feeds, a full sign-up → sign-in → `/v1/users/me` round-trip, and a follow/unfollow round-trip. It needs `jq`.
```bash
scripts/smoke-test.sh https://athlete-arc.<subdomain>.workers.dev
```

**6b. Route coverage sweep** — `scripts/route-sweep.sh` (added 2026-09-13) covers this. It asserts all 24 `staticRoutes` entries plus `/`, both trailing-slash canonicalisations, all four athlete-slug shapes (**asserting 200 and a body match, so a 307 that strips the slug fails the check**), the icon/metadata routes, `/favicon.ico`, the 404 fallback, and `/v1/health/ready` through the proxy.
```bash
scripts/route-sweep.sh https://athlete-arc.<subdomain>.workers.dev
```

**6c. Auth + profile flow**, in a browser against the preview URL: sign up, receive and click the verification email, sign in, publish an athlete profile with a photo, reload and confirm the photo renders (this is what proves the base64 `data:` URL round-trips through Postgres).

> The verification email depends on the `resend._domainkey` TXT record inventoried in Step 7a. It is sent from `info@athletearc.ca` via Resend and is unaffected by the preview URL, but **clicking the link requires inbox access** — the link target is built from `APP_URL`, which points at `https://athletearc.ca` (production), not the preview. Expect to paste the token against the preview host manually, or temporarily set `APP_URL` to the workers.dev URL on the Railway service for this test.

**6d. — REMOVED.** Stripe webhook signature verification. Dropped at the user's instruction on 2026-09-13 (*"You can ignore stripe stuff, that's not working anyways"*).

> **What this costs, recorded deliberately:** the context doc calls this "the single highest-risk detail in the task." The property it tested — that the Worker forwards the request body byte-for-byte — was instead proven in Step 3 against a local echo origin: a 98-byte payload containing non-ASCII (`café — ünïcode ✓`) arrived with an identical SHA-256 and identical byte count, with `Stripe-Signature` intact. That is the same invariant Stripe's signature check would have exercised, so the risk is mitigated, not merely skipped. It is **not** an end-to-end confirmation that Stripe itself accepts the deployed endpoint; that remains unverified until Stripe is working again.

**6e. — REMOVED.** Donation flow through Stripe test mode. Dropped for the same reason.

**6f. Review Railway logs** for the whole session and confirm no 5xx and no `validateProductionConfig` warnings.

### Step checklist
- [ ] Test script authored and handed off
- [ ] User confirms all flows pass, webhook signature verification included
- [ ] Agent reviews the reported results and Railway logs
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 7 - [USER] DNS cutover for `athletearc.ca` with rollback

### Metadata
**Status:** Incomplete
**Prereqs:** 6
**Size:** medium
**Owner:** user
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Point `athletearc.ca` and `www.athletearc.ca` at the Cloudflare Worker, with AWS still running as an immediate rollback target.

> **[SUPERSEDED 2026-09-13]** The agent now executes this step; see the steps guide. The user should still eyeball the imported email records in 7b before nameservers change — that check is judgment, not automation.

**Done When:**
- `https://athletearc.ca` and `https://www.athletearc.ca` serve from the Worker with a valid certificate.
- `https://athletearc.ca/v1/health/ready` returns 200.
- A Stripe webhook delivered to the production URL verifies successfully.
- The full Step 6 smoke test passes against the production domain.
- The AWS stack is still running and could be restored by reverting nameservers.

**References:**
- Route 53 zone `Z09125813QDW7R0WM4HV`, 15 records — inventory before migrating
- Context section 12 (Failure modes) — rollback is nameserver revert

### Plan

**7a. Export the existing Route 53 records** — **DONE 2026-09-13**, saved outside the repo at `~/arc-migration-backup-2026-09-13/route53-athletearc-backup.json` (5123 bytes, 18 record sets):
```bash
aws route53 list-resource-record-sets --hosted-zone-id Z09125813QDW7R0WM4HV \
  --region us-east-1 --output json > route53-athletearc-backup.json
```

**Verified zone inventory.** Seven records are email-critical — losing any one breaks mail with no error surfaced anywhere:

| Record | Type | Value | Breaks if lost |
|---|---|---|---|
| `athletearc.ca` | MX | `1 smtp.google.com` | **All inbound email** (Google Workspace) |
| `athletearc.ca` | TXT | `v=spf1 include:_spf.google.com ~all` | Outbound marked as spam |
| `_dmarc.athletearc.ca` | TXT | `v=DMARC1; p=none; rua=mailto:nathaniel@…` | Deliverability reporting |
| `google._domainkey.athletearc.ca` | TXT | `v=DKIM1; k=rsa; p=MIIBIjANBg…` | Google outbound DKIM auth |
| `resend._domainkey.athletearc.ca` | TXT | `p=MIGfMA0GCSqGSIb3DQ…` | **App verification + password-reset emails** |
| `send.athletearc.ca` | MX | `10 feedback-smtp.us-east-1.amazonses.com` | Resend bounce handling |
| `send.athletearc.ca` | TXT | `v=spf1 include:amazonses.com ~all` | Resend SPF |

Replaced at cutover (these are the only ones that should change): `athletearc.ca` and `www.athletearc.ca` A + AAAA, all four currently ALIAS → `d2z7fyjadq4mtn.cloudfront.net`.

Safe to drop: the two `_*.acm-validations.aws` CNAMEs (`_8c969c1e….athletearc.ca` and `_007eb5d5….www.athletearc.ca`). They validate the CloudFront ACM cert and die with it.

**7b. Add `athletearc.ca` as a Cloudflare zone** and let Cloudflare import the records. **Verify all seven email records from the 7a table came across verbatim** before touching nameservers — compare against the backup JSON, not from memory. The `resend._domainkey` TXT is the one that silently breaks sign-up if mangled, and it is long enough that truncation on import is a real failure mode. Note Cloudflare must import the A/AAAA records as **DNS-only (grey cloud)** or proxy them at the Worker; they currently point at CloudFront and must end up at the Worker custom domain.

**7c. Add the custom domain to the Worker** for both the apex and `www`, and set `API_ORIGIN` to the Railway production URL.

**7d. Lower the TTL on the apex and www records at Route 53 first** if you want a faster rollback window, then update the nameservers at the registrar to Cloudflare's.

**7e. Verify propagation and function:**
```bash
dig +short NS athletearc.ca
curl -i https://athletearc.ca/v1/health/ready
curl -i https://www.athletearc.ca/
```

**7f. Re-run the Step 6 smoke test against `https://athletearc.ca`**, including the Stripe webhook check. The Stripe dashboard needs **no change** — the webhook URL is unchanged by design.

**7g. Rollback, if needed:** revert the nameservers to the Route 53 values. AWS is still serving and will pick the traffic straight back up. Do not proceed to Step 8 until the production domain has been stable for at least a full day.

### Step checklist
- [ ] Runbook authored and handed off
- [ ] User confirms cutover complete and smoke test passes on the production domain
- [ ] Agent verifies DNS and endpoint health read-only
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 8 - [USER] AWS production teardown + retained-resource sweep

### Metadata
**Status:** Incomplete
**Prereqs:** 7
**Size:** medium
**Owner:** user
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Destroy the AWS production stacks and sweep every resource that survives the destroy, so the bill actually reaches zero.

> **[SUPERSEDED 2026-09-13]** The agent now executes this step at the user's explicit instruction (*"aws teardown should happen regardless"*). It remains the point of no return. The agent still sequences the **prod** teardown after the new stack is verified live, so a rollback target exists; the **test** teardown carries no such dependency and was done first.

**Done When:**
- `aws cloudformation describe-stacks` returns no `Arc-prod-*` and no `Arc-test-*` stacks.
- No RDS instance, ALB, NAT gateway, or Fargate task remains.
- All seven Secrets Manager secrets are deleted.
- Both ECR repos and both S3 web buckets are gone.
- The CDK bootstrap resources are removed.
- A cost check a few days later shows near-zero daily spend.

**References:**
- `cdk/lib/api-stack.ts` — ECR repo is `RemovalPolicy.RETAIN`
- `cdk/lib/web-stack.ts` — `arc-prod-web` bucket is RETAIN under the `snapshot` policy
- `cdk/lib/data-stack.ts` — prod RDS has `deletionProtection: true` and takes a final snapshot

### Plan

**8a. Disable RDS deletion protection on prod**, which is `true` because `rdsRemovalPolicy` is `snapshot`:
```bash
aws rds modify-db-instance \
  --db-instance-identifier arc-prod-data-databaseb269d8bb-zdkemzlft9cr \
  --no-deletion-protection --apply-immediately --region us-east-1
```

**8b. Destroy the prod stacks** in dependency order:
```bash
cd cdk
npx cdk destroy Arc-prod-Web Arc-prod-Api Arc-prod-Data Arc-prod-Network -c env=prod
```
Expect 20–30 minutes; the CloudFront distribution must disable before it deletes.

**8c. Destroy the two remaining Cicd stacks.** These come last because GitHub Actions no longer needs AWS after Step 4. `Arc-test-Cicd` owns the shared GitHub OIDC provider, so it must be destroyed **after** `Arc-prod-Cicd`:
```bash
npx cdk destroy Arc-prod-Cicd -c env=prod
npx cdk destroy Arc-test-Cicd -c env=test
```

**8d. Sweep the retained resources:**
```bash
aws ecr delete-repository --repository-name arc-prod-api --force --region us-east-1

aws s3 rb s3://arc-prod-web --force

for s in arc/prod/stripe/secret-key arc/prod/stripe/connect-webhook-secret \
         arc/prod/rds/master arc/prod/api/jwt arc/prod/resend/api-key; do
  aws secretsmanager delete-secret --secret-id "$s" \
    --force-delete-without-recovery --region us-east-1
done

aws ssm delete-parameters --region us-east-1 --names \
  /arc/prod/donations/default-currency /arc/prod/donations/minimum-cents \
  /arc/prod/email/from-address \
  /arc/prod/stripe/account-onboarding-refresh-url \
  /arc/prod/stripe/account-onboarding-return-url \
  /arc/prod/stripe/checkout-cancel-url /arc/prod/stripe/checkout-success-url
```

**8e. Delete the final RDS snapshot** once you are certain the data is not wanted. List first, then delete by id:
```bash
aws rds describe-db-snapshots --snapshot-type manual --region us-east-1 \
  --query 'DBSnapshots[].DBSnapshotIdentifier' --output text
```

**8f. Remove the CDK bootstrap** — the `CDKToolkit` stack, the `cdk-hnb659fds-assets-*` bucket, and the `cdk-hnb659fds-container-assets-*` ECR repo. Empty the bucket before deleting the stack.

**8g. Decide on the Route 53 zone.** Once DNS is fully served by Cloudflare the zone costs $0.50/mo and does nothing. Delete it only after confirming Cloudflare is authoritative and email still flows — keeping it a month as insurance is a reasonable call.

**8h. Verify:**
```bash
aws cloudformation describe-stacks --region us-east-1 --query 'Stacks[].StackName' --output text
aws rds describe-db-instances --region us-east-1 --query 'DBInstances[].DBInstanceIdentifier'
aws elbv2 describe-load-balancers --region us-east-1 --query 'LoadBalancers[].LoadBalancerName'
aws ec2 describe-nat-gateways --region us-east-1 --filter Name=state,Values=available
```

**8i. Check the bill 3–4 days later** and confirm daily spend is near zero.

### Step checklist
- [ ] Runbook authored and handed off
- [ ] User confirms teardown complete
- [ ] Agent verifies the account is clean (read-only checks)
- [ ] Agent verifies daily cost has dropped in a follow-up check
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 9 - Archive `cdk/` and rewrite the infrastructure docs

### Metadata
**Status:** Incomplete
**Prereqs:** 8
**Size:** medium
**Owner:** ai
**Completed At:**
**Completion Notes:**

### Context

**Objective:** Leave the repo describing the architecture that actually exists, with the AWS design archived rather than deleted.

**Done When:**
- `docs/infrastructure-and-scaling.md` describes Railway + Cloudflare, and carries the verified August 2026 AWS cost table as the historical rationale.
- `docs/aws-architecture-and-orchestration.md` and `cdk/README.md` are clearly marked historical/archived at the top.
- `cdk/` carries an `ARCHIVED` note explaining what it was, why it was retired, and that it is retained for a possible future scale-up.
- No active doc instructs a reader to deploy to AWS.
- The root `AGENTS.md` directory-layout section describes `cdk/` as archived.
- `npm run ci` passes.

**References:**
- Context sections 3, 8, 10, and 16
- Root `AGENTS.md` — *No Documentation or Skill Duplication*: cross-reference, do not restate

### Plan
- Rewrite `docs/infrastructure-and-scaling.md` around the new topology, cost model, and scaling triggers. Keep the August 2026 cost table — it is the evidence for the decision and belongs in exactly one place.
- Add archive banners to `docs/aws-architecture-and-orchestration.md` and `cdk/README.md` rather than deleting them; they document decisions that would otherwise have to be rediscovered.
- Cross-reference `docs/deployment-railway-cloudflare.md` (created in Step 2) from `docs/infrastructure-and-scaling.md` instead of duplicating the env var table.
- Update the root `AGENTS.md` directory layout and the `cdk` bullets in the scripts section.
- Carry the *Future work* items from context section 16 into the docs so the R2 image migration is not lost.
- Run `npm run script:agents:sync` so `CLAUDE.md` / `GEMINI.md` mirrors stay in step.

### Step checklist
- [ ] Step-specific tasks complete
- [ ] `$doc-alignment` (`/doc-alignment`) run
- [ ] `$ci` (`/ci`) run
- [ ] Fix any issues caused by `$ci` (`/ci`)
- [ ] Step metadata updated in the steps doc and the steps guide index
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)

---

## Step 10 - Final Validation & Cleanup

### Metadata
**Status:** Incomplete
**Prereqs:** 1, 2, 3, 4, 5, 6, 7, 8, 9
**Owner:** ai
**Completed At:**
**Completion Notes:**

### Final Step Checklist
* [ ] Confirm all prior steps are complete
* [ ] Confirm every success criterion in context section 1 is met, including the post-cutover AWS bill check
* [ ] Confirm no secret value was committed anywhere in the task's commits (`git log -p` review of the touched files)
* [ ] Review and resolve any outstanding TODOs introduced during this task
* [ ] Run the `$e2e-review` (`/e2e-review`) skill with all required context provided
* [ ] Run the `$ci` (`/ci`) skill and confirm it passes
- [ ] Fix any issues caused by `$ci` (`/ci`)
* [ ] Update task metadata in the steps docs and the steps guide index
* [ ] Move `.ai/tasks/2026-09-13/aws-to-railway-cloudflare-migration/` to `.ai/tasks/2026-09-13/completed/aws-to-railway-cloudflare-migration/`
- [ ] Ask user for next action (commit, continue, etc.) (**OVERRIDE:** When executing the step within the `$step-loop` (`/step-loop`) skill, do **NOT** ask the user for next action. **ALWAYS** commit the fully completed step. **GOAL**: One commit per step.)
