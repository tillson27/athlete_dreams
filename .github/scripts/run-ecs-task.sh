#!/usr/bin/env bash
#
# Launch one ECS Fargate RunTask, wait for it to stop, and fail the workflow
# unless every container exited 0. Used by deploy-api.yml for the pre-traffic
# migration task and the optional seed task (cdk/README.md documents the manual
# equivalent). All inputs arrive via the environment — nothing untrusted is ever
# interpolated into a command.
#
# Required env: CLUSTER, TASK_DEF, SECURITY_GROUP, SUBNETS (comma-separated),
#               AWS_REGION.

set -euo pipefail

: "${CLUSTER:?CLUSTER is required}"
: "${TASK_DEF:?TASK_DEF is required}"
: "${SECURITY_GROUP:?SECURITY_GROUP is required}"
: "${SUBNETS:?SUBNETS is required}"
: "${AWS_REGION:?AWS_REGION is required}"

# Tasks run in the private subnets with no public IP (egress via NAT), reachable
# only through the service security group — the same placement the service uses.
network_config="awsvpcConfiguration={subnets=[${SUBNETS}],securityGroups=[${SECURITY_GROUP}],assignPublicIp=DISABLED}"

echo "Starting RunTask for ${TASK_DEF} on cluster ${CLUSTER}"
task_arn="$(aws ecs run-task \
  --cluster "${CLUSTER}" \
  --task-definition "${TASK_DEF}" \
  --launch-type FARGATE \
  --network-configuration "${network_config}" \
  --started-by github-actions-deploy \
  --query 'tasks[0].taskArn' \
  --output text)"

if [[ -z "${task_arn}" || "${task_arn}" == "None" ]]; then
  echo "run-task did not return a task ARN" >&2
  exit 1
fi
echo "Task started: ${task_arn}"

echo "Waiting for task to stop..."
aws ecs wait tasks-stopped --cluster "${CLUSTER}" --tasks "${task_arn}"

# Fail on a non-zero container exit or a task that never ran (stopped by a
# capacity/image/pull error surfaces here as a stoppedReason with no exitCode).
exit_code="$(aws ecs describe-tasks \
  --cluster "${CLUSTER}" \
  --tasks "${task_arn}" \
  --query 'tasks[0].containers[0].exitCode' \
  --output text)"
stopped_reason="$(aws ecs describe-tasks \
  --cluster "${CLUSTER}" \
  --tasks "${task_arn}" \
  --query 'tasks[0].stoppedReason' \
  --output text)"

echo "Task stopped. exitCode=${exit_code} stoppedReason=${stopped_reason}"

if [[ "${exit_code}" != "0" ]]; then
  echo "RunTask failed (exitCode=${exit_code})" >&2
  exit 1
fi
echo "RunTask completed successfully."
