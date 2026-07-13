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

  domain: {
    rootDomain: 'athletearc.ca',
    clientDomain: 'test.athletearc.ca',
    apiDomain: 'api.test.athletearc.ca',
    // PLACEHOLDER — replace with the real athletearc.ca hosted-zone id before deploying WebStack.
    hostedZoneId: 'Z0PLACEHOLDER000000',
    zoneName: 'athletearc.ca',
  },
};
