import { AWS_REGION, EnvironmentConfig } from './types';

export const testConfig: EnvironmentConfig = {
  envName: 'test',
  region: AWS_REGION,

  multiAz: false,
  instanceSize: 't4g.small',
  natStrategy: 'instance',
  natGatewayCount: 1,
  desiredCount: 2,
  useSpot: true,
  priceClass: 'PriceClass_100',

  rdsAllocatedStorageGib: 20,
  rdsBackupRetentionDays: 7,
  rdsRemovalPolicy: 'destroy',

  serviceCpu: 256,
  serviceMemoryMib: 512,
  minCapacity: 2,
  maxCapacity: 4,
  cpuTargetUtilizationPercent: 60,

  logRetentionDays: 14,
  nodeEnv: 'production',
  logLevel: 'info',

  // Temporary-URL mode: no `domain` until athletearc.ca DNS reaches Route 53
  // (currently at GoDaddy). The stack serves https://<distribution>.cloudfront.net;
  // re-enable per cdk/README.md → "Custom domain".

  signupEmailAllowlist: [
    '@seed.athletearc.ca',
    '@smoke.athletearc.ca',
  ],
};
