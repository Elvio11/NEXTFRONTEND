const { S3Client, CreateBucketCommand } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: 'c:\\Users\\DELL\\Antigravity\\Talvix\\branch-server1\\.env' });

async function createBucket() {
  const s3 = new S3Client({
    endpoint: process.env.S4_URL,
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.MINIO_ROOT_USER,
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD,
    },
    forcePathStyle: true,
  });

  try {
    await s3.send(new CreateBucketCommand({
      Bucket: process.env.MINIO_BUCKET,
    }));
    console.log(`Bucket "${process.env.MINIO_BUCKET}" created successfully.`);
  } catch (err) {
    console.error('ERROR:', err);
  }
}

createBucket();
