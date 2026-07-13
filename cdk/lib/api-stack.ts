import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { ISecurityGroup, IVpc, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Repository, TagStatus } from 'aws-cdk-lib/aws-ecr';
import {
  Alarm,
  ComparisonOperator,
  TreatMissingData,
} from 'aws-cdk-lib/aws-cloudwatch';
import {
  Cluster,
  ContainerImage,
  ContainerInsights,
  CpuArchitecture,
  FargateTaskDefinition,
  LogDriver,
  OperatingSystemFamily,
  Secret as EcsSecret,
} from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import {
  ApplicationLoadBalancer,
  ApplicationProtocol,
  HttpCodeElb,
  Protocol,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { DatabaseInstance } from 'aws-cdk-lib/aws-rds';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';
import { CONTAINER_PORT } from './network-stack';

export interface ApiStackProps extends StackProps {
  readonly config: EnvironmentConfig;
  readonly vpc: IVpc;
  readonly albSecurityGroup: ISecurityGroup;
  readonly serviceSecurityGroup: ISecurityGroup;
  readonly dbInstance: DatabaseInstance;
  readonly dbSecret: ISecret;
  readonly databaseName: string;
  /**
   * ECR tag the service + migration/seed tasks run. `deploy-api.yml` passes the
   * git SHA of the image it just pushed (`-c imageTag=<sha>`), so each deploy
   * pins an immutable tag and CloudFormation detects the change (a mutable
   * `latest` would leave the task definition unchanged and ECS would not roll).
   * Defaults to `latest` for a first bring-up before any SHA exists.
   */
  readonly imageTag?: string;
}

const LOG_RETENTION_BY_DAYS: Record<number, RetentionDays> = {
  14: RetentionDays.TWO_WEEKS,
  30: RetentionDays.ONE_MONTH,
};

const DEFAULT_IMAGE_TAG = 'latest';

/**
 * API compute: an ECR repo, a Graviton (arm64) Fargate service behind a public
 * ALB with CPU-target autoscaling and a deployment circuit breaker that rolls a
 * bad release back, plus discrete migration and seed RunTask definitions that
 * share the API image (never run on container boot — Context §12).
 *
 * The app reads a single `DATABASE_URL`; to keep the DB password flowing through
 * the ECS secrets mechanism (never plaintext in the template) without changing
 * app code, every task's container assembles `DATABASE_URL` at start from the
 * secret-injected DB fields, then execs the real command.
 *
 * Hardening handoff: this step keeps synth credential-free, so the ALB listener
 * is plain HTTP. TLS (ACM), the CloudFront front door, and WAF land in steps
 * 15/16 (`docs/aws-architecture-and-orchestration.md`).
 */
export class ApiStack extends Stack {
  public readonly repository: Repository;
  public readonly service: ApplicationLoadBalancedFargateService;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { config, vpc, albSecurityGroup, serviceSecurityGroup, dbInstance, dbSecret, databaseName } =
      props;
    const imageTag = props.imageTag ?? DEFAULT_IMAGE_TAG;

    this.repository = new Repository(this, 'ApiRepository', {
      repositoryName: `arc-${config.envName}-api`,
      imageScanOnPush: true,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          description: 'Expire untagged images to cap registry storage.',
          tagStatus: TagStatus.UNTAGGED,
          maxImageAge: Duration.days(14),
        },
      ],
    });

    const jwtSecret = new Secret(this, 'JwtSecret', {
      secretName: `arc/${config.envName}/api/jwt`,
      description: 'HS256 signing secret for API access tokens.',
      generateSecretString: {
        passwordLength: 64,
        excludePunctuation: true,
      },
    });

    const logGroup = new LogGroup(this, 'ApiLogGroup', {
      logGroupName: `/arc/${config.envName}/api`,
      retention: LOG_RETENTION_BY_DAYS[config.logRetentionDays] ?? RetentionDays.TWO_WEEKS,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const cluster = new Cluster(this, 'Cluster', {
      vpc,
      containerInsightsV2: ContainerInsights.ENABLED,
    });

    // Build the ALB with the NetworkStack ALB security group (which already
    // permits 80/443 from the internet and whose egress the service SG accepts).
    // Passing it in with `openListener: false` stops the ecs-patterns construct
    // from mutating the shared service SG, which would create a Network⇄Api
    // dependency cycle.
    const loadBalancer = new ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });

    const image = ContainerImage.fromEcrRepository(this.repository, imageTag);

    const containerEnvironment: Record<string, string> = {
      NODE_ENV: config.nodeEnv,
      LOG_LEVEL: config.logLevel,
      PORT: String(CONTAINER_PORT),
      CORS_ALLOWED_ORIGINS: buildCorsAllowedOrigins(config),
    };

    const containerSecrets: Record<string, EcsSecret> = {
      JWT_SECRET: EcsSecret.fromSecretsManager(jwtSecret),
      DATABASE_USER: EcsSecret.fromSecretsManager(dbSecret, 'username'),
      DATABASE_PASSWORD: EcsSecret.fromSecretsManager(dbSecret, 'password'),
      DATABASE_HOST: EcsSecret.fromSecretsManager(dbSecret, 'host'),
      DATABASE_PORT: EcsSecret.fromSecretsManager(dbSecret, 'port'),
    };

    const databaseUrlExport =
      `export DATABASE_URL="postgresql://$DATABASE_USER:$DATABASE_PASSWORD@` +
      `$DATABASE_HOST:$DATABASE_PORT/${databaseName}?schema=public"`;
    const serverCommand = `${databaseUrlExport} && exec node dist/index.js`;

    this.service = new ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      loadBalancer,
      openListener: false,
      cpu: config.serviceCpu,
      memoryLimitMiB: config.serviceMemoryMib,
      desiredCount: config.desiredCount,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.ARM64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
      taskSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [serviceSecurityGroup],
      assignPublicIp: false,
      protocol: ApplicationProtocol.HTTP,
      // Zero-downtime rolling deploy: keep the full desired count healthy while
      // new tasks come up (0% would let the service drop below desiredCount).
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      // Prisma opens its pool on boot; give tasks time before ALB health checks.
      healthCheckGracePeriod: Duration.seconds(60),
      circuitBreaker: { rollback: true },
      taskImageOptions: {
        image,
        containerName: 'api',
        containerPort: CONTAINER_PORT,
        entryPoint: ['/bin/sh', '-c'],
        command: [serverCommand],
        environment: containerEnvironment,
        secrets: containerSecrets,
        logDriver: LogDriver.awsLogs({ streamPrefix: 'api', logGroup }),
      },
    });

    this.service.targetGroup.configureHealthCheck({
      path: '/v1/health/ready',
      protocol: Protocol.HTTP,
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
      interval: Duration.seconds(15),
      timeout: Duration.seconds(5),
      healthyHttpCodes: '200',
    });

    this.service.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '15');

    const scaling = this.service.service.autoScaleTaskCount({
      minCapacity: config.minCapacity,
      maxCapacity: config.maxCapacity,
    });
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: config.cpuTargetUtilizationPercent,
      scaleInCooldown: Duration.seconds(120),
      scaleOutCooldown: Duration.seconds(60),
    });

    const runTaskDefaults = {
      cpu: config.serviceCpu,
      memoryLimitMiB: config.serviceMemoryMib,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.ARM64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
    };

    const migrationTask = this.createRunTask('MigrationTask', {
      ...runTaskDefaults,
      image,
      logGroup,
      environment: containerEnvironment,
      secrets: containerSecrets,
      databaseUrlExport,
      innerCommand: 'npx prisma migrate deploy',
    });

    const seedTask = this.createRunTask('SeedTask', {
      ...runTaskDefaults,
      image,
      logGroup,
      environment: containerEnvironment,
      secrets: containerSecrets,
      databaseUrlExport,
      innerCommand: 'npx prisma db seed',
    });

    this.addAlarms(dbInstance);
    this.exportRunTaskWiring(cluster, serviceSecurityGroup, vpc, migrationTask, seedTask);

    Tags.of(this).add('project', 'arc');
    Tags.of(this).add('env', config.envName);
  }

  /**
   * Everything `deploy-api.yml` needs to launch the migration/seed RunTasks with
   * `aws ecs run-task` (and the runbook to do it by hand): the cluster, the two
   * task-definition families, the private subnets, and the service security
   * group. Emitting them as outputs keeps the workflow free of brittle name
   * guessing — it reads these via `aws cloudformation describe-stacks`.
   */
  private exportRunTaskWiring(
    cluster: Cluster,
    serviceSecurityGroup: ISecurityGroup,
    vpc: IVpc,
    migrationTask: FargateTaskDefinition,
    seedTask: FargateTaskDefinition
  ): void {
    const privateSubnetIds = vpc.selectSubnets({
      subnetType: SubnetType.PRIVATE_WITH_EGRESS,
    }).subnetIds;

    const outputs: Record<string, string> = {
      EcsClusterName: cluster.clusterName,
      MigrationTaskDefinitionArn: migrationTask.taskDefinitionArn,
      SeedTaskDefinitionArn: seedTask.taskDefinitionArn,
      ServiceSecurityGroupId: serviceSecurityGroup.securityGroupId,
      PrivateSubnetIds: privateSubnetIds.join(','),
      EcrRepositoryUri: this.repository.repositoryUri,
    };

    for (const [key, value] of Object.entries(outputs)) {
      new CfnOutput(this, key, { value });
    }
  }

  private createRunTask(
    id: string,
    props: {
      cpu: number;
      memoryLimitMiB: number;
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture;
        operatingSystemFamily: OperatingSystemFamily;
      };
      image: ContainerImage;
      logGroup: LogGroup;
      environment: Record<string, string>;
      secrets: Record<string, EcsSecret>;
      databaseUrlExport: string;
      innerCommand: string;
    }
  ): FargateTaskDefinition {
    const taskDefinition = new FargateTaskDefinition(this, id, {
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      runtimePlatform: props.runtimePlatform,
    });

    taskDefinition.addContainer('task', {
      image: props.image,
      entryPoint: ['/bin/sh', '-c'],
      command: [`${props.databaseUrlExport} && exec ${props.innerCommand}`],
      environment: props.environment,
      secrets: props.secrets,
      logging: LogDriver.awsLogs({
        streamPrefix: id.toLowerCase(),
        logGroup: props.logGroup,
      }),
    });

    return taskDefinition;
  }

  private addAlarms(dbInstance: DatabaseInstance): void {
    const loadBalancer = this.service.loadBalancer;

    new Alarm(this, 'Alb5xxAlarm', {
      alarmDescription: 'ALB is returning 5xx responses.',
      metric: loadBalancer.metrics.httpCodeElb(HttpCodeElb.ELB_5XX_COUNT, {
        period: Duration.minutes(1),
      }),
      threshold: 5,
      evaluationPeriods: 3,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });

    new Alarm(this, 'UnhealthyTargetsAlarm', {
      alarmDescription: 'One or more API targets are failing health checks.',
      metric: this.service.targetGroup.metrics.unhealthyHostCount({
        period: Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 3,
      comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });

    new Alarm(this, 'ServiceCpuAlarm', {
      alarmDescription: 'API service CPU utilization is sustained high.',
      metric: this.service.service.metricCpuUtilization({ period: Duration.minutes(5) }),
      threshold: 85,
      evaluationPeriods: 3,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });

    new Alarm(this, 'ServiceMemoryAlarm', {
      alarmDescription: 'API service memory utilization is sustained high.',
      metric: this.service.service.metricMemoryUtilization({ period: Duration.minutes(5) }),
      threshold: 85,
      evaluationPeriods: 3,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });

    new Alarm(this, 'DatabaseFreeStorageAlarm', {
      alarmDescription: 'RDS free storage space is running low.',
      metric: dbInstance.metricFreeStorageSpace({ period: Duration.minutes(5) }),
      threshold: 2 * 1024 * 1024 * 1024,
      evaluationPeriods: 3,
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });

    new Alarm(this, 'DatabaseCpuAlarm', {
      alarmDescription: 'RDS CPU utilization is sustained high.',
      metric: dbInstance.metricCPUUtilization({ period: Duration.minutes(5) }),
      threshold: 85,
      evaluationPeriods: 3,
      comparisonOperator: ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.NOT_BREACHING,
    });
  }
}

/**
 * The client is served from the same custom domain(s); allow those origins so
 * browser calls to `/v1/*` pass the API's CORS allowlist.
 */
function buildCorsAllowedOrigins(config: EnvironmentConfig): string {
  const origins = [
    `https://${config.domain.clientDomain}`,
    config.domain.clientAlternateDomain
      ? `https://${config.domain.clientAlternateDomain}`
      : undefined,
  ].filter((origin): origin is string => Boolean(origin));
  return origins.join(',');
}
