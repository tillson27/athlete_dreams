import assert from 'node:assert/strict';
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { WebStack } from '../lib/web-stack';
import { testConfig } from '../config/test';

const app = new App();
const albStack = new Stack(app, 'AlbStack', { env: { region: testConfig.region } });
const loadBalancer = ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(
  albStack,
  'ImportedAlb',
  {
    loadBalancerArn:
      'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/arc-test/1234567890abcdef',
    loadBalancerDnsName: 'arc-test-alb.us-east-1.elb.amazonaws.com',
    loadBalancerCanonicalHostedZoneId: 'Z35SXDOTRQ7X7K',
    securityGroupId: 'sg-1234567890abcdef0',
  }
);
const stack = new WebStack(app, 'WebStackTest', {
  env: { region: testConfig.region },
  config: testConfig,
  loadBalancer,
});
const template = Template.fromStack(stack).toJSON();
const distribution = singleResource(template, 'AWS::CloudFront::Distribution');
const distributionConfig = distribution.Properties.DistributionConfig;
const cacheBehaviors = distributionConfig.CacheBehaviors as Array<Record<string, unknown>>;
const defaultFunctionAssociations = distributionConfig.DefaultCacheBehavior.FunctionAssociations;
const functionResources = resourcesOfType(template, 'AWS::CloudFront::Function');
const functionCode = Object.values(functionResources)[0]?.Properties.FunctionCode as string;

assert.equal(distributionConfig.CustomErrorResponses, undefined);
assert(
  cacheBehaviors.some((behavior) => behavior.PathPattern === '/v1/*' && !('FunctionAssociations' in behavior))
);
assert(
  cacheBehaviors.some(
    (behavior) => behavior.PathPattern === '/v1/webhooks/stripe' && !('FunctionAssociations' in behavior)
  )
);
assert(Array.isArray(defaultFunctionAssociations));
assert(functionCode.includes("request.uri = '/icon';"));
assert(functionCode.includes("uri === '/apple-icon'"));
assert(functionCode.includes("uri === '/opengraph-image'"));
assert(functionCode.includes("request.uri = staticRoutes[uri] ? uri + '.html' : '/404.html';"));

function singleResource(templateJson: Record<string, unknown>, type: string): Record<string, any> {
  const resources = resourcesOfType(templateJson, type);
  const values = Object.values(resources);
  assert.equal(values.length, 1);
  return values[0] as Record<string, any>;
}

function resourcesOfType(
  templateJson: Record<string, unknown>,
  type: string
): Record<string, Record<string, any>> {
  const resources = templateJson.Resources as Record<string, Record<string, any>>;
  return Object.fromEntries(
    Object.entries(resources).filter(([, resource]) => resource.Type === type)
  );
}
