FROM node:24-bullseye-slim

WORKDIR /app

# Install Doppler and basic tools
RUN apt-get update && apt-get install -y apt-transport-https curl && \
    curl -Ls https://cli.doppler.com/install.sh | sh

# Install dependencies first for caching layer
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Spec compliance: Server 1 must listen on 8080
EXPOSE 8080

CMD ["doppler", "run", "--", "node", "src/server.js"]
