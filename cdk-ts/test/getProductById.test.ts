const {handler: productHandler} = require('../product-service/lambda/getProductById');

describe('Get product by id',  () => {
    it('should return message product not found', async () => {
        const response = await productHandler( {pathParameters: {productId: 12}})
        expect(response.body).toEqual(JSON.stringify({ message: "Product not found" }))
    });

    it('should return message product not found', async () => {
        const response = await productHandler( {pathParameters: {productId: '7567ec4b-b10c-45c5-9345-fc73c48a80a1'}})
        expect(response.body).toEqual(JSON.stringify({
            description: "Short Product Description7",
            id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
            price: 15,
            title: "ProductName",
        }))
    });
})