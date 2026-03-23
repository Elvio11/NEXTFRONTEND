const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
require('dotenv').config({ path: 'c:\\Users\\DELL\\Antigravity\\Talvix\\branch-server1\\.env' });

async function listBuckets() {
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
    const data = await s3.send(new ListBucketsCommand({}));
    console.log('---BUCKETS_START---');
    if (data.Buckets) {
      data.Buckets.forEach(b => console.log('Bucket:', b.Name));
    } else {
      console.log('No buckets found.');
    }
    console.log('---BUCKETS_END---');
  } catch (err) {
    console.error('ERROR:', err);
  }
}

listBuckets();
