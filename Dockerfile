# Stage 1: Builder
FROM python:3.11.9-slim AS builder

WORKDIR /app

# Install build dependencies, Node.js, and mcporter
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    libpq-dev \
    libopenblas-dev \
    libomp-dev \
    curl \
    git \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm config set prefix /usr/local \
    && npm install -g mcporter

# Create virtual environment and install Python dependencies
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir torch==2.2.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# Stage 2: Final
FROM python:3.11.9-slim

WORKDIR /app

# Install runtime dependencies (e.g., libpq for postgres, curl for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment and global Node.js tools from builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin /usr/local/bin

# Set environment paths
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PORT=8080

# Copy application source
COPY . .

# Ensure start script is executable
RUN chmod +x /app/start.sh

EXPOSE 8080

ENTRYPOINT ["sh", "/app/start.sh"]
