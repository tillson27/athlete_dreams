import { database, defineRailway, github, preserve, project, service, volume } from "railway/iac";

const REGION = "us-east4-eqdc4a";

export default defineRailway(() => {
  // Pinned to the SSL image at the major version that created the volume's
  // PGDATA. The postgres() helper defaults to a bare `postgres:18`, which would
  // both drop SSL and move Postgres 17 data onto an 18 binary that refuses to
  // read it. Never bump this without a dump/restore.
  const Postgres = database("Postgres", "postgres", {
    image: "ghcr.io/railwayapp-templates/postgres-ssl:17",
    region: REGION,
  });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolume = volume("postgres-volume", {
    alerts: { usage: { "80": {}, "95": {}, "100": {} } },
    allowOnlineResize: true,
    region: REGION,
    sizeMB: 5000,
  });

  const athlete_dreams = service("athlete_dreams", {
    source: github("tillson27/athlete_dreams", { checkSuites: false }),
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "app/Dockerfile" },
    start: "node dist/index.js",
    healthcheck: "/v1/health/ready",
    healthcheckTimeout: 300,
    preDeploy: "npx prisma migrate deploy",
    replicas: { [REGION]: 1 },
    networking: {
      privateNetworkEndpoint: "athletedreams",
      serviceDomains: { "athletedreams-production.up.railway.app": { port: 8080 } },
    },
    // Values live only in Railway. preserve() keeps them out of the repo, so
    // this file can be committed without leaking secrets.
    env: {
      APP_URL: preserve(),
      CORS_ALLOWED_ORIGINS: preserve(),
      DATABASE_URL: preserve(),
      DEFAULT_CURRENCY: preserve(),
      DONATION_MINIMUM_CENTS: preserve(),
      JWT_ACCESS_TOKEN_TTL_SECONDS: preserve(),
      JWT_SECRET: preserve(),
      LOG_LEVEL: preserve(),
      NODE_ENV: preserve(),
      RESEND_API_KEY: preserve(),
      RESEND_FROM_EMAIL: preserve(),
      SIGNUP_EMAIL_ALLOWLIST: preserve(),
      STRIPE_ACCOUNT_ONBOARDING_REFRESH_URL: preserve(),
      STRIPE_ACCOUNT_ONBOARDING_RETURN_URL: preserve(),
      STRIPE_CHECKOUT_CANCEL_URL: preserve(),
      STRIPE_CHECKOUT_SUCCESS_URL: preserve(),
      STRIPE_CONNECT_WEBHOOK_SECRET: preserve(),
      STRIPE_SECRET_KEY: preserve(),
    },
  });

  return project("exquisite-flexibility", {
    resources: [athlete_dreams, Postgres, postgresVolume],
  });
});
