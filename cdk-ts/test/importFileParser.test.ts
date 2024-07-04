import { handler } from '../import-service/lambda/importFileParser';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

jest.mock('@aws-sdk/client-s3', () => {
    const originalModule = jest.requireActual('@aws-sdk/client-s3');

    class MockS3Client extends originalModule.S3Client {
        // @ts-ignore
        send(command: any) {
            if (command instanceof originalModule.GetObjectCommand) {
                const mockData = new Readable();
                mockData.push('test data');
                mockData.push(null);
                return Promise.resolve({ Body: mockData });
            } else if (command instanceof originalModule.CopyObjectCommand || command instanceof originalModule.DeleteObjectCommand) {
                return Promise.resolve();
            }
        }
    }

    return {
        ...originalModule,
        S3Client: MockS3Client,
    };
});
jest.mock('csv-parser');

describe('Parse imported file handler', () => {
    it('should process s3 records', async () => {
        const mockEvent = {
            Records: [
                {
                    s3: {
                        bucket: {
                            name: 'import-bucket',
                        },
                        object: {
                            key: 'uploaded/product.csv',
                        },
                    },
                },
            ],
        };

        const mockData = new Readable();
        mockData.push('test data');
        mockData.push(null);

        // @ts-ignore
        (csv as jest.MockedFunction<typeof csv>).mockImplementation(() => {
            const transform = new Readable({ objectMode: true });
            transform.push({ test: 'data' });
            transform.push(null);
            return transform;
        });

        const result = await handler(mockEvent);

        expect(result.body).toEqual({ message: 'File successfully parsed' });
    });
});