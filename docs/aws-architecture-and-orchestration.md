# AWS Architecture & Orchestration Plan

The AWS system design for the FAD/ARC API + client: **what** each component is, **how** the pieces are orchestrated (build → deploy → run), and the **justification** for every choice with the alternatives considered. This is the design to approve before any CDK is authored.

**Reads with:**
- `docs/infrastructure-and-scaling.md` — sizing summary, **prerequisites & access**, cost levers, scaling stages, reliability/compliance. (Cost numbers and the CDK cost/HA parameters live there — not repeated here.)
- `docs/backend-build-sheet.md` → *Infra & Deploy track* — the concrete `cdk/` file list and the app phases.
- `docs/delivery-plan.md` — branching (`nate` as integration base), environments/promotion, milestones, runbook.
- `docs/architecture.md` — in-app request flow (Controller → Service → Repository).

## Design requirements

- **Scale:** ~1,000–10,000 users — *small*; peak concurrency in the tens of req/sec. Right-size aggressively; no EKS/Aurora-cluster/oversized instances.
- **Low latency** for US/CA users; **reliability** (Multi-AZ-capable, zero-downtime deploys); **reasonable cost** (see cost levers); **AWS via CDK v2**, region `us-east-1`, custom domain.
- **Operability:** I author all IaC/CI; **you** run `cdk bootstrap`/`cdk deploy`/migrations (STRICT: AI never deploys).

---

## Component decisions & justifications

Sizing for each lives in `docs/infrastructure-and-scaling.md` → *Target architecture*. Here is the **why** and the alternatives.

### Compute — **ECS Fargate + ALB**
- **Why:** managed containers (no EC2 patching) that stay **always-warm** — which suits the API's realities: the **argon2** native binary (CPU-bound hashing), a **persistent Prisma connection pool**, and a **raw-body Stripe webhook**. First-class CDK construct (`ApplicationLoadBalancedFargateService`). The ALB gives path routing, health checks, and a place to attach WAF. Multi-AZ with ≥2 tasks.
- **Alternatives:** **App Runner** — lower-ops, removes the ALB + NAT dependency, often cheaper; kept as a documented swap if ALB-level control isn't needed. **Lambda + API Gateway** — cheapest for spiky traffic but cold starts, a Prisma connection storm (forcing RDS Proxy), and argon2 packaging make it a poor fit for a DB-backed always-on API. **EKS** — overkill at this scale. **Elastic Beanstalk** — dated, more ops than Fargate.

### Database — **RDS for PostgreSQL (Graviton `t4g`, Multi-AZ toggle)**
- **Why:** cheapest reliable *managed* Postgres; Prisma-native; burstable `t4g` fits low steady load; Multi-AZ gives ~60–120s automatic failover; automated backups + PITR. Scales later via instance size → read replicas.
- **Alternatives:** **Aurora PostgreSQL** — better scaling/failover but a higher floor; overkill for 10k users (revisit at Stage 3). **Aurora Serverless v2** — 0.5-ACU (~$43/mo) floor makes it pricier for steady small load (good only for spiky). **Self-managed on EC2** — needless ops burden.

### Client hosting — **S3 + CloudFront (OAC), static export**
- **Why:** cheapest, global-CDN low latency, matches the current static export; OAC keeps the bucket private.
- **Alternatives / later:** **Amplify Hosting** or **OpenNext** for Next SSR/ISR — deferred until athlete-profile **SEO** justifies it (a clean swap; the client stays behind the same CloudFront domain).

### Front door / TLS — **CloudFront + ACM + Route 53 (single custom domain)**
- **Why:** one domain fronts everything — default → S3 (client), `/v1/*` and `/v1/webhooks/stripe` → ALB. Kills CORS, gives Stripe a **stable webhook host**, enables edge caching of public GETs later, and ACM certs are free. CloudFront's ACM cert must be in **`us-east-1`** — which is our region anyway.
- **Alternative:** a separate `api.` subdomain straight to the ALB (simpler CloudFront, but reintroduces CORS and a second cert). Single-domain path-routing is cleaner.

### Secrets / config — **Secrets Manager + SSM Parameter Store**
- **Why:** no secrets in env files or images. Secrets Manager for DB creds (native rotation), Stripe keys, `JWT_SECRET`; Parameter Store (free) for non-secret config. CDK injects both into the task definition at launch.

### Networking — **VPC (2 AZ), public + private subnets, one NAT + S3 gateway endpoint**
- **Why:** standard secure topology — ALB and NAT in public subnets; Fargate and RDS in private subnets. A NAT path is **required** (the API egresses to Stripe and transactional email providers, which VPC endpoints can't cover). NAT cost is parameterized (`natStrategy`, see cost doc).

### Email — **Resend now; SES optional later**
- **Why:** account verification and password reset currently use Resend through app env configuration. SES remains the AWS-native option for later invites/receipts if we want email fully inside AWS operations.

### Registry / observability — **ECR + CloudWatch**
- **Why:** arm64 image registry; pino → CloudWatch logs/metrics with capped retention; alarms on error rate / DB / ALB 5xx.

---

## Runtime topology

```
                         Route 53  (custom domain)
                              │
                    CloudFront (ACM us-east-1, PriceClass_100)
                     ┌────────┴─────────────────────────┐
        default behavior                        /v1/*  ·  /v1/webhooks/stripe
             │                                          │
       S3 (private, OAC)                          ALB (public subnets, 2 AZ)
       [static client]                                 │
                                          ECS Fargate service (private, 2 AZ)
                                             │  argon2 · Prisma pool
                                        SG :5432 │
                                          RDS PostgreSQL (private, Multi-AZ toggle)

  Egress:  Fargate ──► NAT ──► Internet   (Stripe API, transactional email)
           Fargate ──► S3 gateway endpoint (ECR layers)  ·  Secrets Manager / SSM ──► task env
  Telemetry: Fargate ──► CloudWatch (logs, metrics, alarms)
```

### Request flows
- **Public reads** (directory/profile/feed): static assets served from CloudFront edge; API calls → CloudFront `/v1/*` → ALB → Fargate → RDS. (Edge-cacheable at Stage 2.)
- **Donation** *(Phase 2, once Stripe access lands)*: browser → `/v1/donations` → Fargate creates a direct Checkout Session on the athlete's connected account (egress via NAT to Stripe) → returns the hosted Checkout URL. Stripe → `/v1/webhooks/stripe` (CloudFront → ALB → Fargate, **raw body**) → idempotent write to the `DonationEvent` ledger in RDS.
- **Health:** ALB → `/v1/health/ready` → Fargate → `SELECT 1` on RDS.

---

## Deploy-time orchestration (CDK stacks)

Stacks are deployed in dependency order; later stacks consume earlier outputs (VPC, security groups, cluster, secret ARNs, ALB DNS) via CDK cross-stack references.

```
NetworkStack   VPC · subnets · SGs · NAT · S3 gateway endpoint
     └─► DataStack    RDS (Multi-AZ toggle) · Secrets Manager master creds
            └─► ApiStack   ECR · Fargate+ALB · secrets→env · SG→RDS · MigrationTask · logs
                   └─► WebStack   S3(OAC) · CloudFront · ACM · Route 53 · /v1/*,/v1/webhooks/stripe → ALB
     (SchedulerStack — deferred with all-or-nothing pledges)
```

**Why this order:** the API needs the DB endpoint + secrets before it can run; the web front door needs the ALB DNS to configure its origin. Per-environment values (prod now; staging later) come from `cdk/config/`.

---

## CI/CD orchestration (GitHub Actions, OIDC — no static keys)

```
PR ─────────────► ci.yml            type-check · lint · test · build   (app + common)

merge to main
  app/** | common/** ─► deploy-api.yml
        1. assume GitHub OIDC role
        2. build arm64 image ──► push ECR
        3. cdk deploy (changed stacks)
        4. ECS RunTask: `prisma migrate deploy`   ◄── discrete, BEFORE traffic shift
        5. ECS service rolling update (2 AZ, ALB health-checked) ──► zero-downtime

  client/** | common/** ─► deploy-web.yml
        build ──► S3 sync ──► CloudFront invalidation
```

**Justifications:**
- **Migrations as a discrete pre-traffic `RunTask`**, never on container boot — avoids races when multiple tasks start simultaneously, and keeps schema changes an explicit, reviewable step.
- **GitHub OIDC role** — federated short-lived creds; no long-lived AWS keys in the repo.
- **arm64 build** — Graviton Fargate is ~20% cheaper; the image must match the runtime arch.
- **Rolling update behind ALB health checks** — zero-downtime; a bad task fails its health check and is replaced.

---

## Runtime orchestration

- **ECS service:** desired count with **CPU-target autoscaling**, spread across 2 AZs. ALB health checks (`/v1/health/ready`) drive task replacement. **Graceful shutdown** — SIGTERM → stop accepting, drain in-flight, `prisma.$disconnect()`.
- **Scheduled work** *(deferred with pledges):* EventBridge Scheduler → an ECS `RunTask` running the campaign deadline resolver (idempotent, batched, resumable). Not part of the initial direct-donation build.
- **Config/secrets at launch:** the task role reads Secrets Manager / SSM; nothing sensitive is baked into the image.

---

## Security & reliability posture

Summary here; full reliability tradeoffs + PCI/PII notes in `docs/infrastructure-and-scaling.md`.

- **Isolation:** compute + DB in private subnets; least-privilege security groups (only ALB→Fargate, only Fargate→RDS:5432).
- **Secrets:** never in env files/images; Secrets Manager with DB-cred rotation.
- **TLS everywhere** via ACM (CloudFront + ALB). **WAF** on CloudFront/ALB from Stage 1.
- **Resilience:** Multi-AZ RDS (toggle), ≥2 Fargate tasks across AZs, health-checked rolling deploys, automated backups + PITR.
- **PCI minimized:** card data never touches our servers (Stripe collects it); we store only references + status.

---

## Decision summary

| Concern | Chosen | Key reason | Revisit when |
|---|---|---|---|
| Compute | ECS Fargate + ALB | always-warm containers fit argon2 + Stripe webhook + DB pool | ops cost pressure → App Runner |
| Database | RDS PostgreSQL `t4g` | cheapest reliable managed Postgres | write contention → Aurora (Stage 3) |
| Client | S3 + CloudFront | cheapest global static hosting | profile SEO → SSR/ISR (Stage 2) |
| Front door | CloudFront + ACM + Route 53 | one domain, stable webhook host, no CORS | — |
| Secrets | Secrets Manager + SSM | rotation + no secrets in images | — |
| Networking | VPC 2 AZ, 1 NAT + S3 endpoint | secure, external egress for Stripe/email APIs | HA NAT (Stage 1) |
| CI/CD | GitHub Actions + OIDC | short-lived creds, arm64, safe migrations | — |

## Open items before authoring CDK
- ✅ **Domain:** `athletearc.ca` — hardcoded across the client (sitemap, metadata, profile links, `hello@athletearc.ca`). DNS is at GoDaddy with no AWS configuration yet, so the **test env runs in temporary-URL mode** (CloudFront default domain; no zone/cert). `test.athletearc.ca` activates via Route 53 delegation + restoring the `domain` block in `cdk/config/` — see `cdk/README.md` → §1a.
- ✅ **Environments:** `test` first (the first AWS deployment target), `production` later — branching/promotion in `docs/delivery-plan.md`.
- **Web build note (M3):** the client's static export currently rides the `GITHUB_PAGES` flag, which sets a `/athlete_dreams` basePath — wrong for `athletearc.ca`. The S3/CloudFront deploy needs a plain static-export mode with **no basePath** (small `next.config.ts` knob). And once directory data is API-driven, static pre-rendering stops reflecting new athletes — the SSR/ISR move (Stage 2) becomes SEO-driven rather than optional.
- Stripe + production email-sender operations remain **deferred** (see prerequisites) — do not block infra bring-up.
