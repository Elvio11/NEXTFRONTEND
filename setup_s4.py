import boto3
import os
from botocore.client import Config

# Assuming defaults designed in docker-compose.yml
s4_url = os.environ.get('S4_URL', 'http://localhost:9000')
access_key = os.environ.get('MINIO_ACCESS_KEY', 'admin')
secret_key = os.environ.get('MINIO_SECRET_KEY', 'password123')

print(f"Connecting to MinIO at {s4_url}")

s3 = boto3.client('s3', endpoint_url=s4_url, 
                  aws_access_key_id=access_key,
                  aws_secret_access_key=secret_key,
                  config=Config(signature_version='s3v4'), region_name='us-east-1')

bucket_name = 'talvix'

try:
    s3.create_bucket(Bucket=bucket_name)
    print(f"Bucket '{bucket_name}' created successfully.")
except Exception as e:
    if 'BucketAlreadyOwnedByYou' in str(e) or 'BucketAlreadyExists' in str(e):
        print(f"Bucket '{bucket_name}' already exists.")
    else:
        print(f"Error creating bucket: {e}")

# Verify bucket exists
buckets = s3.list_buckets()
print("Current buckets:", [b['Name'] for b in buckets['Buckets']])
