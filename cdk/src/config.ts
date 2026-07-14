import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';

export type DeploymentStage = 'beta' | 'production';

export interface StageConfig {
  readonly stageName: DeploymentStage;
  readonly isProduction: boolean;
  readonly logRetention: logs.RetentionDays;
  readonly natGateways: number;
  readonly apiDesiredCount: number;
  readonly apiMinCapacity: number;
  readonly apiMaxCapacity: number;
  readonly apiCpu: number;
  readonly apiMemoryMiB: number;
  readonly clientDesiredCount: number;
  readonly clientMinCapacity: number;
  readonly clientMaxCapacity: number;
  readonly clientCpu: number;
  readonly clientMemoryMiB: number;
  readonly databaseInstanceType: ec2.InstanceType;
  readonly databaseAllocatedStorageGb: number;
  readonly databaseMaxAllocatedStorageGb: number;
  readonly databaseMultiAz: boolean;
  readonly databaseBackupRetention: Duration;
  readonly databaseDeletionProtection: boolean;
  readonly useRdsProxy: boolean;
}

export function getStageConfig(rawStage: unknown): StageConfig {
  const stageName = normalizeStage(rawStage);
  const isProduction = stageName === 'production';

  return {
    stageName,
    isProduction,
    logRetention: isProduction ? logs.RetentionDays.ONE_MONTH : logs.RetentionDays.ONE_WEEK,
    natGateways: isProduction ? 2 : 1,
    apiDesiredCount: isProduction ? 2 : 1,
    apiMinCapacity: isProduction ? 2 : 1,
    apiMaxCapacity: isProduction ? 6 : 2,
    apiCpu: isProduction ? 512 : 256,
    apiMemoryMiB: isProduction ? 1024 : 512,
    clientDesiredCount: isProduction ? 2 : 1,
    clientMinCapacity: isProduction ? 2 : 1,
    clientMaxCapacity: isProduction ? 6 : 2,
    clientCpu: isProduction ? 512 : 256,
    clientMemoryMiB: isProduction ? 1024 : 512,
    databaseInstanceType: isProduction
      ? ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.SMALL)
      : ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
    databaseAllocatedStorageGb: isProduction ? 50 : 20,
    databaseMaxAllocatedStorageGb: isProduction ? 1000 : 100,
    databaseMultiAz: isProduction,
    databaseBackupRetention: Duration.days(isProduction ? 30 : 7),
    databaseDeletionProtection: isProduction,
    useRdsProxy: isProduction,
  };
}

function normalizeStage(rawStage: unknown): DeploymentStage {
  if (rawStage === 'production' || rawStage === 'prod') return 'production';
  return 'beta';
}
