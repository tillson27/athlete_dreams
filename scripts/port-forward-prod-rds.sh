#!/usr/bin/env bash
# Port-forward production RDS to localhost via SSM through the prod ECS task.
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Session Manager plugin installed: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
#   - ECS Exec enabled on the prod service (Arc-prod-Api-Service9571FDD8-ijc9IXtJWmGz)
#
# Usage:
#   ./scripts/port-forward-prod-rds.sh [LOCAL_PORT]
#
# Defaults to local port 5433 to avoid conflicts with a local Postgres instance.
# Connect with: psql -h localhost -p <LOCAL_PORT> -U arc_admin -d arc

set -euo pipefail

CLUSTER="Arc-prod-Api-ClusterEB0386A7-lqPlRNSfDP42"
SERVICE="Arc-prod-Api-Service9571FDD8-ijc9IXtJWmGz"
CONTAINER="api"
RDS_HOST="arc-prod-data-databaseb269d8bb-zdkemzlft9cr.cmv4iku0aovh.us-east-1.rds.amazonaws.com"
RDS_PORT="5432"
LOCAL_PORT="${1:-5433}"

echo "Looking up a running prod task..."
TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER" \
  --service-name "$SERVICE" \
  --desired-status RUNNING \
  --query 'taskArns[0]' \
  --output text)

if [[ -z "$TASK_ARN" || "$TASK_ARN" == "None" ]]; then
  echo "ERROR: No running tasks found in $SERVICE" >&2
  exit 1
fi

TASK_ID=$(basename "$TASK_ARN")
SSM_TARGET="ecs:${CLUSTER}_${TASK_ID}_${CONTAINER}"

echo "Task:        $TASK_ID"
echo "SSM target:  $SSM_TARGET"
echo "Forwarding:  localhost:$LOCAL_PORT -> $RDS_HOST:$RDS_PORT"
echo ""
echo "Connect with:"
echo "  psql -h localhost -p $LOCAL_PORT -U arc_admin -d arc"
echo ""
echo "Press Ctrl+C to stop the tunnel."
echo ""

aws ssm start-session \
  --target "$SSM_TARGET" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"$RDS_HOST\"],\"portNumber\":[\"$RDS_PORT\"],\"localPortNumber\":[\"$LOCAL_PORT\"]}"
