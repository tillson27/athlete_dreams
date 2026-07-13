#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { resolveEnvironmentConfig } from '../config';
import { NetworkStack } from '../lib/network-stack';

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

new NetworkStack(app, `${stackPrefix}-Network`, {
  env,
  config,
  description: `ARC network foundation (${config.envName}).`,
});

app.synth();
