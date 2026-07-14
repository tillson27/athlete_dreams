# ARC Infrastructure — Test Deployment Runbook

The complete, **user-executed** path from an empty AWS account to a smoke-tested
`test.athletearc.ca`. AI authors this IaC and the pipelines but never runs
`cdk bootstrap`, `cdk deploy`, migrations, or any AWS command (repo root
`AGENTS.md` -> *No Deployments*). Every command below is yours to run.

- **Design & justifications:** `docs/aws-architecture-and-orchestration.md`
- **Sizing, cost/HA parameters, prerequisites:** `docs/infrastructure-and-scaling.md`
- **Branching, environments, milestones, rollback overview:** `docs/delivery-plan.md`
- **Stack layout & CDK conventions:** `cdk/AGENTS.md`

Region is `us-east-1` everywhere (also required for the CloudFront ACM cert). The
CDK app is account-agnostic: the account resolves from your deploy credentials.

---

## 1. Prerequisites

See `docs/infrastructure-and-scaling.md` -> *Prerequisites & access* for the full
list (AWS account, deploy identity, Route 53 hosted zone, deferred Stripe/SES).
Not repeated here. In short, before you start you need:

1. An AWS account and an elevated identity (SSO or `aws configure` profile) able
   to bootstrap and deploy in `us-east-1`.
2. `node` 22+, the repo installed (`npm install` at the root; `npm install --prefix cdk`).

A Route 53 hosted zone is **not** required to bring the test environment up —
see 1a.

### 1a. Domain: temporary URL now, custom domain later

`athletearc.ca` currently lives at GoDaddy with no AWS DNS configuration, so
`cdk/config/test.ts` ships **without** a `domain` block (temporary-URL mode):
WebStack serves the environment on its CloudFront default domain with the
default viewer certificate — no Route 53 zone, ACM cert, or alias records are
created, and nothing at GoDaddy changes. There is **nothing to configure in
this mode.** After the Web deploy, read the URL from the stack's `SiteUrl` /
`DistributionDomainName` outputs (section 3) — that
`https://<id>.cloudfront.net` address is the test environment. The front door
is single-origin, so `/v1/*` API paths are served from the same URL (CORS
allowlist is intentionally empty in this mode).

Two caveats while on the temporary URL: the client's SEO/share metadata
(`metadataBase`, profile share links) still points at `athletearc.ca` —
cosmetic for a test environment — and the URL changes if the distribution is
ever recreated.

**Upgrading to the custom domain later** (either path, then redeploy
`Arc-test-Web`):

- **Path A — delegate DNS to Route 53 (recommended):** create a public hosted
  zone for `athletearc.ca` in Route 53, copy its four NS values into GoDaddy's
  nameserver settings (full DNS moves to Route 53; recreate any existing
  GoDaddy records in the zone first), then restore the `domain` block in
  `cdk/config/test.ts` (shape: `DomainConfig` in `cdk/config/types.ts` —
  `clientDomain: 'test.athletearc.ca'`, zone name `athletearc.ca`) with the
  real **Hosted zone ID**. WebStack then provisions the ACM cert (DNS-validated
  in the zone) and alias records automatically.
- **Path B — keep DNS at GoDaddy:** possible (ACM cert with manual CNAME
  validation + a GoDaddy CNAME `test.athletearc.ca -> <id>.cloudfront.net`),
  but the stack currently only automates Path A; Path B would need a
  cert-only stack variant plus two hand-managed GoDaddy records. Prefer Path A
  unless GoDaddy DNS must stay authoritative.

`cdk/config/prod.ts` keeps its `domain` block (with the placeholder
`hostedZoneId`) for the M7 production bring-up — replace the placeholder before
any prod Web deploy. WebStack imports zones by attributes (never `fromLookup`,
to keep `cdk synth` credential-free), so deploying a configured domain with the
placeholder id fails to create the ACM validation and alias records.

### 1b. Invite gate (signup allowlist)

Sign-up **and** sign-in are gated by `SIGNUP_EMAIL_ALLOWLIST` (exact emails or
`@domain` entries, case-insensitive; empty = open — see `app/.env.example`).
The deployed value comes from `signupEmailAllowlist` in `cdk/config/<env>.ts`,
which for `test` ships with `@seed.athletearc.ca` (seeded demo athletes) and
`@smoke.athletearc.ca` (the smoke suite's throwaway accounts). **Add your own
testers' emails to that list before deploying** (or later — edit and redeploy
`Arc-test-Api`); anyone not on the list receives 403 "Access is currently
invite-only" at both auth endpoints.

---

## 2. One-time bootstrap

Bootstrap the CDK toolkit (assets bucket, ECR, deploy roles) once per account/region:

```bash
cdk bootstrap aws://<account-id>/us-east-1
```

The GitHub deploy role assumes these `cdk-*` bootstrap roles, so this must exist
before the first pipeline deploy.

---

## 3. Deploy order

Deploy from `cdk/` in dependency order. `Cicd` first so the OIDC role exists
before any workflow runs; then the app stacks (`docs/aws-architecture-and-orchestration.md`
-> *Deploy-time orchestration*). `synth` is credential-free; `deploy` needs your
AWS credentials.

```bash
cd cdk

# 1. CI/CD identity — GitHub OIDC provider + deploy role.
npx cdk deploy Arc-test-Cicd    -c env=test --require-approval never

# 2. Network — VPC, subnets, SG chain, NAT, S3 gateway endpoint.
npx cdk deploy Arc-test-Network -c env=test --require-approval never

# 3. Data — RDS PostgreSQL + Secrets Manager master creds.
npx cdk deploy Arc-test-Data    -c env=test --require-approval never

# 4. Api — ECR, Fargate+ALB, migration/seed task defs, alarms.
#    First bring-up: no image exists yet, so the service will not stabilize
#    until deploy-api.yml (or a manual build+push) publishes an image tag.
#    See section 4 for the first-image bootstrap.
npx cdk deploy Arc-test-Api     -c env=test --require-approval never

# 5. Web — S3 (OAC) + CloudFront + ACM + Route 53 records.
npx cdk deploy Arc-test-Web     -c env=test --require-approval never
```

To deploy the whole set at once: `npx cdk deploy --all -c env=test --require-approval never`
(CDK honours the dependency order). For `prod`, swap `-c env=test` for
`-c env=prod` and the `Arc-prod-*` stack names — do not bring up prod until M7.

### Capture the outputs you will need

After the deploys, record these (console, or `aws cloudformation describe-stacks`):

```bash
# GitHub deploy-role ARN (section 5):
aws cloudformation describe-stacks --stack-name Arc-test-Cicd \
  --query "Stacks[0].Outputs[?OutputKey=='GithubDeployRoleArn'].OutputValue" --output text

# Web bucket, CloudFront distribution id, and the site URL (sections 5 and 6 —
# in temporary-URL mode `SiteUrl` IS the environment's address):
aws cloudformation describe-stacks --stack-name Arc-test-Web --query "Stacks[0].Outputs" --output table
```

---

## 4. First image + migrations/seed

The ApiStack references the image by tag. Two ways to publish the first image
and run the pre-traffic tasks:

### Option A — via the pipeline (recommended)

Once section 5 (GitHub environment) is configured, run **deploy-api.yml** with
`workflow_dispatch` and `run_seed: true`. It builds the arm64 image, pushes it to
ECR tagged with the commit SHA, redeploys `Arc-test-Api` pinned to that tag, then
runs the migration RunTask (and the seed RunTask because you set the flag). This
is the normal path; subsequent pushes to `nate` touching `app/**`/`common/**`
redeploy automatically (seed off by default).

### Option B — manual first bring-up

Build and push the image yourself (repo root is the Docker context because
`app/Dockerfile` resolves `fad-common` from `../common`):

```bash
ACCOUNT=<account-id>
REGISTRY="${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com"
TAG="$(git rev-parse HEAD)"

aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin "${REGISTRY}"

docker buildx build --platform linux/arm64 \
  --file app/Dockerfile \
  --tag "${REGISTRY}/arc-test-api:${TAG}" \
  --push .

cd cdk
npx cdk deploy Arc-test-Api -c env=test -c "imageTag=${TAG}" --require-approval never
```

Then run the migration (and, once only, the seed) RunTask. Pull the network
config and task-definition ARNs from the ApiStack outputs:

```bash
STACK=Arc-test-Api
read_out() { aws cloudformation describe-stacks --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text; }

CLUSTER="$(read_out EcsClusterName)"
MIGRATION_TD="$(read_out MigrationTaskDefinitionArn)"
SEED_TD="$(read_out SeedTaskDefinitionArn)"
SG="$(read_out ServiceSecurityGroupId)"
SUBNETS="$(read_out PrivateSubnetIds)"
NETCFG="awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${SG}],assignPublicIp=DISABLED}"

# Migration (pre-traffic; run on every schema change):
aws ecs run-task --cluster "$CLUSTER" --launch-type FARGATE \
  --task-definition "$MIGRATION_TD" --network-configuration "$NETCFG"

# Seed (first bring-up only; idempotent upserts):
aws ecs run-task --cluster "$CLUSTER" --launch-type FARGATE \
  --task-definition "$SEED_TD" --network-configuration "$NETCFG"
```

`.github/scripts/run-ecs-task.sh` is the same launch-and-wait-for-exit-0 logic
the pipeline uses; the workflow always runs the migration task and gates the seed
behind the `run_seed` input. Migrations are **never** run on container boot — only
as this discrete pre-traffic task (`docs/delivery-plan.md`; Context §12).

---

## 5. GitHub environment setup (user-applied)

The workflows use GitHub OIDC — **no static AWS keys**. Configure the `test`
environment once (`docs/delivery-plan.md` -> *GitHub settings*):

1. **Settings -> Environments -> New environment** named `test` (add deployment
   protection/reviewers as desired).
2. **Environment secret** `AWS_DEPLOY_ROLE_ARN` = the `GithubDeployRoleArn`
   output from `Arc-test-Cicd` (section 3). Consumed by `deploy-api.yml` and
   `deploy-web.yml`.
3. **Environment variables** for `deploy-web.yml`:
   - `WEB_BUCKET` = the web bucket name (`arc-test-web`, or the `Arc-test-Web`
     bucket output).
   - `CLOUDFRONT_DISTRIBUTION_ID` = the CloudFront distribution id from the
     `Arc-test-Web` outputs.

The deploy role's trust policy only admits this repo (`tillson27/athlete_dreams`)
on the `nate` and `main` branches (`cdk/lib/cicd-stack.ts`), so no other repo or
branch can assume it. Also enable branch protection and required `ci` checks on
`nate`/`main` per `docs/delivery-plan.md`.

---

## 6. Smoke test

After the migration/seed tasks succeed, verify the deployment. The smoke suite
is curl + jq only and covers health live/ready, the directory (filter + cursor
page), a seeded profile with its rich fields, the community and campaign feeds,
the auth round-trip (sign-up -> sign-in -> `GET /v1/users/me`), and a follow
round-trip. A failed smoke means **no traffic shift**.

```bash
# Temporary-URL mode: use the Arc-test-Web `SiteUrl` output.
scripts/smoke-test.sh "$(aws cloudformation describe-stacks --stack-name Arc-test-Web \
  --query "Stacks[0].Outputs[?OutputKey=='SiteUrl'].OutputValue" --output text)"

# Custom-domain mode (after section 1a's upgrade):
scripts/smoke-test.sh https://test.athletearc.ca
```

The smoke suite's auth round-trip uses a `@smoke.athletearc.ca` address, which
the shipped test allowlist admits (section 1b) — keep that entry or the auth
checks will 403.

It exits non-zero on any failure and prints a PASS/FAIL summary table that
doubles as the post-deploy verification record (Context §13). Point the client
at the API by building it with the test API base URL (single-domain routing means
`/v1/*` is served by the same host).

---

## 7. Rollback

Per `docs/delivery-plan.md` -> *Rollback*:

- **API (bad image / regression):** redeploy the previous image tag —
  `npx cdk deploy Arc-test-Api -c env=test -c imageTag=<previous-sha> --require-approval never`.
  ECR retains prior tags and ECS keeps prior task definitions. A deploy that
  fails ALB health checks is **auto-rolled-back** by the ECS deployment circuit
  breaker (`circuitBreaker: { rollback: true }` in `cdk/lib/api-stack.ts`) to the
  last healthy task definition — no action needed.
- **Database:** the expand/contract migration discipline (`docs/delivery-plan.md`)
  means schema rollbacks are rarely needed; the disaster path is **RDS
  point-in-time recovery** (automated backups are on — `rdsBackupRetentionDays`
  in `cdk/config/`; restore to a new instance and repoint).
- **Client:** re-sync the previous static build to the web bucket and invalidate —
  `aws s3 sync <previous-build>/ s3://arc-test-web --delete` then
  `aws cloudfront create-invalidation --distribution-id <id> --paths '/*'`.
  Re-running `deploy-web.yml` from an earlier commit does the same.

---

## 8. ALB origin hardening (post-deploy user action)

Steps 14/15 left the CloudFront -> ALB origin on plain HTTP with the ALB security
group open to `0.0.0.0/0` on 80/443 (`cdk/lib/network-stack.ts`,
`cdk/lib/web-stack.ts`). Traffic is meant to reach the ALB **only** through
CloudFront. The recommended hardening is to restrict the ALB security group
ingress to CloudFront's origin-facing IP ranges via the AWS-managed prefix list
`com.amazonaws.global.cloudfront.origin-facing`.

**Why this is a manual step, not baked into the stack:** that managed prefix
list's **id is region-specific and is not published as a stable constant**.
Resolving it in CDK requires either `ec2.PrefixList.fromLookup(...)` — which
needs live AWS credentials/account context at synth and is **forbidden** by
`cdk/AGENTS.md` (credential-free synth) — or hardcoding a brittle, undocumented
`pl-*` id. Neither is acceptable in the stack, so the hardening is applied after
deploy, when credentials are present.

Apply it once after the ApiStack is up:

```bash
# 1. Discover the region's CloudFront origin-facing prefix-list id.
PL_ID="$(aws ec2 describe-managed-prefix-lists --region us-east-1 \
  --filters Name=prefix-list-name,Values=com.amazonaws.global.cloudfront.origin-facing \
  --query 'PrefixLists[0].PrefixListId' --output text)"

# 2. Find the ALB security group id (NetworkStack AlbSecurityGroup).
ALB_SG="$(aws ec2 describe-security-groups --region us-east-1 \
  --filters Name=tag:project,Values=arc Name=tag:env,Values=test \
            Name=description,Values='Public ALB — HTTPS/HTTP from the internet.' \
  --query 'SecurityGroups[0].GroupId' --output text)"

# 3. Allow only CloudFront's origin-facing ranges on 80/443, then revoke the
#    open-world rules the stack created.
aws ec2 authorize-security-group-ingress --region us-east-1 --group-id "$ALB_SG" \
  --ip-permissions "IpProtocol=tcp,FromPort=443,ToPort=443,PrefixListIds=[{PrefixListId=$PL_ID}]" \
                   "IpProtocol=tcp,FromPort=80,ToPort=80,PrefixListIds=[{PrefixListId=$PL_ID}]"
aws ec2 revoke-security-group-ingress --region us-east-1 --group-id "$ALB_SG" \
  --ip-permissions "IpProtocol=tcp,FromPort=443,ToPort=443,IpRanges=[{CidrIp=0.0.0.0/0}]" \
                   "IpProtocol=tcp,FromPort=80,ToPort=80,IpRanges=[{CidrIp=0.0.0.0/0}]"
```

A defense-in-depth alternative that **is** fully credential-free and
region-agnostic (a candidate for a future stack change): have CloudFront inject a
secret origin custom header and add an ALB listener rule (or AWS WAF rule) that
403s any request missing it. Full TLS to the ALB (ACM cert + HTTPS origin) also
remains a follow-up per `docs/aws-architecture-and-orchestration.md`.
