const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

let _s3Client = null;

function getS3() {
  if (!_s3Client) {
    _s3Client = new S3Client({
      endpoint: process.env.S4_URL,  // FluxCloud URL → :9000
      region: "us-east-1",
      credentials: {
        accessKeyId: process.env.MINIO_ROOT_USER,
        secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
      },
      forcePathStyle: true,  // Required for MinIO
    });
  }
  return _s3Client;
}

async function getPresignedUrl(key, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
  });
  return await getSignedUrl(getS3(), command, { expiresIn });
}

async function uploadFile(key, body, contentType) {
  const command = new PutObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  return await getS3().send(command);
}

module.exports = { getPresignedUrl, uploadFile };
