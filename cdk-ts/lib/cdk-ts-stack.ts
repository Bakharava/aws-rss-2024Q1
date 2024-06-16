import * as cdk from 'aws-cdk-lib';
import {
  aws_cloudfront as cf,
  aws_s3 as s3,
  aws_s3_deployment as s3d,
  aws_iam as iam,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CdkTsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const CFOriginAccessIdentity = new cf.OriginAccessIdentity(
        this,
        "BakharavaUserCFOAI",
        {
          comment: "OriginAccessIdentity for BakharavaUserCF",
        }
    );

    const BakharavaBucket = new s3.Bucket(this, "BakharavaBucket", {
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      bucketName: "bakharava-bucket",
      publicReadAccess: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: false,
      websiteIndexDocument: "index.html",
    });

    BakharavaBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: ["s3:GetObject"],
          resources: [BakharavaBucket.arnForObjects("*")],
          principals: [
            new iam.CanonicalUserPrincipal(
                CFOriginAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
            ),
          ],
        })
    );

    const distribution = new cf.CloudFrontWebDistribution(
        this,
        "SolidadosCloudfrontDistribution",
        {
          originConfigs: [
            {
              s3OriginSource: {
                s3BucketSource: BakharavaBucket,
                originAccessIdentity: CFOriginAccessIdentity,
              },
              behaviors: [{ isDefaultBehavior: true }],
            },
          ],
        }
    );

    new s3d.BucketDeployment(this, "SolidadosBucketDeployment", {
      destinationBucket: BakharavaBucket,
      distribution,
      distributionPaths: ["/*"],
      sources: [s3d.Source.asset("../dist")],
    });

      const getProductsList = new lambda.Function(this, 'GetProductsListFunction', {
          runtime: lambda.Runtime.NODEJS_20_X,
          code: lambda.Code.fromAsset('product-service/lambda'),
          handler: 'getProducts.handler',
      });

      const getProductById = new lambda.Function(this, 'GetProductByIdFunction', {
          runtime: lambda.Runtime.NODEJS_20_X,
          code: lambda.Code.fromAsset('product-service/lambda'),
          handler: 'getProductById.handler',
      });

      const api = new apigateway.LambdaRestApi(this, 'GetProductsListApi', {
          handler: getProductsList,
          proxy: false,
      });

      const productsResource = api.root.addResource('products');
      productsResource.addMethod('GET');

      const productByIdResource = productsResource.addResource('{productId}')
      productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductById))


  }
}