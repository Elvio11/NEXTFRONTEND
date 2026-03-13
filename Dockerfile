FROM quay.io/minio/minio:latest

ENV MINIO_ROOT_USER=${MINIO_ROOT_USER:-admin}
ENV MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD:-password123}

EXPOSE 9000
EXPOSE 9001

CMD ["server", "/data", "--console-address", ":9001"]
