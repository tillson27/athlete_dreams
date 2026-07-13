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

  domain: {
    rootDomain: 'athletearc.ca',
    clientDomain: 'test.athletearc.ca',
    apiDomain: 'api.test.athletearc.ca',
  },
};
