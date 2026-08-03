import { AWS_REGION, EnvironmentConfig } from './types';

export const prodConfig: EnvironmentConfig = {
  envName: 'prod',
  region: AWS_REGION,

  multiAz: false,
  instanceSize: 't4g.small',
  natStrategy: 'gateway',
  natGatewayCount: 1,
  desiredCount: 2,
  useSpot: false,
  priceClass: 'PriceClass_100',

  rdsAllocatedStorageGib: 20,
  rdsBackupRetentionDays: 14,
  rdsRemovalPolicy: 'snapshot',

  serviceCpu: 512,
  serviceMemoryMib: 1024,
  minCapacity: 2,
  maxCapacity: 4,
  cpuTargetUtilizationPercent: 60,

  logRetentionDays: 30,
  nodeEnv: 'production',
  logLevel: 'info',
  jwtAccessTokenTtlSeconds: 3600,

  domain: {
    rootDomain: 'athletearc.ca',
    clientDomain: 'athletearc.ca',
    clientAlternateDomain: 'www.athletearc.ca',
    apiDomain: 'api.athletearc.ca',
    hostedZoneId: 'Z09125813QDW7R0WM4HV',
    zoneName: 'athletearc.ca',
  },

  // Open until the M7 go-live decision on invite gating.
  signupEmailAllowlist: [],

  // ECR repo was created during the first Arc-prod-Api deploy attempt (before
  // the ECS service failed to stabilize — no image). Import it on redeploy
  // so CloudFormation does not conflict with the retained repository.
  existingEcrRepositoryArn: 'arn:aws:ecr:us-east-1:154932391130:repository/arc-prod-api',

  // Full Stripe secret ARNs (including Secrets Manager suffix). Using
  // fromSecretCompleteArn avoids the `??????` wildcard pattern from
  // fromSecretNameV2 which fails IAM evaluation during ECS task startup.
  stripeSecretKeyArn: 'arn:aws:secretsmanager:us-east-1:154932391130:secret:arc/prod/stripe/secret-key-UYSD5s',
  stripeConnectWebhookSecretArn: 'arn:aws:secretsmanager:us-east-1:154932391130:secret:arc/prod/stripe/connect-webhook-secret-Xx0DZH',
};
