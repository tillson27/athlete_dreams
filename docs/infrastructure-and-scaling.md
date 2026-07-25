# Infrastructure & Scaling

AWS hosting design for the FAD/ARC API + client, the cost/reliability tradeoffs at the current scale, and how the architecture must evolve as the business grows. Companion to `docs/backend-build-sheet.md` (the Infra & Deploy track lists the CDK files) and `docs/architecture.md` (application layout).

**Current assumption:** 1,000–10,000 registered users. That is *small* — peak concurrency is realistically tens of requests/sec. The strategy is to **right-size aggressively** (no EKS, no Aurora cluster, no oversized instances) and expose HA/cost knobs as CDK parameters so we start lean and dial up without refactoring.

## Target architecture

| Concern | Service | Sizing |
|---|---|---|
| API compute | **ECS Fargate + ALB** | 2 tasks × 0.25 vCPU / 0.5 GB, Graviton (arm64), CPU-target autoscale, 2 AZs |
| Database | **RDS for PostgreSQL** | `db.t4g.small` (Graviton), gp3, private subnets, automated backups + PITR |
| Client | **S3 + CloudFront (OAC)** | static export today; SSR/ISR later (Amplify or OpenNext) |
| Front door / TLS | **CloudFront + ACM + Route 53** | one domain; `/v1/*` + `/v1/webhooks/stripe` → ALB origin |
| Secrets / config | **Secrets Manager** (DB, Stripe, JWT) + **SSM Parameter Store** (non-secret) | injected into task def by CDK |
| Email | **Resend now; SES optional later** | verification and password reset now; team invites/receipts later |
| Registry / logs | **ECR + CloudWatch** | arm64 image; pino → CloudWatch, capped retention |

Why containers over Lambda: the API uses the **argon2** native binary and must reach **Stripe** with a raw-body webhook and persistent DB connections. A small always-warm Fargate service avoids Lambda cold-starts, the Prisma-on-Lambda connection-storm (which would force RDS Proxy), and native-binary packaging. **App Runner** is a valid lower-ops swap (removes the ALB and the NAT dependency); we chose Fargate for ALB-level control (WAF, path routing) and the first-class CDK construct (`ApplicationLoadBalancedFargateService`).

## Prerequisites & access

Provisioning is **your** step: per the repo's STRICT rules I author all IaC and pipelines but never run `cdk bootstrap`, `cdk deploy`, or migration applies. None of the app code (Phases 0–4) or CDK authoring needs AWS access — it's a gate only at deploy time.

- **Region:** `us-east-1` (also required for the CloudFront ACM certificate).
- **Custom domain (optional per environment):** **`athletearc.ca`** (hardcoded across the client — sitemap, metadata, profile links) is the target domain, but DNS currently lives at GoDaddy with no AWS configuration, so the **test environment defaults to temporary-URL mode** — the CloudFront default domain (`https://<id>.cloudfront.net`), no Route 53 zone or ACM cert needed, single-origin `/v1/*` routing intact. Enabling the custom domain later (Route 53 zone + NS delegation from GoDaddy, then restore the `domain` block in `cdk/config/`) is documented in `cdk/README.md` → §1a. When enabled: one domain fronts everything — apex/`www` → CloudFront (client); `/v1/*` and `/v1/webhooks/stripe` → ALB; test on `test.athletearc.ca`; **ACM certs in `us-east-1`**. The stable host also benefits auth cookies and the (later) Stripe webhook.

**AWS access needed at deploy time**

| Item | What / why |
|---|---|
| AWS account | Dedicated account or Organizations sub-account (isolation + billing) |
| Bootstrap identity | Elevated identity to run `cdk bootstrap aws://<account>/us-east-1` once (creates the CDK toolkit: assets bucket, ECR, roles) |
| Deploy creds — local | SSO / `aws configure` profile with access to VPC, RDS, ECS/ECR/ELB, CloudFront, S3, ACM, Route 53, Secrets Manager/SSM, IAM, EventBridge, Logs |
| Deploy creds — CI | GitHub **OIDC** role (no static keys) — authored in CDK: IAM OIDC provider + scoped deploy role assumed by Actions |
| DNS | None in temporary-URL mode; Route 53 hosted zone only when enabling the custom domain (`cdk/README.md` → §1a) |

**Deferred to later work (not needed now)**

| Item | Gates | Note |
|---|---|---|
| **Stripe access** — platform account, secret key, Connect webhook secret, SSM URL/config parameters | Phase 2 direct-donation money loop **going live** | Runtime AWS names and the `/v1/webhooks/stripe` endpoint are in `cdk/README.md` → §1c. Build and test against Stripe **test mode** / mocks now; real credentials + Connect app registration are later work. Phases 0, 1, 3 and all infra are unaffected. |
| **Production sender/domain** — verify the live sender in Resend (or migrate to SES later) | Real athlete email delivery | Local/API implementation works with env-provided Resend credentials; production sender verification remains an operational gate. |

**Not blocked now:** authoring and local dev of Phases 0–4 and the `cdk/` app need zero AWS or Stripe access (a local Postgres covers the DB). AWS access gates only `bootstrap → deploy → migrate deploy`; Stripe and transactional-email sender verification gate only their own phases going live.

## CDK cost/HA parameters

The stacks (see `docs/backend-build-sheet.md` → Infra & Deploy) are parameterized so the same code runs lean or HA:

| Parameter | Lean (Stage 0) | HA (Stage 1+) |
|---|---|---|
| `multiAz` (RDS) | `false` | `true` |
| `instanceSize` (RDS) | `t4g.small` | `t4g.medium`+ |
| `natStrategy` | `instance` (or single `gateway`) | HA `gateway` (2 AZ) |
| `desiredCount` (Fargate) | `2` | `2–4` + autoscale |
| `useSpot` | mix Spot + 1 on-demand | on-demand baseline + Spot burst |
| `priceClass` (CloudFront) | `PriceClass_100` | `PriceClass_100`/`All` |

## Cost levers (approximate, us-east-1, low traffic)

Baseline HA config is ~$130–160/mo, dominated by **RDS Multi-AZ (~$55)**, **NAT Gateway (~$33)**, **ALB (~$18)**.

**Free / no-regret (do regardless):**
- **Graviton (arm64)** Fargate + RDS `t4g` — ~20% off compute.
- **CloudFront `PriceClass_100`** (NA+EU edges) — users are US/CA, latency unaffected.
- **Free S3 gateway VPC endpoint** — trims NAT data for ECR layer pulls.
- **CloudWatch log retention** (14–30 days) + prod log level.
- **SSM Parameter Store** for non-secret config (free) vs Secrets Manager ($0.40/secret/mo).

**Early-stage structural cuts (real tradeoffs):**
- **RDS single-AZ** to start — saves ~$28/mo; failover becomes restore-from-backup (minutes–hours RTO) instead of ~60–120s. One-toggle flip later.
- **NAT instance** (t4g.nano / fck-nat) instead of NAT Gateway — saves ~$29/mo; you patch it and it's a SPOF unless ASG'd. Note: the API calls **Stripe** (external), so pure VPC endpoints cannot replace NAT egress.
- **Fargate Spot** for extra tasks — ~70% off those tasks; 2-min reclaim notices, fine for a stateless API.
- **Prod-only** (defer staging) — ~halves infra.

> ⚠️ At this scale a single NAT Gateway is usually **cheaper** than a full set of interface VPC endpoints (~$7.30/mo each per AZ). Only the S3 gateway endpoint is a free win — don't reflexively swap NAT for endpoints.

**Commitment-based (once steady):**
- **RDS + Fargate Reserved Instances / Compute Savings Plan** — ~30–40% (1-yr), ~50%+ (3-yr), no reliability cost.
- **AWS Activate credits** — startups can get $1k–$100k; can zero out infra for a year+. Pursue before optimizing pennies.

**Lean "not-fragile" target:** single-AZ RDS `t4g.small`, one NAT, Fargate min-2 Graviton, `PriceClass_100`, Parameter Store, capped logs → **~$70–90/mo** while keeping API redundancy + DB backups.

## Free tier, credits & a near-free dev footing

**The free tier does not cover this design.** It targets burstable single-instance / serverless-request learning workloads; our always-on managed/HA services have no free allowance. New AWS accounts (since mid-2025) use a credits-based plan (~$100–200 over 6 months) rather than the classic 12-month tier — neither covers the structural pieces.

| Component | Free tier | Note |
|---|---|---|
| Fargate | ❌ none | ~$18/mo (2 small tasks) |
| NAT Gateway | ❌ none | ~$33/mo — still required for Stripe/email-provider egress |
| RDS | ⚠️ `t4g.micro` single-AZ, 750h + 20 GB (12mo) only | our `t4g.small` Multi-AZ is not covered |
| ALB | ⚠️ ~750h/mo, first 12mo (legacy accounts) | paid after |
| S3 · CloudFront · ACM · SSM Parameter Store · ECR · CloudWatch basics | ✅ mostly | client hosting, config, certs ≈ free |
| Route 53 · Secrets Manager | ❌ | $0.50/zone; $0.40/secret (prefer Parameter Store) |

**Bottom line:** Fargate + NAT + the Multi-AZ/`t4g.small` RDS upgrade are unavoidable — roughly **$50–70/mo survives** the free tier. There is no $0 path for the HA container design. The real early-stage lever is **AWS Activate credits** (see *Cost levers → Commitment-based*), which cover months of the lean config; and **local dev is $0** until you deploy.

### Near-free dev / demo footing (non-production)

For a shared hosted environment at ~a few $/mo — explicitly **not** the production design:

| Layer | Dev footing | vs. production target |
|---|---|---|
| Compute | single **`t4g.micro` EC2** (750h free/12mo) running the API container in a **public** subnet | Fargate + ALB, 2 AZ |
| Egress | the instance's own public IP — **no NAT** | NAT gateway/instance |
| Database | **`t4g.micro` single-AZ** RDS (free/12mo) | `t4g.small`, Multi-AZ toggle |
| Client | S3 + CloudFront (free-ish) | same |
| Secrets | SSM Parameter Store (free) | Secrets Manager |

**Tradeoffs:** no HA, manual/scripted deploys (no zero-downtime rolling updates), micro burst limits, more ops, a single point of failure. Good for a demo or internal preview; **graduate to the Fargate design (this doc's target) for launch.** It would be a separate minimal stack (or a single-instance Elastic Beanstalk / `docker run` on the box), not the main CDK app.

## Scaling stages

Each stage lists the **trigger** and the **changes**. The database is the scaling bottleneck long before compute — plan read/write splitting and caching before scaling servers.

### Stage 0 — Pre-launch / <10k users (lean)
- Config: single-AZ RDS `t4g.small`, single NAT, Fargate min-2 Graviton, `PriceClass_100`, prod-only. ~$70–90/mo.
- **Accepted risk:** DB failover = restore-from-backup; NAT is a SPOF.

### Stage 1 — Launch / 10k–50k users, real donation revenue (HA)
- **Trigger:** real money flowing; downtime now costs revenue/trust.
- Flip `multiAz=true`; HA NAT (2 AZ) or add interface endpoints; Fargate autoscale min 2–3.
- Add **WAF** on CloudFront/ALB (bot/rate protection — complements the app-level auth rate limiting).
- Buy **RDS + compute Reserved/Savings Plans**.
- Add a **staging** environment.
- Add **RDS Proxy** only if connection counts climb.

### Stage 2 — Growth / 50k–500k users (read-scaling + caching)
- **Trigger:** directory/profile read load and DB CPU rising; SEO matters for discovery.
- Add **RDS read replica(s)**; route directory/profile/feed reads to the replica.
- **CloudFront-cache public GETs** (directory, profiles, active feed) with short TTLs + invalidation on write.
- Add **ElastiCache (Redis)** for hot reads and a shared **rate-limit / refresh-session store**.
- Move the client to **SSR/ISR** (OpenNext or Amplify Hosting) for athlete-profile SEO.
- Introduce dashboards + tracing (**CloudWatch + X-Ray**).

### Stage 3 — Scale / 500k–1M+ users (decouple + partition)
- **Trigger:** write contention and single-writer limits.
- Move to **Aurora PostgreSQL** (or Aurora Serverless v2) with read replicas + fast failover; pool via **RDS Proxy / PgBouncer**.
- **Decouple post-donation side-effects** (receipts, campaign-aggregate updates, notifications) onto **SQS/EventBridge** workers — keeps the webhook path fast and idempotent.
- Address the **hot-row counter** on popular campaigns (`raisedAmountCents`/`supporterCount`): sharded counters or async aggregation instead of a synchronous row increment.
- Partition high-volume tables (`donations`) by time.
- Savings Plans / Graviton everywhere; consider multi-region read + CDN for latency.

## Reliability tradeoffs summary

| Lean choice | Risk introduced | Flip to mitigate | When |
|---|---|---|---|
| Single-AZ RDS | Restore-from-backup RTO (min–hrs) | `multiAz=true` | Stage 1 (revenue) |
| Single NAT / NAT instance | Egress SPOF | HA NAT (2 AZ) | Stage 1 |
| Fargate Spot tasks | Task reclaim blips | on-demand baseline | Stage 1 |
| Prod-only | No safe pre-prod test | add staging | Stage 1 |
| Sync campaign counter | Write contention on hot campaigns | async/sharded counters | Stage 3 |

## Payments & compliance notes

- **PCI scope is minimized by design:** card data never touches our servers — Stripe Elements/Checkout collects it; we store only `paymentProviderRef` and status. This is both a compliance and a reliability win and should be preserved.
- **Webhook correctness over uptime:** the money loop's integrity depends on idempotent webhook processing (`WebhookEvent` dedupe + unique `paymentProviderRef` + `$transaction`), not on request latency. Stripe retries failed webhook deliveries, so brief API blips are tolerable.
- **PII:** user emails and donor details are encrypted at rest (RDS default) and in transit (TLS via ACM). Backups/PITR cover recovery. Revisit data-retention and export/delete flows before scaling marketing.
