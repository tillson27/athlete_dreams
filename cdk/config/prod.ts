import { AWS_REGION, EnvironmentConfig } from './types';

export const prodConfig: EnvironmentConfig = {
  envName: 'prod',
  region: AWS_REGION,

  multiAz: true,
  instanceSize: 't4g.medium',
  natStrategy: 'gateway',
  natGatewayCount: 2,
  desiredCount: 2,
  useSpot: false,
  priceClass: 'PriceClass_100',

  rdsAllocatedStorageGib: 50,
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
    // PLACEHOLDER — replace with the real athletearc.ca hosted-zone id before deploying WebStack.
    hostedZoneId: 'Z0PLACEHOLDER000000',
    zoneName: 'athletearc.ca',
  },

  // Open until the M7 go-live decision on invite gating.
  signupEmailAllowlist: [],
};
