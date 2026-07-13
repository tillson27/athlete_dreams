#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { resolveEnvironmentConfig } from '../config';
import { CicdStack } from '../lib/cicd-stack';
import { NetworkStack } from '../lib/network-stack';
import { DataStack } from '../lib/data-stack';
import { ApiStack } from '../lib/api-stack';
import { WebStack } from '../lib/web-stack';

const app = new App();

const envName = (app.node.tryGetContext('env') as string | undefined) ?? 'test';
const config = resolveEnvironmentConfig(envName);

// deploy-api.yml passes `-c imageTag=<git-sha>` for the image it just pushed so
// each deploy pins an immutable ECR tag; unset (first bring-up) falls back to
// the ApiStack default (`latest`).
const imageTag = app.node.tryGetContext('imageTag') as string | undefined;

const stackPrefix = `Arc-${config.envName}`;

/**
 * Account-agnostic on purpose: only the region is pinned, so `cdk synth`
 * needs no AWS credentials and no environment lookups. The account resolves
 * from the deploy-time credentials the user supplies.
 */
const env = { region: config.region };

// CI/CD identity, deployed first (before Network/Data/Api/Web) so the GitHub
// OIDC deploy role exists before the workflows try to assume it. It holds no
// cross-stack references — its permissions are scoped by the downstream stacks'
// resource-name conventions — so it carries no ordering dependency on them.
new CicdStack(app, `${stackPrefix}-Cicd`, {
  env,
  config,
  description: `ARC CI/CD OIDC identity + deploy role (${config.envName}).`,
});

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

const api = new ApiStack(app, `${stackPrefix}-Api`, {
  env,
  config,
  vpc: network.vpc,
  albSecurityGroup: network.albSecurityGroup,
  serviceSecurityGroup: network.serviceSecurityGroup,
  dbInstance: data.dbInstance,
  dbSecret: data.dbSecret,
  databaseName: data.databaseName,
  imageTag,
  description: `ARC API compute (${config.envName}).`,
});

new WebStack(app, `${stackPrefix}-Web`, {
  env,
  config,
  loadBalancer: api.service.loadBalancer,
  description: `ARC web front door (${config.envName}).`,
});

app.synth();
