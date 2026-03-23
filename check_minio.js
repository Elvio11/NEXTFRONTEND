const { S3Client, ListObjectsV2Command } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: 'c:\\Users\\DELL\\Antigravity\\Talvix\\branch-server1\\.env' });

async function check() {
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
    const data = await s3.send(new ListObjectsV2Command({
      Bucket: process.env.MINIO_BUCKET,
      Prefix: 'uploads/00000000-0000-0000-0000-000000000000'
    }));
    console.log('---LISTING_START---');
    if (data.Contents) {
      data.Contents.forEach(obj => console.log('Found:', obj.Key));
    } else {
      console.log('No files found for this user.');
    }
    console.log('---LISTING_END---');
  } catch (err) {
    console.error('ERROR:', err);
  }
}

check();
