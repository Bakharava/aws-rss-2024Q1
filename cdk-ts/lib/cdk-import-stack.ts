import * as cdk from 'aws-cdk-lib';
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3notification from 'aws-cdk-lib/aws-s3-notifications';
import { BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";
import 'dotenv/config';


export class CdkImportStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const importBucket = new s3.Bucket(this, "ImportFileBucket", {
            autoDeleteObjects: true,
            cors: [
                {
                    maxAge: 60 * 60,
                    allowedOrigins: ['*'],
                    allowedMethods: [s3.HttpMethods.PUT],
                    allowedHeaders: ['*'],
                },
            ],
            bucketName: "bakharava-import-bucket",
            blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const importProductsFile = new lambda.Function(this, 'ImportProductsFileFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('import-service/lambda'),
            handler: 'importProductsFile.handler',
            environment: {
                BUCKET_NAME: importBucket.bucketName,
                BUCKET_FOLDER_NAME: "uploaded",
                SQS_QUEUE_URL: process.env.SQS_QUEUE_URL!,
            }
        });

        const parseProductsFile = new lambda.Function(this, 'ParseProductsFileFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            code: lambda.Code.fromAsset('import-service/lambda'),
            handler: 'importFileParser.handler',
            environment: {
                BUCKET_NAME: importBucket.bucketName,
                BUCKET_FOLDER_NAME: "uploaded",
                SQS_QUEUE_URL: process.env.SQS_QUEUE_URL!,
            }
        });

        importProductsFile.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:PutObject'],
            resources: [importBucket.bucketArn + "/*"],
        }))

        parseProductsFile.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 'sqs:SendMessage'],
            resources: [importBucket.bucketArn + "/*", process.env.SNS_ARN!],
        }))

        const api = new apigateway.RestApi(this, 'ImportApi', {
            cloudWatchRole: true,
            defaultCorsPreflightOptions: {
                allowOrigins: apigateway.Cors.ALL_ORIGINS,
                allowMethods: apigateway.Cors.ALL_METHODS,
            },});

        const catalogItemsQueue = Queue.fromQueueArn(
            this,
            "ImportFileQueue",
            process.env.SQS_ARN!,
        );

        catalogItemsQueue.grantSendMessages(parseProductsFile);

        const basicAuthorizer = lambda.Function.fromFunctionAttributes(
            this,
            'basicAuthorizer',
            { functionArn: process.env.AUTHORIZATION_ARN!, sameEnvironment: true }
        );

        const tokenAuthorizer = new apigateway.TokenAuthorizer(this, 'TokenAuthorizerBakharava', {
            handler: basicAuthorizer,
            authorizerName: 'authorizerBakharava'
        });

        const uploadFileAPI = api.root.addResource('import');
        uploadFileAPI.addMethod('GET', new apigateway.LambdaIntegration(importProductsFile), {
            requestParameters: {
                "method.request.querystring.name": true,
            },
            authorizer: tokenAuthorizer,
            authorizationType: apigateway.AuthorizationType.CUSTOM,
        });

        importBucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3notification.LambdaDestination(parseProductsFile),
            { prefix: 'uploaded/' }
        );
    }
}