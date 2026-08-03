#!/usr/bin/env bash
#
# Production deployment script for Athlete Arc (arc / prod).
#
# What it does:
#   1. Builds the arm64 Docker image from the current working tree HEAD.
#   2. Pushes it to ECR tagged with the git SHA.
#   3. Deploys Arc-prod-Api (ECS Fargate) pinned to that SHA.
#   4. Runs the Prisma migration RunTask (pre-traffic, always).
#   5. Optionally runs the Prisma seed RunTask (--seed flag, first bring-up only).
#   6. Deploys Arc-prod-Web (S3 + CloudFront static export).
#   7. Invalidates the CloudFront cache.
#
# Usage:
#   ./scripts/deploy-prod.sh           # API + migrations + web
#   ./scripts/deploy-prod.sh --seed    # same + run seed task (idempotent upserts)
#   ./scripts/deploy-prod.sh --api-only  # skip web deploy
#   ./scripts/deploy-prod.sh --web-only  # skip API/migration deploy
#
# Prerequisites:
#   - AWS credentials active (aws sts get-caller-identity must succeed).
#   - Docker installed and running.
#   - Node 22+, npm — repo root already installed (npm install).
#   - CDK dependencies installed (npm install --prefix cdk).
#
# Environment:
#   All config is in cdk/config/prod.ts. No secrets live in this script.

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'
log()  { echo -e "${CYAN}[deploy]${NC} $*"; }
ok()   { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[deploy]${NC} $*"; }
fail() { echo -e "${RED}[deploy]${NC} $*" >&2; exit 1; }

# ── Flags ─────────────────────────────────────────────────────────────────────
RUN_SEED=false
API_ONLY=false
WEB_ONLY=false
for arg in "$@"; do
  case "$arg" in
    --seed)     RUN_SEED=true ;;
    --api-only) API_ONLY=true ;;
    --web-only) WEB_ONLY=true ;;
    *) fail "Unknown argument: $arg" ;;
  esac
done

# ── Constants ─────────────────────────────────────────────────────────────────
REGION="us-east-1"
ACCOUNT="154932391130"
ECR_REGISTRY="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"
ECR_REPO="arc-prod-api"
API_STACK="Arc-prod-Api"
WEB_STACK="Arc-prod-Web"
WEB_BUCKET="arc-prod-web"
ENV="prod"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CDK_DIR="${REPO_ROOT}/cdk"

# ── Preflight ─────────────────────────────────────────────────────────────────
log "Preflight checks…"
aws sts get-caller-identity --output text --query "Account" > /dev/null \
  || fail "AWS credentials not configured. Run: aws sso login"
command -v docker > /dev/null || fail "Docker not found"
command -v node   > /dev/null || fail "Node not found"

# Warn if working tree is dirty
if [[ -n "$(git -C "${REPO_ROOT}" status --porcelain 2>/dev/null)" ]]; then
  warn "Working tree has uncommitted changes — image will reflect current disk state."
fi

SHA="$(git -C "${REPO_ROOT}" rev-parse HEAD)"
log "Deploying commit ${SHA:0:12} to ${ENV}"

# ── ECR login ─────────────────────────────────────────────────────────────────
log "Logging in to ECR…"
aws ecr get-login-password --region "${REGION}" \
  | docker login --username AWS --password-stdin "${ECR_REGISTRY}" > /dev/null

# ── API deploy ────────────────────────────────────────────────────────────────
if [[ "${WEB_ONLY}" != "true" ]]; then

  log "Building arm64 image (this takes a few minutes)…"
  docker buildx build \
    --platform linux/arm64 \
    --file "${REPO_ROOT}/app/Dockerfile" \
    --tag  "${ECR_REGISTRY}/${ECR_REPO}:${SHA}" \
    --tag  "${ECR_REGISTRY}/${ECR_REPO}:latest" \
    --push \
    "${REPO_ROOT}"
  ok "Image pushed: ${ECR_REGISTRY}/${ECR_REPO}:${SHA}"

  log "Deploying ${API_STACK} (pinned to ${SHA:0:12})…"
  npm --prefix "${CDK_DIR}" install --silent
  npx --prefix "${CDK_DIR}" cdk deploy "${API_STACK}" \
    -c env="${ENV}" \
    -c "imageTag=${SHA}" \
    --require-approval never
  ok "${API_STACK} deployed."

  # ── Read stack outputs ───────────────────────────────────────────────────────
  read_output() {
    aws cloudformation describe-stacks \
      --stack-name "${API_STACK}" \
      --region "${REGION}" \
      --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
      --output text
  }

  CLUSTER="$(read_output EcsClusterName)"
  MIGRATION_TD="$(read_output MigrationTaskDefinitionArn)"
  SEED_TD="$(read_output SeedTaskDefinitionArn)"
  SG="$(read_output ServiceSecurityGroupId)"
  SUBNETS="$(read_output PrivateSubnetIds)"

  # ── Prisma migrations (always pre-traffic) ───────────────────────────────────
  log "Running Prisma migration task (pre-traffic)…"
  export CLUSTER TASK_DEF="${MIGRATION_TD}" SECURITY_GROUP="${SG}" SUBNETS AWS_REGION="${REGION}"
  "${REPO_ROOT}/.github/scripts/run-ecs-task.sh"
  ok "Migrations complete."

  # ── Optional seed ────────────────────────────────────────────────────────────
  if [[ "${RUN_SEED}" == "true" ]]; then
    warn "Running seed task (first bring-up only — idempotent upserts)…"
    export TASK_DEF="${SEED_TD}"
    "${REPO_ROOT}/.github/scripts/run-ecs-task.sh"
    ok "Seed complete."
  fi

fi

# ── Web deploy ────────────────────────────────────────────────────────────────
if [[ "${API_ONLY}" != "true" ]]; then

  log "Building Next.js static export…"
  npm --prefix "${REPO_ROOT}" install --silent
  npm run build --prefix "${REPO_ROOT}/common"
  STATIC_EXPORT=true \
  NEXT_PUBLIC_DATA_SOURCE=api \
  NEXT_PUBLIC_API_BASE_URL="https://athletearc.ca" \
    npm run build --prefix "${REPO_ROOT}/client"

  log "Syncing static export to s3://${WEB_BUCKET}…"
  aws s3 sync "${REPO_ROOT}/client/out/" "s3://${WEB_BUCKET}" --delete --region "${REGION}"

  DIST_ID="$(aws cloudformation describe-stacks \
    --stack-name "${WEB_STACK}" --region "${REGION}" \
    --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
    --output text)"

  log "Invalidating CloudFront distribution ${DIST_ID}…"
  aws cloudfront create-invalidation \
    --distribution-id "${DIST_ID}" \
    --paths '/*' \
    --output text --query "Invalidation.Id" > /dev/null
  ok "CloudFront cache invalidated."

fi

ok "Production deployment complete."
echo ""
echo "  Site:  https://athletearc.ca"
echo "  API:   https://athletearc.ca/v1/health/ready"
echo "  SHA:   ${SHA:0:12}"
