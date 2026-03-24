# Stage 1: Builder
FROM python:3.11.9-slim AS builder

ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install build tools, Node.js, and mcporter
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    build-essential \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npm config set prefix /usr/local \
    && npm install -g mcporter @playwright/mcp playwright

# Install playwright system dependencies and Chromium browser
RUN npx playwright install-deps \
    && npx playwright install chromium

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

# Install minimal runtime dependencies + Playwright system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && npx playwright install-deps \
    && apt-get purge -y nodejs \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment and global Node.js tools from builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /root/.mcporter /root/.mcporter
# Copy playwright browsers from builder (stored in /root/.cache/ms-playwright)
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright

# Set environment paths
ENV PATH="/opt/venv/bin:$PATH"
ENV PORT=8080

# Copy application source
COPY . .

# Ensure start script is executable
RUN chmod +x /app/start.sh

EXPOSE 8080

ENTRYPOINT ["sh", "/app/start.sh"]
