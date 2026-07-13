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

  domain: {
    rootDomain: 'athletearc.ca',
    clientDomain: 'athletearc.ca',
    clientAlternateDomain: 'www.athletearc.ca',
    apiDomain: 'api.athletearc.ca',
  },
};
