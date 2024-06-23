import {productsData} from "../mocks/productsData";

exports.handler = async (event: any, context: any) => {
    const productId = event['pathParameters']['productId']
    const product = productsData.find(product=> product.id === productId);
    if (product) {
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, Delete, OPTIONS",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(product),
        };
    }

    return {
        statusCode: 404,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, Delete, OPTIONS",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: "Product not found" }),
    };
};