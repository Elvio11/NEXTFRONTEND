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

/**
 * Download a file from MinIO as a buffer or string.
 */
async function downloadFile(key, asString = false) {
  const command = new GetObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
  });
  const response = await getS3().send(command);
  const body = await response.Body.transformToByteArray();
  const buffer = Buffer.from(body);
  return asString ? buffer.toString("utf-8") : buffer;
}

/**
 * Delete a file from MinIO.
 */
async function deleteFile(key) {
  const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
  const command = new DeleteObjectCommand({
    Bucket: process.env.MINIO_BUCKET,
    Key: key,
  });
  return await getS3().send(command);
}

/**
 * Check if a file exists in MinIO.
 */
async function getFileExists(key) {
  const { HeadObjectCommand } = require("@aws-sdk/client-s3");
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: key,
    });
    await getS3().send(command);
    return true;
  } catch (err) {
    if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) return false;
    throw err;
  }
}

module.exports = { getPresignedUrl, uploadFile, downloadFile, deleteFile, getFileExists };
