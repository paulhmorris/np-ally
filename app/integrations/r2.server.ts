import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_BUCKET_URL,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export function uploadFile(file: File, key: string) {
  const command = new PutObjectCommand({
    Bucket: "alliance-admin",
    Key: key,
    Body: file,
    ContentType: file.type,
    ContentLength: file.size,
  });
  return r2.send(command);
}
