# Stage 1: Builder
FROM node:24-bullseye-slim AS builder

WORKDIR /app

# Install build dependencies if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install global tools
RUN npm install -g mcporter

# Install production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Stage 2: Runner
FROM node:24-bullseye-slim

WORKDIR /app

# Copy production node_modules and global tools from builder
COPY --from=builder /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app/node_modules ./node_modules

# Copy application source
COPY . .

# Spec compliance: Server 1 must listen on 8080
ENV PORT=8080
EXPOSE 8080

CMD ["node", "src/server.js"]
