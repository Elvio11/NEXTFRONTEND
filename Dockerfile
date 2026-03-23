# Stage 1: Builder - Install build dependencies and compile Python packages
FROM python:3.11.9-slim as builder

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build-time dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

COPY requirements.txt .

# 1. Install torch CPU version specifically to avoid CUDA bloat (~2GB savings)
# 2. Install the rest of the dependencies
RUN pip install --no-cache-dir torch>=2.0,<3.0 --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime - Minimal image for execution
FROM python:3.11.9-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

# Install runtime dependencies:
# - libpq5: Required for psycopg2 (PostgreSQL)
# - Node.js: Required for mcporter CLI
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g mcporter \
    && apt-get purge -y --auto-remove curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code (obeying .dockerignore)
COPY . .

RUN chmod +x /app/start.sh

EXPOSE 8080

ENTRYPOINT ["sh", "/app/start.sh"]
