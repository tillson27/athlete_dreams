const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

export function validateProductionConfig(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;

  const errors: string[] = [];
  const appUrl = parseHttpsUrl(env.APP_URL, 'APP_URL', errors);
  if (appUrl && LOCAL_HOSTS.has(appUrl.hostname)) {
    errors.push('APP_URL must not point at localhost in production.');
  }

  const corsOrigins = (env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (corsOrigins.length === 0) {
    errors.push('CORS_ALLOWED_ORIGINS must include at least one production origin.');
  }
  for (const origin of corsOrigins) {
    const parsed = parseHttpsUrl(origin, 'CORS_ALLOWED_ORIGINS', errors);
    if (parsed && LOCAL_HOSTS.has(parsed.hostname)) {
      errors.push('CORS_ALLOWED_ORIGINS must not include localhost in production.');
    }
  }

  requireStripeSecret(env.STRIPE_SECRET_KEY, errors);
  requireSecret(env.STRIPE_CONNECT_WEBHOOK_SECRET, 'STRIPE_CONNECT_WEBHOOK_SECRET', errors);
  requireSecret(env.RESEND_API_KEY, 'RESEND_API_KEY', errors);
  requireEmailSender(env.RESEND_FROM_EMAIL, errors);
  parseHttpsUrl(env.STRIPE_ACCOUNT_ONBOARDING_RETURN_URL, 'STRIPE_ACCOUNT_ONBOARDING_RETURN_URL', errors);
  parseHttpsUrl(env.STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL, 'STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL', errors);
  parseHttpsUrl(env.STRIPE_CHECKOUT_SUCCESS_URL, 'STRIPE_CHECKOUT_SUCCESS_URL', errors);
  parseHttpsUrl(env.STRIPE_CHECKOUT_CANCEL_URL, 'STRIPE_CHECKOUT_CANCEL_URL', errors);

  if (errors.length > 0) {
    throw new Error(`Invalid production configuration: ${errors.join(' ')}`);
  }
}

function parseHttpsUrl(
  rawValue: string | undefined,
  name: string,
  errors: string[]
): URL | null {
  if (!rawValue) {
    errors.push(`${name} is required in production.`);
    return null;
  }
  try {
    const parsed = new URL(rawValue);
    if (parsed.protocol !== 'https:') {
      errors.push(`${name} must use https in production.`);
    }
    return parsed;
  } catch {
    errors.push(`${name} must be a valid URL.`);
    return null;
  }
}

function requireStripeSecret(rawValue: string | undefined, errors: string[]): void {
  if (!rawValue) {
    errors.push('STRIPE_SECRET_KEY is required in production.');
    return;
  }
  if (!/^(sk|rk)_(test|live)_/.test(rawValue)) {
    errors.push('STRIPE_SECRET_KEY must be a Stripe test or live secret key.');
  }
}

function requireSecret(rawValue: string | undefined, name: string, errors: string[]): void {
  if (!rawValue) {
    errors.push(`${name} is required in production.`);
    return;
  }
  if (rawValue.includes('replace') || rawValue.includes('placeholder')) {
    errors.push(`${name} must not be a placeholder in production.`);
  }
}

function requireEmailSender(rawValue: string | undefined, errors: string[]): void {
  if (!rawValue) {
    errors.push('RESEND_FROM_EMAIL is required in production.');
    return;
  }
  if (rawValue.includes('resend.dev') || rawValue.includes('placeholder')) {
    errors.push('RESEND_FROM_EMAIL must be a verified production sender.');
  }
}
