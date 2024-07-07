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
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import 'dotenv/config';

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

      const productsTable = new dynamodb.Table(this, 'ProductsTable', {
          partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
          tableName: "Products",
      });

      const stockTable = new dynamodb.Table(this, 'StockTable', {
          partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING },
          tableName: "Stock",
      });

      const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
          topicName: 'CreateProductTopic',
      });

      createProductTopic.addSubscription(
          new subs.EmailSubscription(process.env.SUBSCRIPTION_EMAIL_1!, {
              filterPolicy: {
                  count: sns.SubscriptionFilter.numericFilter({ greaterThanOrEqualTo: 3 }),
              },
          })
      );

      createProductTopic.addSubscription(
          new subs.EmailSubscription(process.env.SUBSCRIPTION_EMAIL_2!, {
              filterPolicy: {
                  count: sns.SubscriptionFilter.numericFilter({ lessThan: 3 }),
              },
          })
      );

      const fillTables = new lambda.Function(this, 'FillTables', {
          runtime: lambda.Runtime.NODEJS_20_X,
          code: lambda.Code.fromAsset('product-service/lambda'),
          handler: 'fillDBTables.handler',
          environment: {
              PRODUCTS_TABLE: productsTable.tableName,
              STOCK_TABLE: stockTable.tableName,
          }
      });

      productsTable.grantReadWriteData(fillTables);
      stockTable.grantReadWriteData(fillTables);

      const getProductsList = new lambda.Function(this, 'GetProductsListFunction', {
          runtime: lambda.Runtime.NODEJS_20_X,
          code: lambda.Code.fromAsset('product-service/lambda'),
          handler: 'getProducts.handler',
          environment: {
              PRODUCTS_TABLE: productsTable.tableName,
              STOCK_TABLE: stockTable.tableName,
          }
      });

      productsTable.grantReadWriteData(getProductsList);
      stockTable.grantReadWriteData(getProductsList);

      const getProductById = new lambda.Function(this, 'GetProductByIdFunction', {
          runtime: lambda.Runtime.NODEJS_20_X,
          code: lambda.Code.fromAsset('product-service/lambda'),
          handler: 'getProductById.handler',
          environment: {
              PRODUCTS_TABLE: productsTable.tableName,
              STOCK_TABLE: stockTable.tableName,
          }
      });

      productsTable.grantReadWriteData(getProductById);
      stockTable.grantReadWriteData(getProductById);

      const createProduct = new lambda.Function(this, 'CreateProductFunction', {
          runtime: lambda.Runtime.NODEJS_20_X,
          code: lambda.Code.fromAsset('product-service/lambda'),
          handler: 'createProduct.handler',
          environment: {
              PRODUCTS_TABLE: productsTable.tableName,
              STOCK_TABLE: stockTable.tableName,
          }
      });

      productsTable.grantReadWriteData(createProduct);
      stockTable.grantReadWriteData(createProduct);

      const catalogBatchProcess = new lambda.Function(this, 'CatalogBatchProcessFunction', {
          runtime: lambda.Runtime.NODEJS_20_X,
          code: lambda.Code.fromAsset('product-service/lambda'),
          handler: 'catalogBatchProcess.handler',
          environment: {
              PRODUCTS_TABLE: productsTable.tableName,
              STOCKS_TABLE: stockTable.tableName,
              SNS_ARN: createProductTopic.topicArn,
          }
      });

      productsTable.grantReadWriteData(catalogBatchProcess);
      stockTable.grantReadWriteData(catalogBatchProcess);

      createProductTopic.grantPublish(catalogBatchProcess);

      const catalogItemsQueue = new sqs.Queue(this, 'catalogItemsQueue', {queueName: 'catalogItemsQueue'});

      catalogItemsQueue.grantConsumeMessages(catalogBatchProcess);

      catalogBatchProcess.addEventSourceMapping('SnsTopicBatchProcessing',{
          eventSourceArn: catalogItemsQueue.queueArn,
          batchSize: 5
      });

      const api = new apigateway.LambdaRestApi(this, 'GetProductsListApi', {
          handler: getProductsList,
          proxy: false,
      });

      const productsResource = api.root.addResource('products');
      productsResource.addMethod('GET');
      productsResource.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

      const productByIdResource = productsResource.addResource('{productId}')
      productByIdResource.addMethod('GET', new apigateway.LambdaIntegration(getProductById));
  }
}