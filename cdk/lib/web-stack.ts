import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { Certificate, CertificateValidation, type ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  Function as CloudFrontFunction,
  FunctionCode,
  FunctionEventType,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  PriceClass as CloudFrontPriceClass,
  ViewerProtocolPolicy,
  type BehaviorOptions,
  type IOrigin,
} from 'aws-cdk-lib/aws-cloudfront';
import {
  LoadBalancerV2Origin,
  S3BucketOrigin,
} from 'aws-cdk-lib/aws-cloudfront-origins';
import { IApplicationLoadBalancer } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {
  ARecord,
  AaaaRecord,
  HostedZone,
  RecordTarget,
  type IHostedZone,
} from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  ObjectOwnership,
} from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig, PriceClass } from '../config/types';

export interface WebStackProps extends StackProps {
  readonly config: EnvironmentConfig;
  readonly loadBalancer: IApplicationLoadBalancer;
}

const PRICE_CLASS_BY_NAME: Record<PriceClass, CloudFrontPriceClass> = {
  PriceClass_100: CloudFrontPriceClass.PRICE_CLASS_100,
  PriceClass_200: CloudFrontPriceClass.PRICE_CLASS_200,
  PriceClass_All: CloudFrontPriceClass.PRICE_CLASS_ALL,
};

const API_PATH_PATTERN = '/v1/*';
const STRIPE_WEBHOOK_PATH_PATTERN = '/v1/webhooks/stripe';
const NOT_FOUND_PAGE = '/404.html';
const STATIC_ROUTE_REWRITE_CODE = `
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri === '/' || uri === '/opengraph-image') {
    return request;
  }

  if (/^\\/athletes\\/[^\\/]+(?:\\/manage)?\\/?$/.test(uri)) {
    request.uri = '/athletes.html';
    return request;
  }

  if (/\\/[^\\/]+\\.[^\\/]+$/.test(uri)) {
    return request;
  }

  if (uri.charAt(uri.length - 1) === '/') {
    uri = uri.slice(0, -1);
  }

  request.uri = uri + '.html';
  return request;
}
`;

/**
 * Single-domain front door: one CloudFront distribution serves the static
 * client from a private S3 bucket (Origin Access Control) and routes the API
 * paths to the ApiStack ALB, so the browser talks to one origin, CORS drops
 * away, and Stripe gets a stable webhook host
 * (`docs/aws-architecture-and-orchestration.md` → Front door).
 *
 * Hardening handoff: step 14 left the ALB on plain HTTP, so the API behaviors
 * use an HTTP origin protocol for now. Step 16 fronts the ALB with its own
 * ACM cert and flips this origin (and the ALB listener) to HTTPS.
 *
 * Credential-free synth: the hosted zone is imported by attributes from config
 * (never `fromLookup`); the placeholder `hostedZoneId` must be replaced with the
 * real zone id before deploying (see `DomainConfig`).
 *
 * Temporary-URL mode: when `config.domain` is omitted the distribution serves on
 * its CloudFront default domain (`https://<id>.cloudfront.net`) with the default
 * viewer certificate — no Route 53 zone, ACM cert, or alias records — so the
 * environment deploys before any DNS exists in Route 53 (see `EnvironmentConfig`).
 */
export class WebStack extends Stack {
  public readonly bucket: Bucket;
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const { config, loadBalancer } = props;
    const { domain } = config;

    this.bucket = new Bucket(this, 'SiteBucket', {
      bucketName: `arc-${config.envName}-web`,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Site content is redeployable from source, so lean envs tear the bucket
      // down with the stack; retention-first envs (prod) keep it. Reuses the
      // per-env destroy/retain signal rather than adding a parallel web knob.
      removalPolicy:
        config.rdsRemovalPolicy === 'snapshot'
          ? RemovalPolicy.RETAIN
          : RemovalPolicy.DESTROY,
      autoDeleteObjects: config.rdsRemovalPolicy !== 'snapshot',
    });

    const domainNames = domain
      ? [domain.clientDomain, domain.clientAlternateDomain].filter(
          (name): name is string => Boolean(name)
        )
      : [];

    let certificate: ICertificate | undefined;
    let hostedZone: IHostedZone | undefined;
    if (domain) {
      hostedZone = HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
        hostedZoneId: domain.hostedZoneId,
        zoneName: domain.zoneName,
      });

      certificate = new Certificate(this, 'SiteCertificate', {
        domainName: domain.clientDomain,
        subjectAlternativeNames: domain.clientAlternateDomain
          ? [domain.clientAlternateDomain]
          : undefined,
        validation: CertificateValidation.fromDns(hostedZone),
      });
    }

    const apiBehavior = this.buildApiBehavior(loadBalancer);
    const staticRouteRewriteFunction = new CloudFrontFunction(this, 'StaticRouteRewriteFunction', {
      code: FunctionCode.fromInline(STATIC_ROUTE_REWRITE_CODE),
    });

    this.distribution = new Distribution(this, 'Distribution', {
      comment: `ARC front door (${config.envName}).`,
      priceClass: PRICE_CLASS_BY_NAME[config.priceClass],
      domainNames: domainNames.length > 0 ? domainNames : undefined,
      certificate,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        compress: true,
        functionAssociations: [
          {
            function: staticRouteRewriteFunction,
            eventType: FunctionEventType.VIEWER_REQUEST,
          },
        ],
      },
      additionalBehaviors: {
        [API_PATH_PATTERN]: apiBehavior,
        [STRIPE_WEBHOOK_PATH_PATTERN]: apiBehavior,
      },
      // The static export ships 404.html; map S3's private-object 403/404 to it
      // so client-side routes and unknown paths render the app's not-found page.
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: NOT_FOUND_PAGE,
          ttl: Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: NOT_FOUND_PAGE,
          ttl: Duration.minutes(5),
        },
      ],
    });

    if (domain && hostedZone) {
      const aliasTarget = RecordTarget.fromAlias(new CloudFrontTarget(this.distribution));
      for (const domainName of domainNames) {
        const recordScope = domainName === domain.clientDomain ? 'Primary' : 'Alternate';
        new ARecord(this, `${recordScope}AliasRecord`, {
          zone: hostedZone,
          recordName: domainName,
          target: aliasTarget,
        });
        new AaaaRecord(this, `${recordScope}AliasRecordIpv6`, {
          zone: hostedZone,
          recordName: domainName,
          target: aliasTarget,
        });
      }
    }

    new CfnOutput(this, 'WebBucketName', { value: this.bucket.bucketName });
    new CfnOutput(this, 'DistributionId', { value: this.distribution.distributionId });
    new CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
    });
    new CfnOutput(this, 'SiteUrl', {
      value: domain
        ? `https://${domain.clientDomain}`
        : `https://${this.distribution.distributionDomainName}`,
    });

    Tags.of(this).add('project', 'arc');
    Tags.of(this).add('env', config.envName);
  }

  /**
   * API + Stripe-webhook behavior: forward everything to the ALB unaltered so
   * the raw Stripe webhook body survives (all viewer headers except Host, all
   * methods, no caching). HTTP origin protocol until the ALB gains TLS (step 16).
   */
  private buildApiBehavior(loadBalancer: IApplicationLoadBalancer): BehaviorOptions {
    const origin: IOrigin = new LoadBalancerV2Origin(loadBalancer, {
      protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
    });

    return {
      origin,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      compress: false,
    };
  }
}
