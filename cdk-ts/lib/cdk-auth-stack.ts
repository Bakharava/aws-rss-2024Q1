import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
    Function,
    Runtime,
    Code,
} from "aws-cdk-lib/aws-lambda";
import 'dotenv/config';
import * as lambda from "aws-cdk-lib/aws-lambda";

export class CdkAuthStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        new Function(
            this,
            "BasicAuthorizerHandler",
            {
                runtime: Runtime.NODEJS_20_X,
                code: lambda.Code.fromAsset('authorization-service/lambda'),
                handler: "basicAuthorizer.handler",
                environment: {
                    ['Bakharava']: process.env.Bakharava!,
                }
            },
        );
    }
}