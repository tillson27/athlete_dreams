#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { resolveEnvironmentConfig } from '../config';
import { NetworkStack } from '../lib/network-stack';
import { DataStack } from '../lib/data-stack';
import { ApiStack } from '../lib/api-stack';

const app = new App();

const envName = (app.node.tryGetContext('env') as string | undefined) ?? 'test';
const config = resolveEnvironmentConfig(envName);

const stackPrefix = `Arc-${config.envName}`;

/**
 * Account-agnostic on purpose: only the region is pinned, so `cdk synth`
 * needs no AWS credentials and no environment lookups. The account resolves
 * from the deploy-time credentials the user supplies.
 */
const env = { region: config.region };

const network = new NetworkStack(app, `${stackPrefix}-Network`, {
  env,
  config,
  description: `ARC network foundation (${config.envName}).`,
});

const data = new DataStack(app, `${stackPrefix}-Data`, {
  env,
  config,
  vpc: network.vpc,
  databaseSecurityGroup: network.databaseSecurityGroup,
  description: `ARC database (${config.envName}).`,
});

new ApiStack(app, `${stackPrefix}-Api`, {
  env,
  config,
  vpc: network.vpc,
  albSecurityGroup: network.albSecurityGroup,
  serviceSecurityGroup: network.serviceSecurityGroup,
  dbInstance: data.dbInstance,
  dbSecret: data.dbSecret,
  databaseName: data.databaseName,
  description: `ARC API compute (${config.envName}).`,
});

app.synth();
