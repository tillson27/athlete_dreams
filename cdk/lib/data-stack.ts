import { Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  ISecurityGroup,
  IVpc,
  SubnetType,
} from 'aws-cdk-lib/aws-ec2';
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  StorageType,
} from 'aws-cdk-lib/aws-rds';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { DATABASE_NAME, EnvironmentConfig } from '../config/types';

export interface DataStackProps extends StackProps {
  readonly config: EnvironmentConfig;
  readonly vpc: IVpc;
  readonly databaseSecurityGroup: ISecurityGroup;
}

const INSTANCE_SIZE_BY_NAME: Record<string, InstanceSize> = {
  micro: InstanceSize.MICRO,
  small: InstanceSize.SMALL,
  medium: InstanceSize.MEDIUM,
  large: InstanceSize.LARGE,
  xlarge: InstanceSize.XLARGE,
};

/**
 * Parses a `t4g.<size>` config string into a Graviton RDS instance type.
 * Only the Graviton `t4g` burstable family is supported at this scale
 * (`docs/infrastructure-and-scaling.md`); an unknown size fails fast at synth.
 */
function resolveDbInstanceType(instanceSize: string): InstanceType {
  const [family, size] = instanceSize.split('.');
  if (family !== 't4g') {
    throw new Error(
      `Unsupported RDS instanceSize "${instanceSize}"; expected the Graviton t4g family (e.g. t4g.small).`
    );
  }
  const resolvedSize = INSTANCE_SIZE_BY_NAME[size];
  if (!resolvedSize) {
    throw new Error(`Unsupported RDS instance size "${size}" in "${instanceSize}".`);
  }
  return InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, resolvedSize);
}

/**
 * Managed PostgreSQL for the API: a single Graviton `t4g` RDS instance in the
 * private subnets, reachable only via the NetworkStack database security group.
 * Multi-AZ, size, backup retention, and removal policy are config-driven so the
 * same code runs lean (`test`) or HA (`prod`).
 *
 * Contract for ApiStack (cross-stack refs): consume `dbInstance` (endpoint) and
 * `dbSecret` (Secrets Manager master credentials JSON) and `databaseName`.
 */
export class DataStack extends Stack {
  public readonly dbInstance: DatabaseInstance;
  public readonly dbSecret: ISecret;
  public readonly databaseName: string;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const { config, vpc, databaseSecurityGroup } = props;

    this.databaseName = DATABASE_NAME;

    const removalPolicy =
      config.rdsRemovalPolicy === 'snapshot' ? RemovalPolicy.SNAPSHOT : RemovalPolicy.DESTROY;

    this.dbInstance = new DatabaseInstance(this, 'Database', {
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_16,
      }),
      instanceType: resolveDbInstanceType(config.instanceSize),
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [databaseSecurityGroup],
      multiAz: config.multiAz,
      allocatedStorage: config.rdsAllocatedStorageGib,
      maxAllocatedStorage: config.rdsAllocatedStorageGib * 4,
      storageType: StorageType.GP3,
      credentials: Credentials.fromGeneratedSecret('arc_admin', {
        secretName: `arc/${config.envName}/rds/master`,
      }),
      databaseName: this.databaseName,
      // Automated backups + PITR: a non-zero retention enables point-in-time
      // recovery; test keeps 7 days per the plan, prod longer.
      backupRetention: Duration.days(config.rdsBackupRetentionDays),
      deleteAutomatedBackups: config.rdsRemovalPolicy === 'destroy',
      deletionProtection: config.rdsRemovalPolicy === 'snapshot',
      storageEncrypted: true,
      removalPolicy,
    });

    this.dbSecret = this.dbInstance.secret!;

    Tags.of(this).add('project', 'arc');
    Tags.of(this).add('env', config.envName);
  }
}
