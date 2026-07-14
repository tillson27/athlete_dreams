import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'node:path';
import type { StageConfig } from './config';

const API_PORT = 4000;
const CLIENT_PORT = 3000;

export interface AppStackProps extends StackProps {
  readonly apiServiceSecurityGroup: ec2.ISecurityGroup;
  readonly clientServiceSecurityGroup: ec2.ISecurityGroup;
  readonly loadBalancerSecurityGroup: ec2.ISecurityGroup;
  readonly databaseCredentialsSecret: secretsmanager.ISecret;
  readonly databaseEndpointHost: string;
  readonly databaseName: string;
  readonly databasePort: string;
  readonly stageConfig: StageConfig;
  readonly vpc: ec2.IVpc;
}

export class AppStack extends Stack {
  readonly apiLogGroup: logs.LogGroup;
  readonly clientLogGroup: logs.LogGroup;
  readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const repoRoot = path.resolve(__dirname, '..', '..');
    const cluster = new ecs.Cluster(this, 'Cluster', {
      clusterName: `fad-${props.stageConfig.stageName}`,
      containerInsightsV2: ecs.ContainerInsights.ENABLED,
      vpc: props.vpc,
    });

    this.apiLogGroup = this.createLogGroup('ApiLogGroup', `/fad/${props.stageConfig.stageName}/api`, props);
    this.clientLogGroup = this.createLogGroup(
      'ClientLogGroup',
      `/fad/${props.stageConfig.stageName}/client`,
      props
    );

    const apiImageAsset = new ecrAssets.DockerImageAsset(this, 'ApiImage', {
      directory: repoRoot,
      file: 'app/Dockerfile',
      platform: ecrAssets.Platform.LINUX_AMD64,
    });
    const clientImageAsset = new ecrAssets.DockerImageAsset(this, 'ClientImage', {
      directory: repoRoot,
      file: 'client/Dockerfile',
      platform: ecrAssets.Platform.LINUX_AMD64,
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'PublicLoadBalancer', {
      deletionProtection: props.stageConfig.isProduction,
      internetFacing: true,
      securityGroup: props.loadBalancerSecurityGroup,
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    this.loadBalancer.setAttribute('routing.http.drop_invalid_header_fields.enabled', 'true');

    const apiTargetGroup = new elbv2.ApplicationTargetGroup(this, 'ApiTargetGroup', {
      healthCheck: {
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
        path: '/v1/health',
        timeout: Duration.seconds(5),
      },
      port: API_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc: props.vpc,
    });

    const clientTargetGroup = new elbv2.ApplicationTargetGroup(this, 'ClientTargetGroup', {
      healthCheck: {
        healthyHttpCodes: '200',
        interval: Duration.seconds(30),
        path: '/health',
        timeout: Duration.seconds(5),
      },
      port: CLIENT_PORT,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      vpc: props.vpc,
    });

    const listener = this.loadBalancer.addListener('HttpListener', {
      defaultAction: elbv2.ListenerAction.forward([clientTargetGroup]),
      open: true,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });
    listener.addTargetGroups('ApiRoutingRule', {
      conditions: [elbv2.ListenerCondition.pathPatterns(['/v1/*'])],
      priority: 10,
      targetGroups: [apiTargetGroup],
    });

    const jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      generateSecretString: {
        excludePunctuation: true,
        generateStringKey: 'JWT_SECRET',
        passwordLength: 64,
        secretStringTemplate: JSON.stringify({}),
      },
      secretName: `/fad/${props.stageConfig.stageName}/api/jwt`,
    });

    this.createApiService({
      apiImageAsset,
      apiTargetGroup,
      cluster,
      jwtSecret,
      props,
    });

    this.createClientService({
      clientImageAsset,
      clientTargetGroup,
      cluster,
      props,
    });

    new CfnOutput(this, 'AlbDnsName', { value: this.loadBalancer.loadBalancerDnsName });
    new CfnOutput(this, 'ApiLogGroupName', { value: this.apiLogGroup.logGroupName });
    new CfnOutput(this, 'ClientLogGroupName', { value: this.clientLogGroup.logGroupName });
  }

  private createApiService(options: {
    readonly apiImageAsset: ecrAssets.DockerImageAsset;
    readonly apiTargetGroup: elbv2.ApplicationTargetGroup;
    readonly cluster: ecs.Cluster;
    readonly jwtSecret: secretsmanager.ISecret;
    readonly props: AppStackProps;
  }): ecs.FargateService {
    const { apiImageAsset, apiTargetGroup, cluster, jwtSecret, props } = options;
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDefinition', {
      cpu: props.stageConfig.apiCpu,
      memoryLimitMiB: props.stageConfig.apiMemoryMiB,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    taskDefinition.addContainer('ApiContainer', {
      environment: {
        CORS_ALLOWED_ORIGINS: '',
        DB_HOST: props.databaseEndpointHost,
        DB_NAME: props.databaseName,
        DB_PORT: props.databasePort,
        DB_SSLMODE: 'require',
        JWT_ACCESS_TOKEN_TTL_SECONDS: '3600',
        LOG_LEVEL: props.stageConfig.isProduction ? 'info' : 'debug',
        NODE_ENV: 'production',
        PORT: String(API_PORT),
      },
      image: ecs.ContainerImage.fromDockerImageAsset(apiImageAsset),
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.apiLogGroup, streamPrefix: 'api' }),
      portMappings: [{ containerPort: API_PORT }],
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.databaseCredentialsSecret, 'password'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(props.databaseCredentialsSecret, 'username'),
        JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret, 'JWT_SECRET'),
      },
    });

    const service = new ecs.FargateService(this, 'ApiService', {
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      cluster,
      desiredCount: props.stageConfig.apiDesiredCount,
      enableECSManagedTags: true,
      healthCheckGracePeriod: Duration.seconds(60),
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
      securityGroups: [props.apiServiceSecurityGroup],
      taskDefinition,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    service.attachToApplicationTargetGroup(apiTargetGroup);
    this.configureCpuScaling('ApiCpuScaling', service, props.stageConfig.apiMinCapacity, props.stageConfig.apiMaxCapacity);
    return service;
  }

  private createClientService(options: {
    readonly clientImageAsset: ecrAssets.DockerImageAsset;
    readonly clientTargetGroup: elbv2.ApplicationTargetGroup;
    readonly cluster: ecs.Cluster;
    readonly props: AppStackProps;
  }): void {
    const { clientImageAsset, clientTargetGroup, cluster, props } = options;
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ClientTaskDefinition', {
      cpu: props.stageConfig.clientCpu,
      memoryLimitMiB: props.stageConfig.clientMemoryMiB,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    taskDefinition.addContainer('ClientContainer', {
      environment: {
        API_BASE_URL: `http://${this.loadBalancer.loadBalancerDnsName}`,
        NODE_ENV: 'production',
        PORT: String(CLIENT_PORT),
      },
      image: ecs.ContainerImage.fromDockerImageAsset(clientImageAsset),
      logging: ecs.LogDrivers.awsLogs({ logGroup: this.clientLogGroup, streamPrefix: 'client' }),
      portMappings: [{ containerPort: CLIENT_PORT }],
    });

    const service = new ecs.FargateService(this, 'ClientService', {
      assignPublicIp: false,
      circuitBreaker: { rollback: true },
      cluster,
      desiredCount: props.stageConfig.clientDesiredCount,
      enableECSManagedTags: true,
      healthCheckGracePeriod: Duration.seconds(60),
      maxHealthyPercent: 200,
      minHealthyPercent: 100,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
      securityGroups: [props.clientServiceSecurityGroup],
      taskDefinition,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });
    service.attachToApplicationTargetGroup(clientTargetGroup);
    this.configureCpuScaling(
      'ClientCpuScaling',
      service,
      props.stageConfig.clientMinCapacity,
      props.stageConfig.clientMaxCapacity
    );
  }

  private configureCpuScaling(
    id: string,
    service: ecs.FargateService,
    minCapacity: number,
    maxCapacity: number
  ): void {
    const scaling = service.autoScaleTaskCount({ maxCapacity, minCapacity });
    scaling.scaleOnCpuUtilization(id, {
      scaleInCooldown: Duration.seconds(120),
      scaleOutCooldown: Duration.seconds(60),
      targetUtilizationPercent: 60,
    });
  }

  private createLogGroup(id: string, logGroupName: string, props: AppStackProps): logs.LogGroup {
    return new logs.LogGroup(this, id, {
      logGroupName,
      removalPolicy: props.stageConfig.isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      retention: props.stageConfig.logRetention,
    });
  }
}
