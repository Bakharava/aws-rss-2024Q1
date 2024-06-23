import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, ScanCommand} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event: any, context: any) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, Delete, OPTIONS",
        "Content-Type": "application/json"
    }

    try {
        const productId = event['pathParameters']['productId']
        const { Items: products } = await documentClient.send(new ScanCommand({ TableName: 'Products' }));

        const product = products?.find(product => product.id === productId);

        if(!product) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ message: "Product not found" }),
            };
        }

        const stocksTableParams = {
            TableName: 'Stock',
            Key: {
                product_id: productId,
            },
        };
        const { Item: stock } = await documentClient.send(new GetCommand(stocksTableParams));

        const productWithStock = { ...product, count: stock?.count };

        if (productWithStock && productWithStock.count > 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(productWithStock),
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: "Product out of stock" }),
        };

    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ message: "Something went wrong" }),
        };
    }
};