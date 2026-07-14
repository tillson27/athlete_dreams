#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../src/app-stack';
import { DataStack } from '../src/data-stack';
import { EdgeStack } from '../src/edge-stack';
import { getStageConfig } from '../src/config';
import { NetworkStack } from '../src/network-stack';

const cdkApp = new cdk.App();
const stageConfig = getStageConfig(cdkApp.node.tryGetContext('stage'));
const stackPrefix = `fad-${stageConfig.stageName}`;
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'ca-central-1',
};

const networkStack = new NetworkStack(cdkApp, `${stackPrefix}-network`, {
  env,
  stackName: `${stackPrefix}-network`,
  stageConfig,
});

const dataStack = new DataStack(cdkApp, `${stackPrefix}-data`, {
  env,
  stackName: `${stackPrefix}-data`,
  databaseClientSecurityGroup: networkStack.apiServiceSecurityGroup,
  stageConfig,
  vpc: networkStack.vpc,
});

const appStack = new AppStack(cdkApp, `${stackPrefix}-app`, {
  env,
  stackName: `${stackPrefix}-app`,
  apiServiceSecurityGroup: networkStack.apiServiceSecurityGroup,
  clientServiceSecurityGroup: networkStack.clientServiceSecurityGroup,
  loadBalancerSecurityGroup: networkStack.loadBalancerSecurityGroup,
  databaseCredentialsSecret: dataStack.credentialsSecret,
  databaseEndpointHost: dataStack.applicationDatabaseEndpointHost,
  databaseName: dataStack.databaseName,
  databasePort: dataStack.databasePort,
  stageConfig,
  vpc: networkStack.vpc,
});

const edgeStack = new EdgeStack(cdkApp, `${stackPrefix}-edge`, {
  env,
  stackName: `${stackPrefix}-edge`,
  loadBalancer: appStack.loadBalancer,
  stageConfig,
});

for (const stack of [networkStack, dataStack, appStack, edgeStack]) {
  cdk.Tags.of(stack).add('Project', 'fad');
  cdk.Tags.of(stack).add('Stage', stageConfig.stageName);
}
