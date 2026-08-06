import 'reflect-metadata';
import type express from 'express';
import { buildApp } from '../app';

const testAppEnvDefaults: Record<string, string> = {
  STRIPE_SECRET_KEY: 'sk_test_dummy',
  STRIPE_CONNECT_WEBHOOK_SECRET: 'whsec_dummy',
};

export function buildTestApp(): express.Express {
  for (const [envName, envValue] of Object.entries(testAppEnvDefaults)) {
    process.env[envName] ??= envValue;
  }
  return buildApp();
}
