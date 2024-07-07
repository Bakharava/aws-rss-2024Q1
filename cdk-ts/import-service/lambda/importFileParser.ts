import { CopyObjectCommand, DeleteObjectCommand ,GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import * as csv from "csv-parser";
import { PassThrough, Readable } from "stream";

const client = new S3Client({});
const sqsClient = new SQSClient({});

export const setResponse = (
    statusCode: number = 200,
    body = {},
) => {
    return {
        statusCode,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Methods": "*",
            "Content-Type": "application/json",
        },
        body: body,
    };
};

export const handler = async (event: any) => {
    console.log('Upload file with products list event', event);

    let bucketName: any;
    let key: any;

    for (const record of event.Records) {
        bucketName = record.s3.bucket.name;
        key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
    }

    try {
        const paramsForCommands = {Bucket: bucketName, Key: key}
        const response = await client.send(new GetObjectCommand(paramsForCommands));
        const data = response.Body as Readable;

        if (!data) {
            throw new Error("Error of reading data from S3");
        }
        const results: any[] = [];
        await new Promise<void>((resolve, reject) => {
            data
                .pipe(new PassThrough())
                .pipe(csv())
                .on("data", async (data) => {
                        await sqsClient.send(new SendMessageCommand({
                            QueueUrl: process.env.SQS_QUEUE_URL,
                            MessageBody: JSON.stringify(data)
                        }));
                        console.log('Sent to SQS successfully');
                })
                .on("end", async () => {
                    console.log("Data res: ", results);
                    await client.send(
                        new CopyObjectCommand({
                            Bucket: bucketName,
                            CopySource: `${bucketName}/${key}`,
                            Key: key.replace('uploaded/', 'parsed/'),
                        })
                    );
                    await client.send(
                        new DeleteObjectCommand(paramsForCommands)
                    );
                    resolve();
                })
                .on("error", (error) => {
                    reject(error);
                });
        });
        return setResponse(200, { message: 'File successfully parsed' });
    } catch (err) {
        return setResponse(500, { message: `Something went wrong. Error: ${err}` });
    }
};