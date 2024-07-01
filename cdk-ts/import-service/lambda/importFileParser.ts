import { CopyObjectCommand, DeleteObjectCommand ,GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as csv from "csv-parser";
import { Readable } from "stream";

const client = new S3Client({});

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

    const bucketName = event.Records[0].s3.bucket.name;
    const key = event.Records[0].s3.object.key;

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
                .pipe(csv())
                .on("data", (data) => results.push(data))
                .on("end", async () => {
                    console.log("Data res: ", results);
                    await client.send(
                        new CopyObjectCommand({
                            Bucket: bucketName,
                            CopySource: `${bucketName}/${key}`,
                            Key: key.replace('uploaded', 'parsed'),
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