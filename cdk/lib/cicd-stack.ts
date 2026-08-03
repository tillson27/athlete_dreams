import { CfnOutput, Stack, StackProps, Tags } from 'aws-cdk-lib';
import {
  Effect,
  OpenIdConnectPrincipal,
  OpenIdConnectProvider,
  PolicyStatement,
  Role,
} from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/types';

export interface CicdStackProps extends StackProps {
  readonly config: EnvironmentConfig;
}

const GITHUB_OIDC_AUDIENCE = 'sts.amazonaws.com';

// GitHub repository whose Actions workflows may assume the deploy role. The
// trust is further narrowed to these two integration/release branches only —
// no other repo or branch can mint a token that assumes this role.
const GITHUB_REPOSITORY = 'tillson27/athlete_dreams';
const DEPLOY_BRANCHES = ['nate', 'main'];

/**
 * CI/CD identity: the GitHub Actions OIDC provider plus a single least-privilege
 * deploy role the `deploy-api`/`deploy-web` workflows assume with short-lived,
 * federated credentials (no static AWS keys — `docs/aws-architecture-and-orchestration.md`
 * -> CI/CD orchestration; `docs/delivery-plan.md` -> GitHub settings).
 *
 * Deploy order: this stack is bootstrapped FIRST, before Network/Data/Api/Web,
 * so its permissions are scoped by the well-known resource NAME conventions of
 * the downstream stacks (ECR repo `arc-<env>-api`, web bucket `arc-<env>-web`,
 * the CDK bootstrap roles) rather than by cross-stack references, which would
 * invert the dependency order.
 *
 * CDK deploys run through the standard bootstrap roles: the role only needs
 * `sts:AssumeRole` on `cdk-*` (deploy/file-publishing/image-publishing/lookup),
 * so it inherits CloudFormation's least-privilege execution rather than holding
 * broad service permissions directly.
 */
export class CicdStack extends Stack {
  public readonly deployRole: Role;

  constructor(scope: Construct, id: string, props: CicdStackProps) {
    super(scope, id, props);

    const { config } = props;

    // Import the existing GitHub OIDC provider (only one per URL per account is
    // allowed; the provider already exists from an earlier deploy or test stack).
    const provider = OpenIdConnectProvider.fromOpenIdConnectProviderArn(
      this,
      'GithubActionsOidcProvider',
      `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`
    );

    // Trust condition: the token's audience must equal sts.amazonaws.com AND its
    // subject must be one of this repo's allowed branches. Both keys are required
    // — scoping the audience alone would let any repository assume the role.
    const principal = new OpenIdConnectPrincipal(provider, {
      StringEquals: {
        'token.actions.githubusercontent.com:aud': GITHUB_OIDC_AUDIENCE,
      },
      StringLike: {
        'token.actions.githubusercontent.com:sub': DEPLOY_BRANCHES.map(
          (branch) => `repo:${GITHUB_REPOSITORY}:ref:refs/heads/${branch}`
        ),
      },
    });

    this.deployRole = new Role(this, 'GithubActionsDeployRole', {
      roleName: `arc-${config.envName}-github-deploy`,
      assumedBy: principal,
      description: `GitHub Actions OIDC deploy role for the ARC ${config.envName} environment.`,
    });

    this.grantCdkBootstrapAssume();
    this.grantEcrPush(config);
    this.grantEcsRunTask(config);
    this.grantWebDeploy(config);

    // The user wires this ARN into the GitHub `test` environment as the
    // deploy-role secret/variable the workflows assume (see cdk/README.md).
    new CfnOutput(this, 'GithubDeployRoleArn', {
      value: this.deployRole.roleArn,
      description: 'IAM role ARN GitHub Actions assumes via OIDC to deploy this environment.',
      exportName: `arc-${config.envName}-github-deploy-role-arn`,
    });

    Tags.of(this).add('project', 'arc');
    Tags.of(this).add('env', config.envName);
  }

  /**
   * CloudFormation deploys go through the CDK bootstrap roles (the standard
   * `cdk deploy` path with the modern synthesizer): assume the deploy execution,
   * asset file-publishing, image-publishing, and lookup roles created by
   * `cdk bootstrap`. The account is unknown at synth (account-agnostic app), so
   * the resource is the cross-account `cdk-*` role name pattern.
   */
  private grantCdkBootstrapAssume(): void {
    this.deployRole.addToPolicy(
      new PolicyStatement({
        sid: 'AssumeCdkBootstrapRoles',
        effect: Effect.ALLOW,
        actions: ['sts:AssumeRole'],
        resources: ['arn:aws:iam::*:role/cdk-*'],
      })
    );
  }

  /**
   * ECR: authenticate to the registry (account-scoped token, no resource) and
   * push image layers/manifests to the ApiStack repository only.
   */
  private grantEcrPush(config: EnvironmentConfig): void {
    this.deployRole.addToPolicy(
      new PolicyStatement({
        sid: 'EcrAuth',
        effect: Effect.ALLOW,
        actions: ['ecr:GetAuthorizationToken'],
        resources: ['*'],
      })
    );

    this.deployRole.addToPolicy(
      new PolicyStatement({
        sid: 'EcrPushToApiRepository',
        effect: Effect.ALLOW,
        actions: [
          'ecr:BatchCheckLayerAvailability',
          'ecr:GetDownloadUrlForLayer',
          'ecr:BatchGetImage',
          'ecr:InitiateLayerUpload',
          'ecr:UploadLayerPart',
          'ecr:CompleteLayerUpload',
          'ecr:PutImage',
        ],
        resources: [
          `arn:aws:ecr:${config.region}:*:repository/arc-${config.envName}-api`,
        ],
      })
    );
  }

  /**
   * ECS: run the migration/seed task definitions (revisions) and poll them.
   * The task-definition family CloudFormation generates for the ApiStack strips
   * the stack-name hyphens but preserves case, so the family prefix is
   * `Arc<env>Api` (e.g. `ArctestApiMigrationTask...`). `iam:PassRole` is limited
   * to the ECS-assumable Api-stack roles (physical names keep the `Arc-<env>-Api-`
   * prefix) so the workflow can only launch ARC tasks, not arbitrary ones.
   */
  private grantEcsRunTask(config: EnvironmentConfig): void {
    this.deployRole.addToPolicy(
      new PolicyStatement({
        sid: 'EcsRunAndDescribeTasks',
        effect: Effect.ALLOW,
        actions: ['ecs:RunTask', 'ecs:DescribeTasks', 'ecs:ListTasks'],
        resources: [
          `arn:aws:ecs:${config.region}:*:task-definition/Arc${config.envName}Api*`,
          `arn:aws:ecs:${config.region}:*:task/*`,
        ],
        conditions: {
          ArnLike: {
            'ecs:cluster': `arn:aws:ecs:${config.region}:*:cluster/Arc-${config.envName}-Api-*`,
          },
        },
      })
    );

    this.deployRole.addToPolicy(
      new PolicyStatement({
        sid: 'PassEcsTaskRoles',
        effect: Effect.ALLOW,
        actions: ['iam:PassRole'],
        resources: [`arn:aws:iam::*:role/Arc-${config.envName}-Api-*`],
        conditions: {
          StringEquals: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' },
        },
      })
    );
  }

  /**
   * Web deploy: mirror the static export to the WebStack bucket (`--delete`
   * needs list+delete) and invalidate the CloudFront distribution. The
   * distribution is identified at deploy time (workflow passes its id); the
   * grant is account-scoped to CloudFront invalidations only.
   */
  private grantWebDeploy(config: EnvironmentConfig): void {
    this.deployRole.addToPolicy(
      new PolicyStatement({
        sid: 'S3SyncWebBucket',
        effect: Effect.ALLOW,
        actions: [
          's3:ListBucket',
          's3:GetBucketLocation',
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
        ],
        resources: [
          `arn:aws:s3:::arc-${config.envName}-web`,
          `arn:aws:s3:::arc-${config.envName}-web/*`,
        ],
      })
    );

    this.deployRole.addToPolicy(
      new PolicyStatement({
        sid: 'CloudFrontInvalidate',
        effect: Effect.ALLOW,
        actions: [
          'cloudfront:CreateInvalidation',
          'cloudfront:GetInvalidation',
          'cloudfront:ListDistributions',
        ],
        resources: ['*'],
      })
    );
  }
}
