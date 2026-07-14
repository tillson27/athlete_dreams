import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import type { StageConfig } from './config';

export interface NetworkStackProps extends StackProps {
  readonly stageConfig: StageConfig;
}

export class NetworkStack extends Stack {
  readonly apiServiceSecurityGroup: ec2.SecurityGroup;
  readonly clientServiceSecurityGroup: ec2.SecurityGroup;
  readonly loadBalancerSecurityGroup: ec2.SecurityGroup;
  readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.80.0.0/16'),
      maxAzs: 2,
      natGateways: props.stageConfig.natGateways,
      subnetConfiguration: [
        { name: 'public-alb', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'private-app', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'private-database', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 28 },
      ],
    });

    this.apiServiceSecurityGroup = new ec2.SecurityGroup(this, 'ApiServiceSecurityGroup', {
      allowAllOutbound: true,
      description: 'Security group for FAD API ECS tasks',
      vpc: this.vpc,
    });
    this.clientServiceSecurityGroup = new ec2.SecurityGroup(this, 'ClientServiceSecurityGroup', {
      allowAllOutbound: true,
      description: 'Security group for FAD Next ECS tasks',
      vpc: this.vpc,
    });
    this.loadBalancerSecurityGroup = new ec2.SecurityGroup(this, 'LoadBalancerSecurityGroup', {
      allowAllOutbound: true,
      description: 'Security group for the public FAD application load balancer',
      vpc: this.vpc,
    });
    this.loadBalancerSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80));
    this.apiServiceSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      ec2.Port.tcp(4000)
    );
    this.clientServiceSecurityGroup.addIngressRule(
      this.loadBalancerSecurityGroup,
      ec2.Port.tcp(3000)
    );

    new CfnOutput(this, 'VpcId', { value: this.vpc.vpcId });
    new CfnOutput(this, 'ApiServiceSecurityGroupId', {
      value: this.apiServiceSecurityGroup.securityGroupId,
    });
    new CfnOutput(this, 'ClientServiceSecurityGroupId', {
      value: this.clientServiceSecurityGroup.securityGroupId,
    });
    new CfnOutput(this, 'LoadBalancerSecurityGroupId', {
      value: this.loadBalancerSecurityGroup.securityGroupId,
    });
  }
}
