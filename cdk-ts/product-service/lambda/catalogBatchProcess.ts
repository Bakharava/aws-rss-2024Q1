import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { v4 as uuidv4 } from 'uuid';
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TransactWriteItem, TransactWriteItemsCommand } from "@aws-sdk/client-dynamodb";

const checkIsBodyValid = (body: any) =>
    body?.title &&
    body?.description &&
    body?.price &&
    body?.count;

const client = new DynamoDBClient({});
const dynamoDocumentClient = DynamoDBDocumentClient.from(client);
const snsClient = new SNSClient({});
const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET",
    "Content-Type": "application/json"
}
// @ts-ignore
export const handler = async (event) => {
    console.log('Catalog batch process event ', event);
    const SNSItemsList = [];
    const transactItems: TransactWriteItem[] = [];

    try {
        const records = event.Records;
        console.log('Records: ', records);

        for (const record of records) {
            const body = JSON.parse(record.body);
            console.log('Body: ', body);

            if (!checkIsBodyValid(body)) {
                console.log('Body is not valid')

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

            const SNSItem = { ...newProduct, count: newStock.count };
            SNSItemsList.push(SNSItem);
            transactItems.push({
                Put: {
                    TableName: process.env.PRODUCTS_TABLE,
                    Item: marshall(newProduct)
                }
            },{
                Put: {
                    TableName: process.env.STOCK_TABLE,
                    Item: marshall(newStock)
                }
            })
        }
            await dynamoDocumentClient.send(new TransactWriteItemsCommand({
                TransactItems: transactItems,
            }));

                const snsMsg = `Product is successfully saved!`;
                await snsClient.send(
                    new PublishCommand({
                        Subject: 'Add new product',
                        TopicArn: process.env.SNS_ARN,
                        Message: snsMsg,
                        MessageAttributes: {
                            count: {
                             DataType: 'Number',
                             StringValue: String(SNSItemsList.length),
                         },
                    },
                }));

            return {
                statusCode: 201,
                headers,
                body: { message: 'Data from the .csv file is written to the database successfully'},
            };

    } catch (error) {
        console.error('Writing data to .csv file is failed with error: ', error);

        return {
            statusCode: 500,
            headers,
            body: error,
        };
    }
};