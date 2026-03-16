FROM node:24-bullseye-slim

WORKDIR /app

# Install dependencies first for caching layer
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Spec compliance: Server 1 must listen on 8080
EXPOSE 8080

CMD ["node", "src/server.js"]
