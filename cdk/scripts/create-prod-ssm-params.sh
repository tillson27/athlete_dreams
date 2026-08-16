#!/usr/bin/env bash
# Creates all SSM Parameter Store values required by Arc-prod-Api before deployment.
# Run once per environment; subsequent deploys skip parameters that already exist.
# Usage: bash cdk/scripts/create-prod-ssm-params.sh

set -euo pipefail

REGION="us-east-1"
ENV="prod"

put() {
  local name="$1"
  local value="$2"
  echo "  $name"
  aws ssm put-parameter \
    --region "$REGION" \
    --name "$name" \
    --value "$value" \
    --type String \
    --no-overwrite \
    2>/dev/null && echo "    → created" || echo "    → already exists, skipped"
}

echo "=== Arc $ENV SSM Parameters ==="

# Email
put "/arc/$ENV/email/from-address" "info@athletearc.ca"

# Stripe — onboarding redirect URLs (athletes/me/manage is the manage page)
put "/arc/$ENV/stripe/account-onboarding-return-url" "https://athletearc.ca/athletes/me/manage?stripe_return=1"
put "/arc/$ENV/stripe/account-onboarding-refresh-url" "https://athletearc.ca/athletes/me/manage?stripe_refresh=1"

# Stripe — checkout redirect URLs
put "/arc/$ENV/stripe/checkout-success-url" "https://athletearc.ca/donate/thanks"
put "/arc/$ENV/stripe/checkout-cancel-url" "https://athletearc.ca"

# Donations
put "/arc/$ENV/donations/minimum-cents" "500"
put "/arc/$ENV/donations/default-currency" "cad"

echo ""
echo "Done."
