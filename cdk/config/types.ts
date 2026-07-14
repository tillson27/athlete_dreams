export type EnvName = 'test' | 'prod';

export type NatStrategy = 'instance' | 'gateway';

export type PriceClass = 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';

export type RdsRemovalPolicy = 'destroy' | 'snapshot';

export interface DomainConfig {
  readonly rootDomain: string;
  readonly clientDomain: string;
  readonly clientAlternateDomain?: string;
  readonly apiDomain: string;

  /**
   * Route 53 hosted-zone attributes for `rootDomain`, consumed by WebStack via
   * `HostedZone.fromHostedZoneAttributes` (NOT `fromLookup`) so `cdk synth` stays
   * account/credential-free.
   *
   * CONTRACT: `hostedZoneId` ships as an obvious placeholder. Before deploying
   * WebStack the user MUST replace it with the real hosted-zone id for
   * `zoneName` (Route 53 console → the zone → "Hosted zone ID"); deploying with
   * the placeholder fails to create the ACM validation and alias records.
   */
  readonly hostedZoneId: string;
  readonly zoneName: string;
}

/**
 * Typed cost/HA parameter object driving every stack. Source of the values:
 * `docs/infrastructure-and-scaling.md` → "CDK cost/HA parameters" table.
 * `test` is the lean Stage-0 profile; `prod` is the HA Stage-1+ profile.
 */
export interface EnvironmentConfig {
  readonly envName: EnvName;
  readonly region: string;

  readonly multiAz: boolean;
  readonly instanceSize: string;
  readonly natStrategy: NatStrategy;
  readonly natGatewayCount: number;
  readonly desiredCount: number;
  readonly useSpot: boolean;
  readonly priceClass: PriceClass;

  readonly rdsAllocatedStorageGib: number;
  readonly rdsBackupRetentionDays: number;
  readonly rdsRemovalPolicy: RdsRemovalPolicy;

  readonly serviceCpu: number;
  readonly serviceMemoryMib: number;
  readonly minCapacity: number;
  readonly maxCapacity: number;
  readonly cpuTargetUtilizationPercent: number;

  readonly logRetentionDays: number;
  readonly nodeEnv: string;
  readonly logLevel: string;

  /**
   * CONTRACT: omit to run the environment on the CloudFront default domain
   * (`https://<distribution>.cloudfront.net`) — no Route 53 zone, ACM cert, or
   * alias records are created, and the front door stays same-origin for the
   * API paths. Set it once DNS for `rootDomain` is available in (or delegated
   * to) Route 53; see `cdk/README.md` → "Custom domain".
   */
  readonly domain?: DomainConfig;

  /**
   * CONTRACT: sign-up/sign-in email allowlist injected as
   * `SIGNUP_EMAIL_ALLOWLIST`. Entries are exact emails (`a@b.c`) or whole
   * domains (`@b.c`), case-insensitive. Empty/omitted = open (no gate).
   */
  readonly signupEmailAllowlist?: readonly string[];
}

export const DATABASE_NAME = 'arc';

export const AWS_REGION = 'us-east-1';
