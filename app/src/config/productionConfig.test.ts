import { describe, expect, it } from 'vitest';
import { validateProductionConfig } from './productionConfig';

const validProductionEnv = {
  NODE_ENV: 'production',
  APP_URL: 'https://athletearc.ca',
  CORS_ALLOWED_ORIGINS: 'https://athletearc.ca,https://www.athletearc.ca',
  STRIPE_SECRET_KEY: 'sk_test_unit',
  STRIPE_CONNECT_WEBHOOK_SECRET: 'whsec_unit',
  STRIPE_ACCOUNT_ONBOARDING_RETURN_URL: 'https://athletearc.ca/dashboard',
  STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL: 'https://athletearc.ca/dashboard',
  STRIPE_CHECKOUT_SUCCESS_URL: 'https://athletearc.ca/donate/thanks',
  STRIPE_CHECKOUT_CANCEL_URL: 'https://athletearc.ca',
};

describe('validateProductionConfig', () => {
  it('accepts complete non-localhost production configuration', () => {
    expect(() => validateProductionConfig(validProductionEnv)).not.toThrow();
  });

  it('fails production startup for localhost origins and placeholder webhook secrets', () => {
    expect(() =>
      validateProductionConfig({
        ...validProductionEnv,
        APP_URL: 'http://localhost:3000',
        CORS_ALLOWED_ORIGINS: 'http://localhost:3000',
        STRIPE_CONNECT_WEBHOOK_SECRET: 'whsec_placeholder',
      })
    ).toThrow(/Invalid production configuration/);
  });
});
