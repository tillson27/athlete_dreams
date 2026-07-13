import { Stack, StackProps, Tags } from 'aws-cdk-lib';
import {
  GatewayVpcEndpointAwsService,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IpAddresses,
  NatProvider,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

export interface NetworkStackProps extends StackProps {
  readonly config: EnvironmentConfig;
}

export const CONTAINER_PORT = 8080;
export const DATABASE_PORT = 5432;

/**
 * Foundation network for every downstream stack: a 2-AZ VPC with public/private
 * subnets, egress via NAT (strategy from config), a free S3 gateway endpoint,
 * and the least-privilege security-group chain ALB → service → database.
 *
 * Contract for later stacks: consume `vpc`, `albSecurityGroup`,
 * `serviceSecurityGroup`, `databaseSecurityGroup` via cross-stack references.
 * The SG ingress chain is defined here so compute/data stacks only attach.
 */
export class NetworkStack extends Stack {
  public readonly vpc: Vpc;
  public readonly albSecurityGroup: SecurityGroup;
  public readonly serviceSecurityGroup: SecurityGroup;
  public readonly databaseSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { config } = props;

    const natProvider =
      config.natStrategy === 'instance'
        ? NatProvider.instanceV2({
            instanceType: InstanceType.of(
              InstanceClass.BURSTABLE4_GRAVITON,
              InstanceSize.NANO
            ),
          })
        : NatProvider.gateway();

    this.vpc = new Vpc(this, 'Vpc', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: config.natGatewayCount,
      natGatewayProvider: natProvider,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    this.vpc.addGatewayEndpoint('S3GatewayEndpoint', {
      service: GatewayVpcEndpointAwsService.S3,
    });

    this.albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Public ALB — HTTPS/HTTP from the internet.',
      allowAllOutbound: true,
    });
    this.albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      'HTTPS from anywhere'
    );
    this.albSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      'HTTP from anywhere (redirect to HTTPS at the listener)'
    );

    this.serviceSecurityGroup = new SecurityGroup(this, 'ServiceSecurityGroup', {
      vpc: this.vpc,
      description: 'Fargate service — ingress only from the ALB.',
      allowAllOutbound: true,
    });
    this.serviceSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      Port.tcp(CONTAINER_PORT),
      'App traffic from the ALB only'
    );

    this.databaseSecurityGroup = new SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'RDS PostgreSQL — ingress only from the Fargate service.',
      allowAllOutbound: false,
    });
    this.databaseSecurityGroup.addIngressRule(
      this.serviceSecurityGroup,
      Port.tcp(DATABASE_PORT),
      'PostgreSQL from the Fargate service only'
    );

    Tags.of(this).add('project', 'arc');
    Tags.of(this).add('env', config.envName);
  }
}
