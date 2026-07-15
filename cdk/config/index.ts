import { EnvironmentConfig, EnvName } from './types';
import { testConfig } from './test';
import { prodConfig } from './prod';

const configByEnv: Record<EnvName, EnvironmentConfig> = {
  test: testConfig,
  prod: prodConfig,
};

export function resolveEnvironmentConfig(envName: string): EnvironmentConfig {
  if (envName !== 'test' && envName !== 'prod') {
    throw new Error(
      `Unknown env "${envName}". Pass -c env=test or -c env=prod (cdk synth -c env=test).`
    );
  }
  return configByEnv[envName];
}

export * from './types';
