import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mocked } from "jest-mock";
import {handler} from "../import-service/lambda/importProductsFile";

jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner");

const mockedClient = mocked(S3Client, { shallow: true });
const mockedGetSignedUrl = mocked(getSignedUrl, { shallow: true });

describe('Import file handler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 400 error if name is empty', async () => {
        const event = {
            queryStringParameters: null
        };

        const response = await handler(event as any);

        expect(response.body).toEqual({ message: "Missing file name to upload" });
    });

    it('should return signed URL if name is not empty', async () => {
        const event = {
            queryStringParameters: {
                name: 'product.csv'
            }
        };

        mockedGetSignedUrl.mockResolvedValue('http://pre-signed-url');

        const response = await handler(event as any);

        expect(response.body).toEqual('http://pre-signed-url');
        expect(mockedGetSignedUrl).toHaveBeenCalledWith(
            expect.any(mockedClient),
            expect.any(PutObjectCommand),
            { expiresIn: 3600 }
        );
    });

    it('should return 500 if getting signed URL fails', async () => {
        const event = {
            queryStringParameters: {
                name: 'product.csv'
            }
        };

        mockedGetSignedUrl.mockRejectedValue(new Error('Error'));

        const response = await handler(event as any);

        expect(response.statusCode).toEqual(500);
        expect(response.body).toEqual({ message: "Something went wrong" });
    });
});