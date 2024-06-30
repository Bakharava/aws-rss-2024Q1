import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const client = new S3Client({});
const bucketName = process.env.BUCKET_NAME;
const key = process.env.BUCKET_FOLDER_NAME;

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
        body: JSON.stringify(body),
    };
};

exports.handler = async (event: any) => {
    console.log('Upload file with products list event', event);

    try {
        const uploadedFileName = event.queryStringParameters?.name;

        if (!uploadedFileName) {
            return setResponse(400, { message: "Missing file name to upload" });
        }

        const command = new PutObjectCommand({
                Bucket: bucketName,
                Key: `${key}/${uploadedFileName}`,
                ContentType: 'text/csv',
            });

        const signedUrl = await getSignedUrl(
            client,
            command,
            { expiresIn: 3600 },
        );

        return setResponse(200, { url: signedUrl });
    } catch (err) {
        return setResponse(500, { message: "Something went wrong" });
    }
};