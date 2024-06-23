import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event: any) => {
    console.log('Get products list event', event);

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, Delete, OPTIONS",
        "Content-Type": "application/json"
    }

    try {
        const { Items: products } = await documentClient.send(new ScanCommand({ TableName: process.env.PRODUCTS_TABLE }));
        const { Items: stocks } = await documentClient.send(new ScanCommand({ TableName: process.env.STOCK_TABLE }));



        const productsWithStock = products?.map((product) => ({
            ...product,
            count: stocks?.find(({ product_id }) => product_id === product.id)?.count,
        }));

        if (productsWithStock) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(productsWithStock),
            };
        }

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Products not found" }),
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Something went wrong" }),
        };
    }
};