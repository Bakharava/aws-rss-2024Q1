import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

const checkIsBodyValid = (body: any) =>
    typeof body?.title === 'string' &&
    typeof body?.description === 'string' &&
    typeof body?.price === 'number' &&
    typeof body?.count === 'number';

export const handler = async (event: any) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, Delete, OPTIONS",
        "Content-Type": "application/json"
    }

    try {
        const body = event.body;

        if (!checkIsBodyValid(body)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Body is not valid'}),
            };
        }

        const newProductId = uuidv4();
        const newProduct = {
            id: newProductId,
            title: body?.title,
            description: body?.description,
            price: body?.price,
        };

        const newStockItem = {
            product_id: newProductId,
            count: body?.count,
        };

        await documentClient.send(new TransactWriteCommand({
            TransactItems: [
                {
                    Put: {
                        TableName: process.env.PRODUCTS_TABLE,
                        Item: newProduct
                    }
                },
                {
                    Put: {
                        TableName: process.env.STOCK_TABLE,
                        Item: newStockItem
                    }
                }
            ]
        }));

        const productWithStock = {
            ...newProduct,
            count: newStockItem?.count,
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(productWithStock),
        };
    } catch (err) {
        console.error(err)
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: 'Something went wrong'}),
        };
    }
};