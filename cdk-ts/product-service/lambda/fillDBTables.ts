import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

export const productsData = [
    {
        description: "Short Product Description1",
        id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
        price: 24,
        title: "ProductOne",
    },
    {
        description: "Short Product Description7",
        id: "7567ec4b-b10c-48c5-9345-fc73c48a80a1",
        price: 15,
        title: "ProductTitle",
    },
    {
        description: "Short Product Description2",
        id: "7567ec4b-b10c-48c5-9345-fc73c48a80a3",
        price: 23,
        title: "Product",
    },
    {
        description: "Short Product Description4",
        id: "7567ec4b-b10c-48c5-9345-fc73348a80a1",
        price: 15,
        title: "ProductTest",
    },
    {
        description: "Short Product Descriptio1",
        id: "7567ec4b-b10c-48c5-9445-fc73c48a80a2",
        price: 23,
        title: "Product2",
    },
    {
        description: "Short Product Description7",
        id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
        price: 15,
        title: "ProductName",
    },
];

export const stockData = [
    {
        product_id: '7567ec4b-b10c-48c5-9345-fc73c48a80aa',
        count: 8,
    },
    {
        product_id: '7567ec4b-b10c-48c5-9345-fc73c48a80a1',
        count: 5,
    },
    {
        product_id: '7567ec4b-b10c-48c5-9345-fc73c48a80a3',
        count: 9,
    },
    {
        product_id: '7567ec4b-b10c-48c5-9345-fc73348a80a1',
        count: 3,
    },
    {
        product_id: '7567ec4b-b10c-48c5-9445-fc73c48a80a2',
        count: 7,
    },
    {
        product_id: '7567ec4b-b10c-45c5-9345-fc73c48a80a1',
        count: 4,
    },
];

export const handler = async () => {
    try {
        const tableNameForProducts = 'Products';

        if (!tableNameForProducts) {
            console.error('Table name for products is missing');
        }

        const productsTableWriteCommand = new BatchWriteCommand({
            RequestItems: {
                [tableNameForProducts]: productsData.map((item) => ({
                    PutRequest: { Item: item },
                })),
            },
        });
        await documentClient.send(productsTableWriteCommand);

        const tableNameForStock = 'Stock';

        if (!tableNameForStock) {
            console.error('Table name for stock is missing');
        }

        const stockTableWriteCommand = new BatchWriteCommand({
            RequestItems: {
                [tableNameForStock]: stockData.map((item) => ({
                    PutRequest: { Item: item },
                })),
            },
        });
        await documentClient.send(stockTableWriteCommand);

    } catch (error) {
        console.error(error);
    }
};