# Stage 1: Builder
FROM python:3.11.9-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install build tools, Node.js, and many system dependencies required by Playwright/MCP tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    git \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm config set prefix /usr/local \
    && npm install -g @mcporter/cli

# Install MCP tools individually for better resilience and debugging
RUN mcporter install playwright
RUN mcporter install firecrawl
RUN mcporter install markitdown
RUN mcporter install tavily
RUN mcporter install mcp-gmail

# Create virtual environment and install Python dependencies
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Stage 2: Final
FROM python:3.11.9-slim

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install minimal runtime dependencies (curl for Node.js, libss3 for Playwright)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment and global Node.js tools from builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin /usr/local/bin
# Copy mcporter config/tools if they are in home
COPY --from=builder /root/.mcporter /root/.mcporter

# Set environment paths
ENV PATH="/opt/venv/bin:$PATH"
ENV PORT=8080

# Copy application source
COPY . .

# Ensure start script is executable
RUN chmod +x /app/start.sh

EXPOSE 8080

ENTRYPOINT ["sh", "/app/start.sh"]
