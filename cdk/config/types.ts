export type EnvName = 'test' | 'prod';

export type NatStrategy = 'instance' | 'gateway';

export type PriceClass = 'PriceClass_100' | 'PriceClass_200' | 'PriceClass_All';

export type RdsRemovalPolicy = 'destroy' | 'snapshot';

export interface DomainConfig {
  readonly rootDomain: string;
  readonly clientDomain: string;
  readonly clientAlternateDomain?: string;
  readonly apiDomain: string;
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

  readonly domain: DomainConfig;
}

export const DATABASE_NAME = 'arc';

export const AWS_REGION = 'us-east-1';
