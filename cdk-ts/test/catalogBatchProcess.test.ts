import { handler } from '../product-service/lambda/catalogBatchProcess';


jest.mock('@aws-sdk/lib-dynamodb', () => {
    const client = { send: jest.fn() };
    return {
        DynamoDBClient: jest.fn(() => client),
        DynamoDBDocumentClient: {
            from: jest.fn(() => client),
        },
        marshall: jest.fn(),
    };
});

jest.mock('@aws-sdk/client-sns', () => {
    return {
        SNSClient: jest.fn(() => ({ send: jest.fn() })),
        PublishCommand: jest.fn(),
    };
});

describe('CatalogBatchProcess handler ', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should return a 400 in case of invalid body", async () => {
        const event = {
            Records: [
                {
                    body:  JSON.stringify({
                        title: "Test title",
                        price: 18,
                        count: 4
                    }),
                },
            ],
        };
        const response = await handler(event);

        const message = response.body as string;
        expect(message).toEqual(JSON.stringify({ message: 'Body is not valid'}));
        expect(response.statusCode).toBe(400);
    });

    it('should return 201 status when product is successfully added', async () => {
        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        title: 'Test Product',
                        description: 'Test Description',
                        price: 100,
                        count: 10,
                    }),
                },
            ],
        };

        const response = await handler(event);

        const message = response.body as string;

        expect(message).toEqual("Product is successfully saved!");
        expect(response.statusCode).toEqual(201);
    });
});