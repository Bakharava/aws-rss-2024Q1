import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const checkIsBodyValid = (body: any) =>
    typeof body?.title === 'string' &&
    typeof body?.description === 'string' &&
    typeof body?.price === 'number' &&
    typeof body?.count === 'number';

const client = new DynamoDBClient({});
const dynamoDocumentClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient();
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
}
// @ts-ignore
export const handler = async (event) => {
    console.log('Catalog batch process event ', event);

    try {
        const records = event.Records;
        console.log('Records: ', records);

        for (const record of records) {
            const body = JSON.parse(record.body);
            console.log('Body: ', body);

            if (!checkIsBodyValid(body)) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ message: 'Body is not valid'}),
                };
            }

            const { description, title, price, count } = body;
            const id = uuidv4();

            const newProduct = {
                id,
                title: title,
                description: description,
                price: Number(price),
            };

            const newStock = {
                product_id: id,
                count: Number(count),
            };

            await dynamoDocumentClient.send(new TransactWriteCommand({
                TransactItems: [
                    {
                        Put: {
                            TableName: process.env.PRODUCTS_TABLE,
                            Item: marshall(newProduct)
                        }
                    },
                    {
                        Put: {
                            TableName: process.env.STOCKS_TABLE,
                            Item: marshall(newStock)
                        }
                    }
                ]
            }));

            try {
                const snsMsg = `Product ${title} with id: ${id} successfully saved!`;
                await snsClient.send(new PublishCommand({
                    Subject: 'Add new product',
                    TopicArn: process.env.SNS_ARN,
                    Message: snsMsg,
                    MessageAttributes: {
                        count: {
                            DataType: 'Number',
                            StringValue: String(count),
                        },
                    },
                }));

                console.log('SNS message', snsMsg);
            } catch (error) {
                console.log('Send in SNS is failed with error: ', error);
            }
        }

        console.log('Data from the .csv file is written to the database successfully');
    } catch (error) {
        console.error('Writing data to .csv file is failed with error: ', error);
    }

    return null;
};