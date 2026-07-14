import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import type { StageConfig } from './config';

const DATABASE_NAME = 'fad';
const DATABASE_PORT = '5432';

export interface DataStackProps extends StackProps {
  readonly databaseClientSecurityGroup: ec2.ISecurityGroup;
  readonly stageConfig: StageConfig;
  readonly vpc: ec2.IVpc;
}

export class DataStack extends Stack {
  readonly applicationConnectionTarget: ec2.IConnectable;
  readonly applicationDatabaseEndpointHost: string;
  readonly credentialsSecret: secretsmanager.ISecret;
  readonly databaseName = DATABASE_NAME;
  readonly databasePort = DATABASE_PORT;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    const database = new rds.DatabaseInstance(this, 'PostgresDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of('16.4', '16'),
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      credentials: rds.Credentials.fromGeneratedSecret('fad_app', {
        secretName: `/fad/${props.stageConfig.stageName}/database/credentials`,
      }),
      databaseName: DATABASE_NAME,
      allocatedStorage: props.stageConfig.databaseAllocatedStorageGb,
      maxAllocatedStorage: props.stageConfig.databaseMaxAllocatedStorageGb,
      storageEncrypted: true,
      storageType: rds.StorageType.GP3,
      instanceType: props.stageConfig.databaseInstanceType,
      multiAz: props.stageConfig.databaseMultiAz,
      backupRetention: props.stageConfig.databaseBackupRetention,
      deletionProtection: props.stageConfig.databaseDeletionProtection,
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
      cloudwatchLogsExports: ['postgresql'],
      removalPolicy: props.stageConfig.isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.SNAPSHOT,
    });

    if (!database.secret) {
      throw new Error('RDS credentials secret was not created.');
    }

    this.credentialsSecret = database.secret;

    const databaseProxy = props.stageConfig.useRdsProxy
      ? new rds.DatabaseProxy(this, 'PostgresProxy', {
          proxyTarget: rds.ProxyTarget.fromInstance(database),
          secrets: [this.credentialsSecret],
          vpc: props.vpc,
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          requireTLS: true,
          idleClientTimeout: Duration.minutes(30),
          debugLogging: false,
        })
      : undefined;

    this.applicationConnectionTarget = databaseProxy ?? database;
    this.applicationDatabaseEndpointHost = databaseProxy?.endpoint ?? database.dbInstanceEndpointAddress;
    this.applicationConnectionTarget.connections.allowDefaultPortFrom(props.databaseClientSecurityGroup);

    new CfnOutput(this, 'DatabaseEndpoint', { value: database.dbInstanceEndpointAddress });
    new CfnOutput(this, 'DatabaseSecretArn', { value: this.credentialsSecret.secretArn });
    if (databaseProxy) {
      new CfnOutput(this, 'DatabaseProxyEndpoint', { value: databaseProxy.endpoint });
    }
  }
}
